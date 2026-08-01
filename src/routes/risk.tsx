import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/aura/AppShell";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { AuraBadge, PanelCard, toneText } from "@/components/aura/primitives";
import { events } from "@/lib/aura-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Analysis — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Predictive risk scoring for seismic, flood and landslide exposure with live weather analysis across Istanbul districts.",
      },
      { property: "og:title", content: "Risk Analysis — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Predictive flood, landslide and seismic risk modelling for the Marmara region.",
      },
    ],
  }),
  component: RiskAnalysis,
});

const scores = [
  { label: "Seismic Risk", value: 74, tone: "critical" as const, note: "North Anatolian segment stress" },
  { label: "Flood Risk", value: 58, tone: "warning" as const, note: "Saturated basin, 62 mm/h peak" },
  { label: "Landslide Risk", value: 41, tone: "warning" as const, note: "Slope sensors within tolerance" },
  { label: "Wildfire Risk", value: 66, tone: "critical" as const, note: "Wind 24 km/h, humidity 21%" },
];

const weather = Array.from({ length: 12 }, (_, i) => ({
  h: `${String(i * 2).padStart(2, "0")}:00`,
  rain: [4, 9, 18, 34, 62, 48, 30, 22, 14, 9, 6, 5][i],
  wind: [12, 14, 18, 21, 24, 22, 19, 17, 15, 13, 12, 11][i],
}));

const flood = Array.from({ length: 10 }, (_, i) => ({
  d: `D+${i}`,
  predicted: [22, 31, 46, 58, 63, 55, 44, 38, 30, 26][i],
  baseline: [20, 22, 25, 28, 30, 29, 27, 26, 24, 23][i],
}));

const landslide = [
  { district: "Beykoz", v: 71 },
  { district: "Sarıyer", v: 58 },
  { district: "Çatalca", v: 44 },
  { district: "Şile", v: 39 },
  { district: "Arnavutköy", v: 31 },
];

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

function RiskAnalysis() {
  return (
    <AppShell
      title="Risk Analysis"
      description="Predictive modelling across seismic, hydrological and slope-stability domains."
      actions={<AuraBadge tone="info">Model v4.2 · updated 6m ago</AuraBadge>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scores.map((s) => (
          <PanelCard key={s.label} className="p-6">
            <div className="flex items-start justify-between">
              <span className="label-xs">{s.label}</span>
              <AuraBadge tone={s.tone}>{s.value > 65 ? "High" : "Elevated"}</AuraBadge>
            </div>
            <div className={cn("num mt-4 text-4xl font-semibold", toneText[s.tone])}>{s.value}</div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  s.tone === "critical" ? "bg-critical" : "bg-warning",
                )}
                style={{ width: `${s.value}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">{s.note}</p>
          </PanelCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <PanelCard title="Weather Analysis" className="lg:col-span-2">
          <div className="h-[280px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weather}>
                <defs>
                  <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--info)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area
                  type="monotone"
                  dataKey="rain"
                  stroke="var(--info)"
                  strokeWidth={2}
                  fill="url(#rain)"
                />
                <Line type="monotone" dataKey="wind" stroke="var(--warning)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Landslide Prediction">
          <div className="h-[280px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={landslide} layout="vertical" barSize={14}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" {...axis} />
                <YAxis type="category" dataKey="district" {...axis} width={80} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                  {landslide.map((d) => (
                    <Cell key={d.district} fill={d.v > 55 ? "var(--critical)" : "var(--warning)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Flood Prediction" className="lg:col-span-2">
          <div className="h-[260px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flood}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Line type="monotone" dataKey="predicted" stroke="var(--warning)" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="baseline"
                  stroke="var(--muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Risk Map">
          <MapCanvas
            events={events.slice(0, 5)}
            active={{ heatmap: true, risk: true }}
            className="h-[260px] w-full rounded-b-xl"
            compact
          />
        </PanelCard>
      </div>
    </AppShell>
  );
}
