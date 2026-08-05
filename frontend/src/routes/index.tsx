import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  FileWarning,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ServerCog,
  X,
} from "lucide-react";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { TopNav } from "@/components/aura/AppShell";
import { AuraBadge, StatCard, StatusDot } from "@/components/aura/primitives";
import { CreateReportModal } from "@/components/aura/CreateReportModal";
import { useActiveEvents } from "@/queries/useEventsQuery";
import { useAnalyticsSummary } from "@/queries/useAnalyticsQuery";
import { disasterMeta, isAuthenticated } from "@/lib/api-client";
import {
  onEventCreated,
  onReportStatusChanged,
} from "@/lib/signalr-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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
  { key: "earthquake", label: "Depremler" },
  { key: "flood", label: "Sel / Taşkın" },
  { key: "wildfire", label: "Yangınlar" },
  { key: "report", label: "İhbarlar" },
  { key: "heatmap", label: "Isı Haritası" },
  { key: "risk", label: "Risk Bölgeleri" },
];

function CommandCenter() {
  const navigate = useNavigate();
  const { data: events = [], refetch: refetchEvents } = useActiveEvents();
  const { data: summary, refetch: refetchSummary } = useAnalyticsSummary();
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({
    heatmap: true,
    risk: true,
    earthquake: true,
    flood: true,
    wildfire: true,
    report: true,
    traffic: false,
  });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(64);
  const [win, setWin] = useState("24 Hours");
  const [speed, setSpeed] = useState("1x");
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
      return;
    }

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
  }, [navigate]);

  useEffect(() => {
    if (!playing) return;
    const step = speed === "1x" ? 0.4 : speed === "2x" ? 0.9 : 2.2;
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + step)), 60);
    return () => clearInterval(t);
  }, [playing, speed]);

  const selectedEvent = events.find((e) => e.id === selected) ?? null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <MapCanvas
        events={events}
        active={active}
        selectedId={selected}
        onSelect={(e) => setSelected(e.id)}
        className="absolute inset-0 h-full w-full"
      />

      <TopNav floating />

      <div className="pointer-events-none absolute left-[392px] right-[332px] top-[76px] z-30 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          className="pointer-events-auto"
          label="Aktif Afetler"
          value={summary ? summary.totalActiveEvents.toString() : events.length.toString()}
          delta="Canlı Veri"
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="Max Büyüklük"
          value={summary ? `${summary.highestEarthquakeMagnitude.toFixed(1)} ML` : "0.0 ML"}
          tone="critical"
          delta="Kandilli Akışı"
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="Bekleyen İhbarlar"
          value={summary ? summary.pendingReportsCount.toString() : "0"}
          tone="warning"
          delta="112 Entegrasyon"
          icon={<FileWarning className="h-3.5 w-3.5" />}
        />
        <StatCard
          className="pointer-events-auto"
          label="İzlenen İlçeler"
          value={summary ? `${summary.totalDistrictsMonitored}` : "14"}
          tone="online"
          delta="PostGIS / Weather"
          icon={<ServerCog className="h-3.5 w-3.5" />}
        />
      </div>

      <aside className="absolute bottom-28 left-6 top-[76px] z-30 flex w-[352px] flex-col overflow-hidden rounded-xl glass animate-fade-in">
        <header className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <StatusDot tone="online" />
            <h2 className="text-[13px] font-semibold">Canlı Olay Akışı</h2>
          </div>
          <span className="num text-[11px] text-muted-foreground">{events.length} olay</span>
        </header>

        <div className="scroll-slim flex-1 overflow-y-auto p-2">
          {events.map((e) => {
            const meta = disasterMeta[e.type] ?? disasterMeta.Earthquake;
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                className={cn(
                  "group mb-1 flex w-full gap-3 rounded-lg border border-transparent p-3 text-left transition-all duration-200 hover:border-border hover:bg-foreground/[0.04]",
                  selected === e.id && "border-border bg-foreground/[0.06]"
                )}
              >
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/25 bg-background/50"
                  style={{ color: meta.color }}
                >
                  <span className="h-4 w-4">
                    <DisasterIcon type={e.type} />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{e.title}</span>
                    <span className="num shrink-0 text-[11px] text-muted-foreground">
                      {new Date(e.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      <div className="absolute bottom-28 right-6 top-[76px] z-30 flex w-[300px] flex-col gap-3">
        <section className="glass rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Sistem Durumu</h2>
            <AuraBadge tone="online">Canlı PostgreSQL</AuraBadge>
          </div>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2 text-[12px]">
              <StatusDot tone="online" pulse={false} />
              <span className="flex-1 text-foreground/90">PostgreSQL + PostGIS</span>
              <span className="num text-[11px] text-muted-foreground">Aktif</span>
            </li>
            <li className="flex items-center gap-2 text-[12px]">
              <StatusDot tone="online" pulse={false} />
              <span className="flex-1 text-foreground/90">Kandilli Ingestion</span>
              <span className="num text-[11px] text-muted-foreground">60s Polling</span>
            </li>
            <li className="flex items-center gap-2 text-[12px]">
              <StatusDot tone="online" pulse={false} />
              <span className="flex-1 text-foreground/90">SignalR WebSocket</span>
              <span className="num text-[11px] text-muted-foreground">Bağlı</span>
            </li>
          </ul>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Yeni İhbar Oluştur
          </button>
        </section>

        <section className="glass flex min-h-0 flex-1 flex-col rounded-xl">
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <h2 className="text-[13px] font-semibold">Canlı Bildirimler</h2>
            <span className="label-xs">SignalR</span>
          </header>
          <div className="scroll-slim flex-1 space-y-2 overflow-y-auto p-3">
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

        <section className="glass rounded-xl p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="label-xs">Harita Katmanları</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {mapLayers.map((l) => {
              const on = active[l.key];
              return (
                <button
                  key={l.key}
                  onClick={() => setActive((a) => ({ ...a, [l.key]: !a[l.key] }))}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-all duration-200",
                    on
                      ? "border-foreground/20 bg-foreground/8 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-foreground/5"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      on ? "bg-emerald-500" : "bg-muted-foreground/40"
                    )}
                  />
                  {l.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="absolute bottom-6 left-[392px] right-[332px] z-30">
        <div className="glass flex items-center gap-4 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-200 hover:scale-105"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setPlaying(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors duration-200 hover:bg-foreground/8 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="num">Tekrar Oynat · {win}</span>
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

          <Segmented options={windows} value={win} onChange={setWin} />
          <Segmented options={speeds} value={speed} onChange={setSpeed} />
        </div>
      </div>

      {selectedEvent && (
        <div className="glass absolute bottom-28 left-1/2 z-40 w-[420px] -translate-x-1/2 rounded-xl p-5 animate-scale-in">
          <div className="flex items-start gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-current/25 bg-background/50"
              style={{ color: disasterMeta[selectedEvent.type]?.color }}
            >
              <span className="h-5 w-5">
                <DisasterIcon type={selectedEvent.type} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold">{selectedEvent.title}</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {selectedEvent.district}, {selectedEvent.locationName}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            {selectedEvent.summary}
          </p>
          <Link
            to="/event/$id"
            params={{ id: selectedEvent.id }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-foreground/5 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-foreground/10"
          >
            Detayları Aç <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <CreateReportModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          refetchEvents();
          refetchSummary();
        }}
      />
    </div>
  );
}

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
    <div className="hidden items-center gap-0.5 rounded-lg border border-white/10 p-0.5 lg:flex">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] transition-colors duration-200",
            value === o
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
