import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  ChevronRight,
  FileWarning,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ServerCog,
  Shield,
  Truck,
  X,
} from "lucide-react";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { TopNav } from "@/components/aura/AppShell";
import { AuraBadge, StatCard, StatusDot } from "@/components/aura/primitives";
import { CreateReportModal } from "@/components/aura/CreateReportModal";
import { VehicleDetailDrawer } from "@/components/aura/VehicleDetailDrawer";
import { HasRole } from "@/components/aura/HasRole";
import { useActiveEvents, useEscalateEvent } from "@/queries/useEventsQuery";
import { useAnalyticsSummary } from "@/queries/useAnalyticsQuery";
import { useClusteredMarkers } from "@/queries/useGisTilesQuery";
import { useEmergencyUnits, useNearestEmergencyUnits } from "@/queries/useEmergencyUnitsQuery";
import { useUserNotifications } from "@/queries/useNotificationsQuery";
import { disasterMeta, isAuthenticated, type EmergencyUnitDto } from "@/lib/api-client";
import {
  startSignalRConnection,
  onEventCreated,
  onReportStatusChanged,
} from "@/lib/signalr-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    lat: typeof search.lat === "number" ? search.lat : (search.lat ? Number(search.lat) : undefined),
    lng: typeof search.lng === "number" ? search.lng : (search.lng ? Number(search.lng) : undefined),
  }),
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Command Center — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Realtime crisis command center for emergency response teams: live disaster feed, risk layers, system health and chronological replay over Istanbul and Türkiye.",
      },
      { property: "og:title", content: "Command Center — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Realtime disaster monitoring and coordination for emergency response centers.",
      },
    ],
  }),
  component: CommandCenter,
});

const windows = ["24 Hours", "72 Hours", "7 Days"];
const speeds = ["1x", "2x", "5x"];

type NotificationItem = {
  id: string;
  tone: "online" | "warning" | "critical" | "info";
  title: string;
  body: string;
};

