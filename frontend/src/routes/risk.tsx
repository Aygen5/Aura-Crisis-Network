import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
import { Plus, MapPin, ShieldAlert, Activity, Target } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import { HasRole } from "@/components/aura/HasRole";
import { CreateRiskZoneModal } from "@/components/aura/CreateRiskZoneModal";
import { useRiskAnalysis } from "@/queries/useRiskQuery";
import { useActiveEvents } from "@/queries/useEventsQuery";
import { useIntersectingRiskZones, useBufferAnalysis } from "@/queries/useRiskZonesQuery";
import { isAuthenticated, hasAnyRole } from "@/lib/api-client";

export const Route = createFileRoute("/risk")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
    if (!hasAnyRole(["Operator", "Admin"])) {
      throw redirect({ to: "/" });
    }
  },
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
  const [clickedPoint, setClickedPoint] = useState<{ lat: number; lng: number } | null>({ lat: 41.01, lng: 28.97 });
  const [bufferRadius, setBufferRadius] = useState(5000);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: districtRisks = [], isLoading: isRisksLoading } = useRiskAnalysis();
  const { data: events = [] } = useActiveEvents();

  const { data: intersectingZones = [] } = useIntersectingRiskZones(
    clickedPoint?.lat ?? null,
    clickedPoint?.lng ?? null
  );

  const { data: bufferResult } = useBufferAnalysis(
    clickedPoint?.lat ?? null,
    clickedPoint?.lng ?? null,
    bufferRadius
  );

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
      title="Risk Analiz & PostGIS Harita Merkezi"
      description="Uzamsal poligon kesişim analizi (Point-in-Polygon Geofencing) ve etki tampon çemberi (Buffer Circle)."
      actions={
        <div className="flex items-center gap-2">
          <HasRole roles={["Operator", "Admin"]}>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Yeni Risk Poligonu Ekle
            </button>
          </HasRole>
          <AuraBadge tone="info">Model v4.2 · PostGIS GIST Spatial Index</AuraBadge>
        </div>
      }
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
        <PanelCard
          title="PostGIS Geofencing & Buffer Haritası"
          action={
            <div className="flex items-center gap-2 text-[12px]">
              <span className="text-muted-foreground">Buffer Çember Yarıçapı:</span>
              <select
                value={bufferRadius}
                onChange={(e) => setBufferRadius(Number(e.target.value))}
                className="h-7 rounded border border-border bg-background px-2 text-[11px] outline-none"
              >
                <option value={1000}>1000m (1km)</option>
                <option value={5000}>5000m (5km)</option>
                <option value={10000}>10000m (10km)</option>
              </select>
            </div>
          }
          className="lg:col-span-2"
        >
          <MapCanvas
            events={events}
            active={{ heatmap: false, risk: true }}
            bufferPoint={clickedPoint ? { ...clickedPoint, radiusMeters: bufferRadius } : null}
            onMapClick={(point) => setClickedPoint(point)}
            className="h-[360px] w-full rounded-b-xl"
          />
        </PanelCard>

        <PanelCard title="Harita Kesişim Analizi (Point-in-Polygon)">
          <div className="p-4 space-y-4">
            {clickedPoint ? (
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" /> Tıklanan Koordinat
                </span>
                <p className="num mt-1 text-[13px] font-semibold">
                  {clickedPoint.lat}° N, {clickedPoint.lng}° E
                </p>
              </div>
            ) : (
              <div className="text-[12px] text-muted-foreground">
                Kesişim analizi için haritada bir noktaya tıklayınız.
              </div>
            )}

            <div>
              <h4 className="text-[12px] font-medium text-foreground mb-2 flex items-center justify-between">
                <span>Kesişen PostGIS Risk Poligonları</span>
                <span className="num text-primary font-bold">{intersectingZones.length} Poligon</span>
              </h4>

              {intersectingZones.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
                  Bu koordinat herhangi bir yüksek risk poligonu içermemektedir.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto scroll-slim">
                  {intersectingZones.map((z) => (
                    <div key={z.id} className="rounded-lg border border-border bg-foreground/[0.03] p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-medium">{z.name}</span>
                        <span className="num text-[11px] font-bold text-red-400">{z.severity}/100</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{z.district} · {z.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {bufferResult && (
              <div className="rounded-xl border border-border bg-primary/5 p-3 space-y-1">
                <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Target className="h-3.5 w-3.5" /> Buffer Çember Etki Özeti ({bufferRadius}m)
                </span>
                <p className="text-[12px] text-foreground">
                  Etki alanı altında <span className="font-bold text-primary">{bufferResult.impactedRiskZoneCount}</span> adet risk bölgesi bulunmaktadır.
                </p>
              </div>
            )}
          </div>
        </PanelCard>

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
      </div>

      <CreateRiskZoneModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </AppShell>
  );
}
