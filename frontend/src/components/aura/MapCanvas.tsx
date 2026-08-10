import { useState, memo, useCallback, useMemo } from "react";
import { DisasterIcon } from "./DisasterIcon";
import { disasterMeta, type EventDto, type RiskZoneDto, type MarkerClusterDto, type EmergencyUnitDto } from "@/lib/api-client";
import { TURKEY_PATHS, NEIGHBOR_PATHS, CITIES, SEA_LABELS } from "@/lib/geo-turkey";
import { cn } from "@/lib/utils";
import { Truck, Shield, Ambulance, Flame, Plus, Minus } from "lucide-react";

type Props = {
  events: EventDto[];
  clusters?: MarkerClusterDto[];
  units?: EmergencyUnitDto[];
  riskZones?: RiskZoneDto[];
  active?: Record<string, boolean>;
  selectedId?: string | null;
  selectedUnitId?: string | null;
  bufferPoint?: { lat: number; lng: number; radiusMeters: number } | null;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  onSelect?: (e: EventDto) => void;
  onClusterSelect?: (cluster: MarkerClusterDto) => void;
  onUnitSelect?: (unit: EmergencyUnitDto) => void;
  onMapClick?: (point: { lat: number; lng: number }) => void;
  className?: string;
  compact?: boolean;
};

const defaultRiskPolygons = [
  {
    id: "rz-1",
    name: "Kuzey Anadolu Fay Çizgisi Sismik Poligonu",
    type: "SeismicFaultZone",
    district: "Silivri / Marmara",
    severity: 92,
    color: "#a855f7",
    path: "M170 176 L280 158 L330 226 L250 268 L160 240 Z",
  },
  {
    id: "rz-2",
    name: "Kurubağ Dere Yatağı Sel & Taşkın Riski",
    type: "FloodHazardZone",
    district: "Kadıköy / Üsküdar",
    severity: 85,
    color: "#ef4444",
    path: "M640 250 L790 232 L840 316 L720 356 L634 310 Z",
  },
  {
    id: "rz-3",
    name: "Beylikdüzü / Avcılar Heyelan Duyarlı Bölge",
    type: "LandslideHazardZone",
    district: "Avcılar",
    severity: 68,
    color: "#f59e0b",
    path: "M290 260 L380 250 L420 310 L330 330 Z",
  },
  {
    id: "rz-4",
    name: "Yenikapı Toplanma ve Acil Tahliye Alanı",
    type: "EvacuationZone",
    district: "Fatih",
    severity: 25,
    color: "#eab308",
    path: "M450 290 L520 280 L540 330 L470 340 Z",
  },
];

const heatNodes = [
  { id: "hn-1", cx: 640, cy: 260, r: 110, gradient: "url(#heatHigh)", density: "Yoğun (Kırmızı)", label: "Kadıköy / Marmara" },
  { id: "hn-2", cx: 220, cy: 210, r: 120, gradient: "url(#heatHigh)", density: "Yoğun (Kırmızı)", label: "Silivri Fay Hattı" },
  { id: "hn-3", cx: 480, cy: 290, r: 90, gradient: "url(#heatMedium)", density: "Orta (Sarı)", label: "Fatih / Avcılar" },
  { id: "hn-4", cx: 780, cy: 290, r: 100, gradient: "url(#heatLow)", density: "Seyrek (Mavi)", label: "Kocaeli / İzmit" },
  { id: "hn-5", cx: 340, cy: 300, r: 85, gradient: "url(#heatLow)", density: "Seyrek (Mavi)", label: "Bursa / Nilüfer" },
];

