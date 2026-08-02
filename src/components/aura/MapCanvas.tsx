import { useState } from "react";
import { DisasterIcon } from "./DisasterIcon";
import { disasterMeta, type EventDto } from "@/lib/api-client";
import { TURKEY_PATHS, NEIGHBOR_PATHS, CITIES, SEA_LABELS } from "@/lib/geo-turkey";
import { cn } from "@/lib/utils";

type Props = {
  events: EventDto[];
  active?: Record<string, boolean>;
  selectedId?: string | null;
  onSelect?: (e: EventDto) => void;
  className?: string;
  compact?: boolean;
};

export function BaseMap({
  heatmap = false,
  risk = false,
  traffic = false,
  labels = true,
}: {
  heatmap?: boolean;
  risk?: boolean;
  traffic?: boolean;
  labels?: boolean;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: "oklch(0.168 0.014 244)" }}
    >
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
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

        <g
          clipPath="none"
          stroke="oklch(1 0 0 / 0.035)"
          strokeWidth="1"
          fill="none"
          pointerEvents="none"
        >
          <path d="M240 220 C 360 240 480 232 600 250 C 720 268 830 250 930 262" />
          <path d="M200 300 C 330 316 470 300 600 320 C 720 338 840 320 940 330" />
          <path d="M180 380 C 320 396 460 380 600 396 C 720 410 830 396 930 400" />
        </g>

        <g
          stroke={traffic ? "oklch(0.72 0.16 60 / 0.5)" : "oklch(1 0 0 / 0.1)"}
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M221 190 C 300 216 350 240 401 256 C 500 286 620 260 720 250 C 810 242 880 250 930 268" />
          <path d="M401 256 C 440 290 480 316 515 330 C 600 362 680 356 760 336" />
          <path d="M221 190 C 210 250 190 300 165 340 C 220 366 320 380 401 386 C 480 392 540 372 600 356" />
          <path d="M401 256 C 420 320 440 370 470 400" />
        </g>

        {risk && (
          <g>
            <path
              d="M170 176 L280 158 L330 226 L250 268 L160 240 Z"
              fill="#ef4444"
              fillOpacity="0.07"
              stroke="#ef4444"
              strokeOpacity="0.32"
              strokeDasharray="6 6"
            />
            <path
              d="M640 250 L790 232 L840 316 L720 356 L634 310 Z"
              fill="#f59e0b"
              fillOpacity="0.06"
              stroke="#f59e0b"
              strokeOpacity="0.3"
              strokeDasharray="6 6"
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
    </div>
  );
}

function projectCoordinates(lat: number, lng: number): { x: number; y: number } {
  const minLng = 25.5;
  const maxLng = 45.0;
  const minLat = 35.5;
  const maxLat = 42.5;

  const x = Math.min(95, Math.max(5, ((lng - minLng) / (maxLng - minLng)) * 100));
  const y = Math.min(95, Math.max(5, ((maxLat - lat) / (maxLat - minLat)) * 100));

  return { x, y };
}

export function MapCanvas({
  events,
  active = {},
  selectedId,
  onSelect,
  className,
  compact = false,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const isOn = (k: string) => active[k] !== false;

  const visible = events.filter((e) => {
    const typeKey = e.type.toLowerCase();
    if (typeKey === "report") return isOn("report");
    if (["earthquake", "flood", "wildfire"].includes(typeKey)) return isOn(typeKey);
    return true;
  });

  return (
    <div className={cn("relative overflow-hidden bg-background", className)}>
      <BaseMap heatmap={isOn("heatmap")} risk={isOn("risk")} traffic={active.traffic === true} />

      <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-linear-to-r from-transparent via-foreground/[0.025] to-transparent animate-sweep" />

      {visible.map((e) => {
        const meta = disasterMeta[e.type] ?? disasterMeta.Earthquake;
        const isSel = selectedId === e.id;
        const pos = projectCoordinates(e.latitude, e.longitude);

        return (
          <button
            key={e.id}
            type="button"
            onClick={() => onSelect?.(e)}
            onMouseEnter={() => setHover(e.id)}
            onMouseLeave={() => setHover(null)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 outline-none transition-all duration-300"
            aria-label={`${e.title} — ${e.district}`}
          >
            <span className="relative flex items-center justify-center">
              {e.status === "Active" && (
                <span
                  className="absolute h-8 w-8 rounded-full opacity-40 animate-ping-slow bg-red-500"
                />
              )}
              <span
                className={cn(
                  "relative flex items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 bg-background/80 text-foreground",
                  compact ? "h-6 w-6" : "h-8 w-8",
                  isSel || hover === e.id ? "scale-125 border-primary ring-2 ring-primary/40" : "scale-100 border-border"
                )}
                style={{ color: meta.color }}
              >
                <span className="relative" style={{ width: compact ? "12px" : "16px", height: compact ? "12px" : "16px" }}>
                  <DisasterIcon type={e.type} />
                </span>
              </span>
            </span>

            {hover === e.id && !compact && (
              <span className="glass absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-lg p-3 text-left shadow-xl border border-border/40 bg-background/95 backdrop-blur-md animate-scale-in">
                <span className="block text-[13px] font-medium text-foreground">{e.title}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {e.district} · {e.source}
                </span>
                <span className="num mt-2 block text-sm font-semibold text-primary">
                  {e.metric} {e.metricLabel}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
