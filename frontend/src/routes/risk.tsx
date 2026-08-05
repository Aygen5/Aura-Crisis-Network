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
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import { useRiskAnalysis } from "@/queries/useRiskQuery";
import { useActiveEvents } from "@/queries/useEventsQuery";

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

const weather = Array.from({ length: 12 }, (_, i) => ({
  h: `${String(i * 2).padStart(2, "0")}:00`,
  rain: [4, 9, 18, 34, 62, 48, 30, 22, 14, 9, 6, 5][i],
  wind: [12, 14, 18, 21, 24, 22, 19, 17, 15, 13, 12, 11][i],
}));

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
  const { data: districtRisks = [], isLoading: isRisksLoading } = useRiskAnalysis();
  const { data: events = [] } = useActiveEvents();

  const avgSeismic = districtRisks.length
    ? Math.round(districtRisks.reduce((a, b) => a + b.seismicRisk, 0) / districtRisks.length)
    : 70;
  const avgFlood = districtRisks.length
    ? Math.round(districtRisks.reduce((a, b) => a + b.floodRisk, 0) / districtRisks.length)
    : 55;
  const avgLandslide = districtRisks.length
    ? Math.round(districtRisks.reduce((a, b) => a + b.landslideRisk, 0) / districtRisks.length)
    : 40;
  const avgWildfire = districtRisks.length
    ? Math.round(districtRisks.reduce((a, b) => a + b.wildfireRisk, 0) / districtRisks.length)
    : 65;

  const scoreCards = [
    { label: "Sismik Risk", value: avgSeismic, tone: "critical" as const, note: "Kuzey Anadolu Fay Segmenti Gerilimi" },
    { label: "Sel / Taşkın Riski", value: avgFlood, tone: "warning" as const, note: "Meteoroloji Yağış İndeksi Entegrasyonu" },
    { label: "Heyelan Riski", value: avgLandslide, tone: "warning" as const, note: "PostGIS Eğim ve Havza Analizi" },
    { label: "Yangın Riski", value: avgWildfire, tone: "critical" as const, note: "Sıcaklık, Rüzgar ve Nem Analizi" },
  ];

  const districtChartData = districtRisks.map((d) => ({
    district: d.districtName,
    landslide: d.landslideRisk,
    flood: d.floodRisk,
    seismic: d.seismicRisk,
  }));

  return (
    <AppShell
      title="Risk Analiz Merkezi"
      description="Sismik, hidrolojik ve heyelan sensörlerinden dinamik hesaplanan risk tahminleme modelleri."
      actions={<AuraBadge tone="info">Model v4.2 · Canlı PostGIS Entegrasyonu</AuraBadge>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scoreCards.map((s) => (
          <PanelCard key={s.label} className="p-6">
            <div className="flex items-start justify-between">
              <span className="label-xs">{s.label}</span>
              <AuraBadge tone={s.tone}>{s.value > 65 ? "Yüksek" : "Orta"}</AuraBadge>
            </div>
            <div className="num mt-4 text-4xl font-semibold text-primary">{s.value}</div>
            <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${s.value}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">{s.note}</p>
          </PanelCard>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <PanelCard title="Meteorolojik Analiz" className="lg:col-span-2">
          <div className="h-[280px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weather}>
                <defs>
                  <linearGradient id="rain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="h" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area
                  type="monotone"
                  dataKey="rain"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#rain)"
                />
                <Line type="monotone" dataKey="wind" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="İlçe Heyelan & Sel Riski">
          <div className="h-[280px] p-6">
            {isRisksLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Yükleniyor...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtChartData} layout="vertical" barSize={14}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" {...axis} />
                  <YAxis type="category" dataKey="district" {...axis} width={80} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                  <Bar dataKey="landslide" radius={[0, 4, 4, 0]}>
                    {districtChartData.map((d) => (
                      <Cell key={d.district} fill={d.landslide > 50 ? "#ef4444" : "#f59e0b"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </PanelCard>

        <PanelCard title="Canlı İlçe Sel Tahmini" className="lg:col-span-2">
          <div className="h-[260px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtChartData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="district" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Bar dataKey="flood" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Risk Haritası">
          <MapCanvas
            events={events}
            active={{ heatmap: true, risk: true }}
            className="h-[260px] w-full rounded-b-xl"
            compact
          />
        </PanelCard>
      </div>
    </AppShell>
  );
}