const TurkeyPathsLayer = memo(function TurkeyPathsLayer() {
  return (
    <>
      <g fill="oklch(0.222 0 0)" stroke="oklch(0.36 0.02 244)" strokeWidth="0.8">
        {NEIGHBOR_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <g filter="url(#landShadow)">
        {TURKEY_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="oklch(0.252 0 0)"
            stroke="oklch(0.44 0.03 244)"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </>
  );
});

const CityLabelsLayer = memo(function CityLabelsLayer() {
  return (
    <g pointerEvents="none">
      {SEA_LABELS.map((s) => (
        <text
          key={s.n}
          x={s.x}
          y={s.y}
          textAnchor="middle"
          fill="oklch(0.62 0.05 244)"
          fontSize="10"
          letterSpacing="2.4"
          fontFamily="var(--font-sans)"
        >
          {s.n}
        </text>
      ))}
      {CITIES.map((c) => (
        <g key={c.n}>
          <circle
            cx={c.x}
            cy={c.y}
            r={c.major ? 2.6 : 1.6}
            fill="oklch(0.82 0 0 / 0.65)"
            stroke="oklch(0.18 0 0)"
            strokeWidth="0.8"
          />
          <text
            x={c.x + (c.major ? 7 : 5)}
            y={c.y + 3.2}
            fill={c.major ? "oklch(0.86 0 0 / 0.82)" : "oklch(0.70 0 0 / 0.5)"}
            fontSize={c.major ? 11 : 9}
            letterSpacing={c.major ? 0.4 : 0.2}
            fontFamily="var(--font-sans)"
          >
            {c.n}
          </text>
        </g>
      ))}
    </g>
  );
});

export const BaseMap = memo(function BaseMap({
  heatmap = false,
  risk = false,
  traffic = false,
  labels = true,
  riskZones = [],
  bufferPoint = null,
  events = [],
  onMapClick,
}: {
  heatmap?: boolean;
  risk?: boolean;
  traffic?: boolean;
  labels?: boolean;
  riskZones?: RiskZoneDto[];
  bufferPoint?: { lat: number; lng: number; radiusMeters: number } | null;
  events?: EventDto[];
  onMapClick?: (point: { lat: number; lng: number }) => void;
}) {
  const [hoveredZone, setHoveredZone] = useState<any | null>(null);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lat = Number((42.0 - (y / rect.height) * 6.0).toFixed(4));
    const lng = Number((26.0 + (x / rect.width) * 19.0).toFixed(4));

    onMapClick?.({ lat, lng });
  }, [onMapClick]);

  const mapTransform = useMemo(() => {
    if (!bufferPoint) return {};
    const targetX = (bufferPoint.lng - 26.0) * (1000.0 / 19.0);
    const targetY = (42.0 - bufferPoint.lat) * (600.0 / 6.0);
    const dx = 500 - targetX;
    const dy = 300 - targetY;
    return {
      transform: `translate(${dx}px, ${dy}px) scale(1.4)`,
      transformOrigin: `${targetX}px ${targetY}px`,
      transition: "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)"
    };
  }, [bufferPoint]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "oklch(0.168 0.014 244)" }}
    >
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full cursor-crosshair"
        onClick={handleSvgClick}
      >
        <defs>
          <radialGradient id="heatHigh" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
            <stop offset="45%" stopColor="#f97316" stopOpacity="0.45" />
            <stop offset="75%" stopColor="#eab308" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heatMedium" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="heatLow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          <pattern id="graticule" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="oklch(1 0 0 / 0.02)" strokeWidth="1" />
          </pattern>
          <filter id="landShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="6" floodColor="oklch(0 0 0)" floodOpacity="0.7" />
          </filter>
        </defs>

        <rect width="1000" height="600" fill="oklch(0.168 0.014 244)" />
        <rect width="1000" height="600" fill="url(#graticule)" />

        <g style={mapTransform}>
          <TurkeyPathsLayer />

          {risk && (
            <g>
              {defaultRiskPolygons.map((z) => (
                <path
                  key={z.id}
                  d={z.path}
                  fill={z.color}
                  fillOpacity="0.15"
                  stroke={z.color}
                  strokeOpacity="0.8"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  className="transition-all duration-300 hover:fill-opacity-35 hover:stroke-width-2.5 cursor-pointer"
                  onMouseEnter={() => setHoveredZone(z)}
                  onMouseLeave={() => setHoveredZone(null)}
                />
              ))}
            </g>
          )}

          {bufferPoint && (
            <g>
              <circle
                cx={(bufferPoint.lng - 26.0) * (1000.0 / 19.0)}
                cy={(42.0 - bufferPoint.lat) * (600.0 / 6.0)}
                r={(bufferPoint.radiusMeters / 1000.0) * 12}
                fill="#ef4444"
                fillOpacity="0.15"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <circle
                cx={(bufferPoint.lng - 26.0) * (1000.0 / 19.0)}
                cy={(42.0 - bufferPoint.lat) * (600.0 / 6.0)}
                r="5"
                fill="#ef4444"
              />
            </g>
          )}

          {heatmap && (
            <g className="mix-blend-screen transition-opacity duration-500">
              {heatNodes.map((hn) => (
                <circle key={hn.id} cx={hn.cx} cy={hn.cy} r={hn.r} fill={hn.gradient} />
              ))}
              {events.map((e) => {
                const cx = (e.longitude - 26.0) * (1000.0 / 19.0);
                const cy = (42.0 - e.latitude) * (600.0 / 6.0);
                return <circle key={e.id} cx={cx} cy={cy} r="65" fill="url(#heatHigh)" />;
              })}
            </g>
          )}

          {labels && <CityLabelsLayer />}
        </g>
      </svg>
    </div>
  );
});

