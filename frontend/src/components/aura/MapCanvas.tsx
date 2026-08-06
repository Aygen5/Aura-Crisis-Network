import { useState } from "react";
import { DisasterIcon } from "./DisasterIcon";
import { disasterMeta, type EventDto, type RiskZoneDto } from "@/lib/api-client";
import { TURKEY_PATHS, NEIGHBOR_PATHS, CITIES, SEA_LABELS } from "@/lib/geo-turkey";
import { cn } from "@/lib/utils";

type Props = {
  events: EventDto[];
  riskZones?: RiskZoneDto[];
  active?: Record<string, boolean>;
  selectedId?: string | null;
  bufferPoint?: { lat: number; lng: number; radiusMeters: number } | null;
  onSelect?: (e: EventDto) => void;
  onMapClick?: (point: { lat: number; lng: number }) => void;
  className?: string;
  compact?: boolean;
};

const defaultRiskPolygons: Array<{
  id: string;
  name: string;
  type: string;
  district: string;
  severity: number;
  color: string;
  path: string;
}> = [
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

export function BaseMap({
  heatmap = false,
  risk = false,
  traffic = false,
  labels = true,
  riskZones = [],
  bufferPoint = null,
  onMapClick,
}: {
  heatmap?: boolean;
  risk?: boolean;
  traffic?: boolean;
  labels?: boolean;
  riskZones?: RiskZoneDto[];
  bufferPoint?: { lat: number; lng: number; radiusMeters: number } | null;
  onMapClick?: (point: { lat: number; lng: number }) => void;
}) {
  const [hoveredZone, setHoveredZone] = useState<any | null>(null);

  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lat = Number((42.0 - (y / rect.height) * 6.0).toFixed(4));
    const lng = Number((26.0 + (x / rect.width) * 19.0).toFixed(4));

    onMapClick?.({ lat, lng });
  }

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
          <radialGradient id="heat" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
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
              r="4"
              fill="#ef4444"
            />
          </g>
        )}

        {heatmap && (
          <g>
            <circle cx="230" cy="200" r="140" fill="url(#heat)" />
            <circle cx="500" cy="300" r="130" fill="url(#heat)" />
            <circle cx="760" cy="290" r="150" fill="url(#heat)" />
          </g>
        )}

        {labels && (
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
        )}
      </svg>

      {hoveredZone && (
        <div className="pointer-events-none absolute left-6 top-6 z-40 w-72 rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {hoveredZone.district}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: hoveredZone.color }}
            >
              Şiddet: {hoveredZone.severity}/100
            </span>
          </div>
          <h4 className="mt-1 text-[13px] font-semibold leading-snug">{hoveredZone.name}</h4>
          <p className="mt-1 text-[11px] text-muted-foreground">
            PostGIS uzamsal poligon kesişim haritası.
          </p>
        </div>
      )}

      {risk && (
        <div className="pointer-events-none absolute bottom-4 left-6 z-30 flex items-center gap-3 rounded-lg border border-border bg-card/90 px-3 py-2 text-[11px] backdrop-blur-md">
          <span className="font-semibold text-muted-foreground">Lejand (Legend):</span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Sismik Fay
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Sel Riski
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Heyelan
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" /> Tahliye
          </span>
        </div>
      )}
    </div>
  );
}

export function MapCanvas({
  events,
  riskZones,
  active,
  selectedId,
  bufferPoint,
  onSelect,
  onMapClick,
  className,
}: Props) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border", className)}>
      <BaseMap
        heatmap={active?.heatmap}
        risk={active?.risk}
        traffic={active?.traffic}
        riskZones={riskZones}
        bufferPoint={bufferPoint}
        onMapClick={onMapClick}
      />

      <div className="absolute inset-0 pointer-events-none">
        {events.map((e) => {
          const meta = disasterMeta[e.type] ?? disasterMeta.Earthquake;
          const selected = selectedId === e.id;

          return (
            <button
              key={e.id}
              onClick={() => onSelect?.(e)}
              style={{
                left: `${Math.max(4, Math.min(96, ((e.longitude - 26.0) / 19.0) * 100))}%`,
                top: `${Math.max(4, Math.min(96, ((42.0 - e.latitude) / 6.0) * 100))}%`,
              }}
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
                  <DisasterIcon type={e.type} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