const mapLayers = [
  { key: "earthquake", label: "Deprem", color: "#ef4444" },
  { key: "flood", label: "Sel & Taşkın", color: "#0ea5e9" },
  { key: "wildfire", label: "Yangın", color: "#f59e0b" },
  { key: "report", label: "Vatandaş İhbarı", color: "#eab308" },
  { key: "heatmap", label: "Isı Haritası", color: "#ec4899" },
  { key: "risk", label: "PostGIS Risk Poligonları", color: "#a855f7" },
] as const;

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-foreground/5 p-0.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-200",
            value === o
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function CommandCenter() {
  const [selectedId, setSelected] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<EmergencyUnitDto | null>(null);
  const [clickPoint, setClickPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({
    earthquake: true,
    flood: true,
    wildfire: true,
    report: true,
    heatmap: false,
    risk: true,
  });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(100);
  const [win, setWin] = useState("24 Hours");
  const [speed, setSpeed] = useState("1x");
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [isEventFeedOpen, setIsEventFeedOpen] = useState(true);
  const [isFleetOpen, setIsFleetOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);

  const { data: events = [] } = useActiveEvents();
  const { data: summary } = useAnalyticsSummary();
  const { data: units = [] } = useEmergencyUnits();
  const escalateMutation = useEscalateEvent();

  // 1. Filter events by selected time window (24 Hours, 72 Hours, 7 Days)
  const windowedEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    const hoursMap: Record<string, number> = {
      "24 Hours": 24,
      "72 Hours": 72,
      "7 Days": 168,
    };
    const hours = hoursMap[win] || 24;
    const cutoffMs = Date.now() - hours * 60 * 60 * 1000;

    const filtered = events.filter((e) => {
      const t = new Date(e.detectedAt).getTime();
      return !isNaN(t) && t >= cutoffMs;
    });

    return filtered.length > 0 ? filtered : events;
  }, [events, win]);

  // 2. Calculate chronological start/end time bounds for replay timeline
  const timeBounds = useMemo(() => {
    if (!windowedEvents || windowedEvents.length === 0) {
      const now = Date.now();
      return { minTime: now - 86400000, maxTime: now };
    }
    const times = windowedEvents
      .map((e) => new Date(e.detectedAt).getTime())
      .filter((t) => !isNaN(t));

    if (times.length === 0) {
      const now = Date.now();
      return { minTime: now - 86400000, maxTime: now };
    }

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    if (maxTime - minTime < 3600000) {
      return { minTime: maxTime - 3600000, maxTime };
    }

    return { minTime, maxTime };
  }, [windowedEvents]);

  // 3. Playback timer for timeline replay animation
  useEffect(() => {
    if (!playing) return;

    const speedMultipliers: Record<string, number> = {
      "1x": 0.8,
      "2x": 2.0,
      "3x": 4.5,
    };
    const step = speedMultipliers[speed] || 0.8;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setPlaying(false);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [playing, speed]);

  // 4. Chronologically filtered active events for map rendering and live feed
  const displayEvents = useMemo(() => {
    if (progress >= 100) return windowedEvents;
    const currentCutoff = timeBounds.minTime + (timeBounds.maxTime - timeBounds.minTime) * (progress / 100);
    return windowedEvents.filter((e) => {
      const t = new Date(e.detectedAt).getTime();
      return isNaN(t) || t <= currentCutoff;
    });
  }, [windowedEvents, timeBounds, progress]);

  const { data: nearestUnits = [] } = useNearestEmergencyUnits(
    clickPoint?.lat ?? null,
    clickPoint?.lng ?? null,
    5
  );

  const { data: clusters = [] } = useClusteredMarkers({
    minLat: 35.0,
    minLng: 25.0,
    maxLat: 43.0,
    maxLng: 45.0,
    zoom: zoomLevel,
  });

  const { data: dbNotifications = [] } = useUserNotifications(5);

  useEffect(() => {
    startSignalRConnection();

    const unsubEvent = onEventCreated((newEvent) => {
      setNotes((prev) => [
        {
          id: `${newEvent.id}-${Date.now()}`,
          tone: newEvent.severity >= 80 ? "critical" : "warning",
          title: `Yeni ${newEvent.source} Uyarısı: ${newEvent.title}`,
          body: `${newEvent.district} · Şiddet: ${newEvent.severity}`,
        },
        ...prev,
      ]);
    });

    const unsubReport = onReportStatusChanged((report) => {
      setNotes((prev) => [
        {
          id: `${report.id}-${Date.now()}`,
          tone: report.status === "Verified" ? "online" : "warning",
          title: `İhbar Güncellendi: ${report.title}`,
          body: `${report.district} · Durum: ${report.status}`,
        },
        ...prev,
      ]);
    });

    return () => {
      unsubEvent();
      unsubReport();
    };
  }, []);

  useEffect(() => {
    if (dbNotifications.length > 0 && notes.length === 0) {
      const initialNotes: NotificationItem[] = dbNotifications.map((n) => ({
        id: n.id,
        tone: n.type === "CriticalEvent" || n.type === "EmergencyDispatch" ? "critical" : "online",
        title: n.title,
        body: n.message,
      }));
      setNotes(initialNotes);
    }
  }, [dbNotifications, notes.length]);

  const selectedEvent = events.find((e) => e.id === selectedId);

  const availableUnitsCount = units.filter((u) => u.status === "Available").length;
  const dispatchedUnitsCount = units.filter((u) => u.status === "Dispatched" || u.status === "OnScene").length;

  const handleToggle = useCallback((key: string) => {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleMapClick = useCallback((point: { lat: number; lng: number }) => {
    setClickPoint(point);
  }, []);

  const handleClusterSelect = useCallback((c: any) => {
    if (c.pointCount === 1) {
      const found = events.find((e) => e.id === c.clusterId) ||
                    events.find((e) => Math.abs(e.latitude - c.latitude) < 0.05 && Math.abs(e.longitude - c.longitude) < 0.05);
      if (found) {
        setSelected(found.id);
      } else {
        setZoomLevel((z) => Math.min(18, z + 3));
        setClickPoint({ lat: c.latitude, lng: c.longitude });
      }
    } else {
      setZoomLevel((z) => Math.min(18, z + 3));
      setClickPoint({ lat: c.latitude, lng: c.longitude });
    }
  }, [events]);

  const handleSelectEvent = useCallback((e: EventDto) => {
    setSelected(e.id);
  }, []);

  const handleSelectUnit = useCallback((u: EmergencyUnitDto) => {
    setSelectedUnit(u);
  }, []);

  const searchParams = Route.useSearch();
  const searchBufferPoint = useMemo(() => {
    if (clickPoint) {
      return { lat: clickPoint.lat, lng: clickPoint.lng, radiusMeters: 3000 };
    }
    if (searchParams.lat && searchParams.lng) {
      return { lat: searchParams.lat, lng: searchParams.lng, radiusMeters: 5000 };
    }
    return null;
  }, [clickPoint, searchParams.lat, searchParams.lng]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <MapCanvas
        events={displayEvents}
        clusters={clusters}
        units={units}
        active={active}
        selectedId={selectedId}
        selectedUnitId={selectedUnit?.id}
        bufferPoint={searchBufferPoint}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onSelect={handleSelectEvent}
        onClusterSelect={handleClusterSelect}
        onUnitSelect={handleSelectUnit}
        onMapClick={handleMapClick}
        className="absolute inset-0 h-full w-full border-none rounded-none"
      />

      <TopNav floating />

      <div className="pointer-events-none absolute left-[392px] right-[332px] top-[76px] z-30 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          className="pointer-events-auto"
          label="Aktif Afetler"
          value={displayEvents.length.toString()}
          delta="Canlı Veri"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="Saha Filosu"
          value={`${units.length} Araç`}
          tone="online"
          delta={`${availableUnitsCount} Müsait / ${dispatchedUnitsCount} Görevde`}
          icon={<Truck className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="Max Büyüklük"
          value={
            summary && summary.highestEarthquakeMagnitude > 0
              ? `${summary.highestEarthquakeMagnitude.toFixed(1)} ML`
              : "Bekleniyor"
          }
          tone="critical"
          delta="Kandilli Akışı"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="İzlenen İlçeler"
          value={summary ? `${summary.totalDistrictsMonitored}` : "14"}
          tone="online"
          delta="PostGIS KNN Active"
          icon={<ServerCog className="h-3.5 w-3.5" />}
        />
      </div>

      {isEventFeedOpen ? (
        <aside className="absolute bottom-28 left-6 top-[76px] z-40 flex w-[352px] flex-col overflow-hidden rounded-xl glass animate-fade-in">
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <StatusDot tone="online" />
              <h2 className="text-[13px] font-semibold">Canlı Olay Akışı</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="num text-[11px] text-muted-foreground">{displayEvents.length} olay</span>
              <button
                onClick={() => setIsEventFeedOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                title="Paneli Kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </header>

          <div className="scroll-slim flex-1 overflow-y-auto p-2">
            {displayEvents.map((e) => {
              const meta = disasterMeta[e.type] ?? disasterMeta.Earthquake;
              const isSel = selectedId === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelected(e.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-all duration-200",
                    isSel
                      ? "bg-foreground/10 ring-1 ring-white/15"
                      : "hover:bg-foreground/5"
                  )}
                >
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">{e.title}</span>
                      <span className="num shrink-0 text-[11px] text-muted-foreground">
                        {new Date(e.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                      {e.district}, {e.locationName}
                    </span>
                    <span className="mt-2 flex items-center gap-2">
                      <span className="num text-[12px] font-semibold text-primary">
                        {e.metric} {e.metricLabel}
                      </span>
                      <span className="text-[11px] text-muted-foreground">· {e.source}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setIsEventFeedOpen(true)}
          className="glass absolute left-6 top-[76px] z-40 flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-xl transition-all hover:bg-foreground/10 animate-fade-in"
          title="Canlı Olay Akışını Göster"
        >
          <Activity className="h-4 w-4 text-critical" />
          <span>Canlı Olay Akışı</span>
          <span className="num rounded-full bg-critical/20 px-2 py-0.5 text-[10px] font-bold text-critical">
            {displayEvents.length}
          </span>
        </button>
      )}

      <div className="absolute bottom-28 right-6 top-[76px] z-40 flex w-[300px] max-h-[calc(100vh-160px)] flex-col gap-3 overflow-y-auto scroll-slim pr-1">
        {(!isFleetOpen || !isNotificationsOpen || !isLayersOpen) && (
          <div className="flex flex-wrap items-center justify-end gap-1.5 self-end">
            {!isFleetOpen && (
              <button
                onClick={() => setIsFleetOpen(true)}
                className="glass flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md hover:bg-foreground/10 transition-colors animate-fade-in"
              >
                <Truck className="h-3.5 w-3.5 text-primary" />
                <span>Saha Filosu ({units.length})</span>
              </button>
            )}
            {!isNotificationsOpen && (
              <button
                onClick={() => setIsNotificationsOpen(true)}
                className="glass flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md hover:bg-foreground/10 transition-colors animate-fade-in"
              >
                <Bell className="h-3.5 w-3.5 text-amber-400" />
                <span>Bildirimler</span>
              </button>
            )}
            {!isLayersOpen && (
              <button
                onClick={() => setIsLayersOpen(true)}
                className="glass flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md hover:bg-foreground/10 transition-colors animate-fade-in"
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span>Katmanlar</span>
              </button>
            )}
          </div>
        )}

        {clickPoint && nearestUnits.length > 0 && (
          <section className="glass rounded-xl p-4 animate-slide-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-[13px] font-semibold flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-emerald-400" /> PostGIS KNN En Yakın Ekipler
              </h2>
              <button
                onClick={() => setClickPoint(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto scroll-slim">
              {nearestUnits.map((u) => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUnit(u)}
                  className="flex items-center justify-between rounded-lg bg-foreground/5 p-2 text-xs cursor-pointer hover:bg-foreground/10 transition-colors"
                >
                  <div>
                    <span className="font-bold text-foreground">{u.callSign}</span>
                    <span className="block text-[10px] text-muted-foreground">{u.plateNumber}</span>
                  </div>
                  <span className="num font-bold text-emerald-400">
                    {u.distanceKmFromTarget ?? 0} km
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {isFleetOpen && (
          <section className="glass rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                <h2 className="text-[13px] font-semibold tracking-tight">Saha Filo Takibi</h2>
              </div>
              <div className="flex items-center gap-2">
                <AuraBadge tone="online">{units.length} Araç Aktif</AuraBadge>
                <button
                  onClick={() => setIsFleetOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  title="Kartı Kapat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto scroll-slim pr-1">
              {units.length === 0 ? (
                <div className="py-4 text-center text-[12px] text-muted-foreground">
                  Sahada aktif araç bulunmamaktadır.
                </div>
              ) : (
                units.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUnit(u)}
                    className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-foreground/5 p-2 text-left text-xs transition-colors hover:bg-foreground/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">{u.callSign}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{u.plateNumber}</span>
                      </div>
                      <span className="block text-[10px] text-muted-foreground truncate">
                        {u.type === "SearchAndRescue"
                          ? "AFAD Arama Kurtarma"
                          : u.type === "Ambulance"
                          ? "UMKE / 112 Ambulans"
                          : u.type === "FireEngine"
                          ? "İtfaiye Arazöz"
                          : "Polis / Devriye"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border",
                        u.status === "Available"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      )}
                    >
                      {u.status === "Available" ? "Müsait" : "Görevde"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
        )}

        {isNotificationsOpen && (
          <section className="glass flex flex-1 flex-col overflow-hidden rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">Canlı Bildirimler</h2>
              <div className="flex items-center gap-2">
                <Link
                  to="/notifications"
                  className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Tüm Bildirimler <ChevronRight className="h-3 w-3" />
                </Link>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  title="Kartı Kapat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="scroll-slim mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {notes.length === 0 && (
                <div className="py-8 text-center text-[12px] text-muted-foreground">
                  Henüz anlık bir bildiriminiz bulunmamaktadır.
                </div>
              )}
              {notes.map((n) => (
                <article
                  key={n.id}
                  className="animate-slide-in rounded-lg border border-white/8 bg-foreground/[0.03] p-3"
                >
                  <div className="flex items-start gap-2">
                    <StatusDot tone={n.tone} className="mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium">{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{n.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {isLayersOpen && (
          <section className="glass rounded-xl p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="label-xs">Harita Katmanları</span>
              </div>
              <button
                onClick={() => setIsLayersOpen(false)}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                title="Kartı Kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mapLayers.map((l) => {
                const on = active[l.key];
                return (
                  <button
                    key={l.key}
                    onClick={() => handleToggle(l.key)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200",
                      on
                        ? "bg-foreground/10 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.label}
                    </span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-primary" : "bg-border")} />
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="absolute bottom-6 left-[392px] right-[332px] z-30 flex flex-col gap-2">
        <div className="glass flex items-center gap-4 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (playing) {
                  setPlaying(false);
                } else {
                  if (progress >= 100) setProgress(0);
                  setPlaying(true);
                }
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-200 hover:scale-105"
              title={playing ? "Durdur (Pause)" : "Oynat (Play Replay)"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setPlaying(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors duration-200 hover:bg-foreground/8 hover:text-foreground"
              title="Başa Dön ve Oynat (Reset & Replay)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="num">Tekrar Oynat · {win} ({speed})</span>
              <span className="num">{Math.round(progress)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-foreground"
            />
          </div>

          <Segmented options={windows} value={win} onChange={(v) => { setWin(v); setProgress(100); }} />
          <Segmented options={speeds} value={speed} onChange={setSpeed} />
        </div>
      </div>

      <VehicleDetailDrawer
        unit={selectedUnit}
        events={events}
        onClose={() => setSelectedUnit(null)}
      />

      <button
        onClick={() => setCreateModalOpen(true)}
        title="Hızlı İhbar Oluştur"
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform duration-200 hover:scale-110 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateReportModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/25 bg-background/50"
                  style={{ color: disasterMeta[selectedEvent.type]?.color || "#ef4444" }}
                >
                  <span className="h-5 w-5">
                    <DisasterIcon type={selectedEvent.type} />
                  </span>
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold">{selectedEvent.title}</h3>
                  <p className="text-[12px] text-muted-foreground">
                    {selectedEvent.district}, {selectedEvent.locationName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="label-xs">Şiddet İndeksi</span>
                  <div className="num mt-1 text-[16px] font-semibold text-primary">{selectedEvent.severity}/100</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="label-xs">{selectedEvent.metricLabel || "Büyüklük"}</span>
                  <div className="num mt-1 text-[16px] font-semibold text-primary">{selectedEvent.metric}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="label-xs">Kaynak</span>
                  <div className="truncate text-[13px] font-medium">{selectedEvent.source}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <span className="label-xs">Durum</span>
                  <div className="text-[13px] font-medium text-emerald-400">{selectedEvent.status}</div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tespit Zamanı:</span>
                  <span className="font-medium">{new Date(selectedEvent.detectedAt).toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Koordinatlar:</span>
                  <span className="font-medium num">{selectedEvent.latitude.toFixed(4)}° N, {selectedEvent.longitude.toFixed(4)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Detay Özet:</span>
                  <span className="font-medium text-right max-w-[260px] truncate">{selectedEvent.summary}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="h-9 rounded-lg border border-border px-4 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Kapat
                </button>
                <HasRole roles={["Operator", "Admin"]}>
                  <button
                    onClick={() => escalateMutation.mutate(selectedEvent.id)}
                    disabled={escalateMutation.isPending}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[13px] font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {escalateMutation.isPending ? "Yükseltiliyor..." : "Seviyeyi Yükselt"}
                  </button>
                </HasRole>
                <Link
                  to="/event/$id"
                  params={{ id: selectedEvent.id }}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Detaylı İncele (Sayfaya Git) <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