function getUnitIcon(type: string) {
  switch (type) {
    case "Ambulance":
      return <Ambulance className="h-3.5 w-3.5" />;
    case "FireEngine":
      return <Flame className="h-3.5 w-3.5" />;
    case "PolicePatrol":
      return <Shield className="h-3.5 w-3.5" />;
    default:
      return <Truck className="h-3.5 w-3.5" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Dispatched":
      return "bg-amber-500 border-amber-300 text-amber-950 animate-pulse";
    case "OnScene":
      return "bg-red-500 border-red-300 text-red-950 animate-pulse";
    case "Maintenance":
      return "bg-zinc-600 border-zinc-400 text-zinc-100";
    default:
      return "bg-emerald-500 border-emerald-300 text-emerald-950";
  }
}

export const VehicleMarker = memo(function VehicleMarker({
  unit,
  selected,
  onSelect,
}: {
  unit: EmergencyUnitDto;
  selected: boolean;
  onSelect?: (unit: EmergencyUnitDto) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect?.(unit);
  }, [unit, onSelect]);

  const leftPos = useMemo(() => `${Math.max(4, Math.min(96, ((unit.longitude - 26.0) / 19.0) * 100))}%`, [unit.longitude]);
  const topPos = useMemo(() => `${Math.max(4, Math.min(96, ((42.0 - unit.latitude) / 6.0) * 100))}%`, [unit.latitude]);
  const statusStyle = useMemo(() => getStatusColor(unit.status), [unit.status]);
  const icon = useMemo(() => getUnitIcon(unit.type), [unit.type]);

  return (
    <button
      onClick={handleClick}
      style={{ left: leftPos, top: topPos, willChange: "left, top" }}
      className={cn(
        "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-25",
        selected ? "scale-125 ring-2 ring-white" : "hover:scale-110"
      )}
    >
      <div className="flex flex-col items-center">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-md", statusStyle)}>
          {icon}
        </span>
        <span className="mt-0.5 rounded bg-black/80 px-1 py-0.2 text-[9px] font-bold text-white shadow">
          {unit.callSign}
        </span>
      </div>
    </button>
  );
}, (prev, next) => (
  prev.selected === next.selected &&
  prev.unit.id === next.unit.id &&
  prev.unit.latitude === next.unit.latitude &&
  prev.unit.longitude === next.unit.longitude &&
  prev.unit.status === next.unit.status &&
  prev.unit.speedKmh === next.unit.speedKmh &&
  prev.unit.headingDegrees === next.unit.headingDegrees
));

const DisasterMarker = memo(function DisasterMarker({
  event,
  selected,
  onSelect,
}: {
  event: EventDto;
  selected: boolean;
  onSelect?: (e: EventDto) => void;
}) {
  const meta = disasterMeta[event.type] ?? disasterMeta.Earthquake;
  const left = `${Math.max(4, Math.min(96, ((event.longitude - 26.0) / 19.0) * 100))}%`;
  const top = `${Math.max(4, Math.min(96, ((42.0 - event.latitude) / 6.0) * 100))}%`;

  return (
    <button
      onClick={() => onSelect?.(event)}
      style={{ left, top }}
      className={cn(
        "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
        selected ? "z-30 scale-125" : "z-20 hover:scale-110"
      )}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/30 bg-card/90 shadow-lg backdrop-blur-md"
        style={{ color: meta.color }}
      >
        <span className="h-4 w-4">
          <DisasterIcon type={event.type} />
        </span>
      </span>
    </button>
  );
}, (prev, next) => (
  prev.selected === next.selected &&
  prev.event.id === next.event.id &&
  prev.event.latitude === next.event.latitude &&
  prev.event.longitude === next.event.longitude &&
  prev.event.severity === next.event.severity
));

const ClusterMarker = memo(function ClusterMarker({
  cluster,
  events = [],
  eventsMap,
  onSelect,
  onClusterSelect,
}: {
  cluster: MarkerClusterDto;
  events?: EventDto[];
  eventsMap?: Map<string, EventDto>;
  onSelect?: (e: EventDto) => void;
  onClusterSelect?: (cluster: MarkerClusterDto) => void;
}) {
  if (cluster.pointCount === 1) {
    const realEvent =
      eventsMap?.get(cluster.clusterId) ||
      events.find((e) => e.id === cluster.clusterId) ||
      events.find((e) => Math.abs(e.latitude - cluster.latitude) < 0.05 && Math.abs(e.longitude - cluster.longitude) < 0.05);

    const meta = disasterMeta[realEvent?.type || cluster.primaryDisasterType] || disasterMeta.Earthquake;
    return (
      <button
        onClick={() => {
          if (realEvent) {
            onSelect?.(realEvent);
          } else {
            onClusterSelect?.(cluster);
          }
        }}
        style={{
          left: `${Math.max(4, Math.min(96, ((cluster.longitude - 26.0) / 19.0) * 100))}%`,
          top: `${Math.max(4, Math.min(96, ((42.0 - cluster.latitude) / 6.0) * 100))}%`,
        }}
        className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 z-30"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/30 bg-card/90 shadow-lg backdrop-blur-md"
          style={{ color: meta.color }}
        >
          <span className="h-4 w-4">
            <DisasterIcon type={realEvent?.type || cluster.primaryDisasterType} />
          </span>
        </span>
      </button>
    );
  }

  const toneColor =
    cluster.maxSeverity >= 80
      ? "bg-red-600 border-red-400 shadow-red-500/60 shadow-lg animate-pulse ring-4 ring-red-500/20"
      : cluster.maxSeverity >= 50
        ? "bg-red-500/90 border-red-400 shadow-red-500/40 shadow-md"
        : "bg-red-500/80 border-red-500/90 shadow-red-500/30 shadow-md";

  return (
    <button
      onClick={() => onClusterSelect?.(cluster)}
      style={{
        left: `${Math.max(4, Math.min(96, ((cluster.longitude - 26.0) / 19.0) * 100))}%`,
        top: `${Math.max(4, Math.min(96, ((42.0 - cluster.latitude) / 6.0) * 100))}%`,
      }}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 z-30"
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[12px] font-bold text-white shadow-xl backdrop-blur-md",
          toneColor
        )}
      >
        {cluster.pointCount}
      </span>
    </button>
  );
}, (prev, next) => (
  prev.cluster.clusterId === next.cluster.clusterId &&
  prev.cluster.pointCount === next.cluster.pointCount &&
  prev.cluster.latitude === next.cluster.latitude &&
  prev.cluster.longitude === next.cluster.longitude &&
  prev.cluster.maxSeverity === next.cluster.maxSeverity
));

export const MapCanvas = memo(function MapCanvas({
  events,
  clusters = [],
  units = [],
  riskZones,
  active,
  selectedId,
  selectedUnitId,
  bufferPoint,
  zoomLevel = 10,
  onZoomChange,
  onSelect,
  onClusterSelect,
  onUnitSelect,
  onMapClick,
  className,
  compact = false,
}: Props) {
  const markerTransform = useMemo(() => {
    if (!bufferPoint) return {};
    const targetX = (bufferPoint.lng - 26.0) * (1000.0 / 19.0);
    const targetY = (42.0 - bufferPoint.lat) * (600.0 / 6.0);
    const dx = 500 - targetX;
    const dy = 300 - targetY;
    return {
      transform: `translate(${dx}px, ${dy}px) scale(1.4)`,
      transformOrigin: `${targetX}px ${targetY}px`,
      transition: "transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)"
    };
  }, [bufferPoint]);

  const isEventVisible = useCallback((e: EventDto) => {
    if (!active) return true;
    const t = String(e.type);
    if ((t === "Earthquake" || t === "1") && active.earthquake === false) return false;
    if ((t === "Flood" || t === "2") && active.flood === false) return false;
    if ((t === "Wildfire" || t === "Landslide" || t === "3" || t === "4") && active.wildfire === false) return false;
    if ((t === "Report" || t === "Medical" || t === "5" || t === "6") && active.report === false) return false;
    return true;
  }, [active]);

  const filteredEvents = useMemo(() => {
    return events.filter(isEventVisible);
  }, [events, isEventVisible]);

  const isClusterVisible = useCallback((c: MarkerClusterDto) => {
    if (!active) return true;
    const t = String(c.primaryDisasterType);
    if ((t === "Earthquake" || t === "1") && active.earthquake === false) return false;
    if ((t === "Flood" || t === "2") && active.flood === false) return false;
    if ((t === "Wildfire" || t === "Landslide" || t === "3" || t === "4") && active.wildfire === false) return false;
    if ((t === "Report" || t === "Medical" || t === "5" || t === "6") && active.report === false) return false;
    return true;
  }, [active]);

  const filteredClusters = useMemo(() => {
    return clusters.filter(isClusterVisible);
  }, [clusters, isClusterVisible]);

  const eventsMap = useMemo(() => {
    const map = new Map<string, EventDto>();
    for (const e of filteredEvents) {
      map.set(e.id, e);
    }
    return map;
  }, [filteredEvents]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl", className)}>
      <BaseMap
        riskZones={riskZones}
        bufferPoint={bufferPoint}
        events={filteredEvents}
        heatmap={active?.heatmap}
        risk={active?.risk}
        onMapClick={onMapClick}
      />

      <div className="absolute right-4 top-4 z-40 flex flex-col gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => onZoomChange?.(Math.min(18, zoomLevel + 1))}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground pointer-events-auto"
          title="Yakınlaş (Zoom In)"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="h-px bg-border" />
        <button
          onClick={() => onZoomChange?.(Math.max(4, zoomLevel - 1))}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground pointer-events-auto"
          title="Uzaklaş (Zoom Out)"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0" style={markerTransform}>
        {filteredClusters.length > 0
          ? filteredClusters.map((c) => (
              <ClusterMarker
                key={c.clusterId}
                cluster={c}
                events={filteredEvents}
                eventsMap={eventsMap}
                onSelect={onSelect}
                onClusterSelect={onClusterSelect}
              />
            ))
          : filteredEvents.map((e) => (
              <DisasterMarker
                key={e.id}
                event={e}
                selected={selectedId === e.id}
                onSelect={onSelect}
              />
            ))}

        {units.map((u) => (
          <VehicleMarker
            key={u.id}
            unit={u}
            selected={selectedUnitId === u.id}
            onSelect={onUnitSelect}
          />
        ))}
      </div>
    </div>
  );
}, (prev, next) => (
  prev.selectedId === next.selectedId &&
  prev.selectedUnitId === next.selectedUnitId &&
  prev.events === next.events &&
  prev.clusters === next.clusters &&
  prev.units === next.units &&
  prev.className === next.className &&
  prev.zoomLevel === next.zoomLevel &&
  prev.bufferPoint?.lat === next.bufferPoint?.lat &&
  prev.bufferPoint?.lng === next.bufferPoint?.lng &&
  (prev.active === next.active ||
    (prev.active?.earthquake === next.active?.earthquake &&
     prev.active?.flood === next.active?.flood &&
     prev.active?.wildfire === next.active?.wildfire &&
     prev.active?.report === next.active?.report &&
     prev.active?.heatmap === next.active?.heatmap &&
     prev.active?.risk === next.active?.risk))
));
