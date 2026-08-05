import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/aura/AppShell";
import { PanelCard, StatCard } from "@/components/aura/primitives";
import { useAnalyticsSummary } from "@/queries/useAnalyticsQuery";
import { useActiveEvents } from "@/queries/useEventsQuery";
import { isAuthenticated, hasAnyRole } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
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
      { title: "Analytics — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Operational analytics for crisis response: event volume trends, disaster distribution, district heatmap summary and response times.",
      },
      { property: "og:title", content: "Analytics — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Daily, weekly and monthly crisis response performance analytics.",
      },
    ],
  }),
  component: Analytics,
});

const ranges = ["Günlük", "Haftalık", "Aylık"] as const;

const volume = [
  { t: "Pzt", earthquake: 14, flood: 6, wildfire: 3, report: 21 },
  { t: "Sal", earthquake: 9, flood: 11, wildfire: 2, report: 18 },
  { t: "Çar", earthquake: 17, flood: 8, wildfire: 5, report: 26 },
  { t: "Per", earthquake: 12, flood: 14, wildfire: 4, report: 30 },
  { t: "Cum", earthquake: 21, flood: 9, wildfire: 7, report: 24 },
  { t: "Cmt", earthquake: 16, flood: 5, wildfire: 6, report: 19 },
  { t: "Paz", earthquake: 11, flood: 7, wildfire: 3, report: 15 },
];

const response = [
  { d: "H1", minutes: 8.4 },
  { d: "H2", minutes: 7.1 },
  { d: "H3", minutes: 6.8 },
  { d: "H4", minutes: 5.9 },
  { d: "H5", minutes: 6.2 },
  { d: "H6", minutes: 5.1 },
];

const districts = [
  "Silivri", "Beylikdüzü", "Avcılar", "Bakırköy", "Fatih", "Beşiktaş",
  "Şişli", "Kâğıthane", "Üsküdar", "Kadıköy", "Maltepe", "Pendik",
  "Tuzla", "Beykoz", "Sarıyer", "Çatalca", "Arnavutköy", "Başakşehir",
  "Bağcılar", "Esenyurt", "Ümraniye", "Sancaktepe", "Şile", "Adalar",
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

function Analytics() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Haftalık");
  const { data: summary } = useAnalyticsSummary();
  const { data: events = [] } = useActiveEvents();

  const distribution = [
    { name: "Aktif Afetler", value: summary?.totalActiveEvents || events.length, color: "#ef4444" },
    { name: "Onaylı İhbarlar", value: summary?.verifiedReportsCount || 0, color: "#10b981" },
    { name: "Bekleyen İhbarlar", value: summary?.pendingReportsCount || 0, color: "#f59e0b" },
    { name: "Reddedilen İhbarlar", value: summary?.rejectedReportsCount || 0, color: "#6b7280" },
  ];

  return (
    <AppShell
      title="Analitik Performans"
      description="Kriz yönetim koordinasyon bölgesi müdahale süreleri ve afet dağılım analitiği."
      actions={
        <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] transition-colors duration-200",
                range === r
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Toplam Aktif Afetler"
          value={summary ? summary.totalActiveEvents.toString() : events.length.toString()}
          delta="Canlı Veri"
        />
        <StatCard
          label="Onaylanan İhbarlar"
          value={summary ? summary.verifiedReportsCount.toString() : "0"}
          tone="online"
          delta="Saha Doğrulama"
        />
        <StatCard
          label="Bekleyen İhbarlar"
          value={summary ? summary.pendingReportsCount.toString() : "0"}
          tone="info"
          delta="Nöbetçi Masa"
        />
        <StatCard
          label="Max Deprem Büyüklüğü"
          value={summary ? `${summary.highestEarthquakeMagnitude.toFixed(1)} ML` : "0.0 ML"}
          tone="critical"
          delta="Kandilli Rasathanesi"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <PanelCard title={`Olay Hacmi · ${range}`} className="lg:col-span-2">
          <div className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume}>
                <defs>
                  {["#ef4444", "#f59e0b", "#a855f7"].map((c, i) => (
                    <linearGradient key={c} id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area type="monotone" dataKey="report" stackId="1" stroke="#a855f7" fill="url(#g-2)" strokeWidth={2} />
                <Area type="monotone" dataKey="earthquake" stackId="1" stroke="#ef4444" fill="url(#g-0)" strokeWidth={2} />
                <Area type="monotone" dataKey="flood" stackId="1" stroke="#f59e0b" fill="url(#g-1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Canlı İhbar & Olay Dağılımı">
          <div className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={3}
                  stroke="none"
                >
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid grid-cols-2 gap-2 px-6 pb-6">
            {distribution.map((d) => (
              <li key={d.name} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                {d.name}
                <span className="num ml-auto text-foreground">{d.value}</span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="İlçe Yoğunluk Haritası" className="lg:col-span-2">
          <div className="grid grid-cols-6 gap-1.5 p-6 md:grid-cols-12">
            {districts.map((d, i) => {
              const intensity = ((i * 37) % 100) / 100;
              return (
                <div
                  key={d}
                  title={`${d} · ${Math.round(intensity * 100)} indeks`}
                  className="group aspect-square rounded-md border border-border/60 transition-transform duration-200 hover:scale-110"
                  style={{
                    background: `color-mix(in oklab, #ef4444 ${Math.round(intensity * 70)}%, var(--card))`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-6 pb-6 text-[11px] text-muted-foreground">
            Düşük
            <span className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-card to-red-500" />
            Yüksek
          </div>
        </PanelCard>

        <PanelCard title="Müdahale Süresi Trendi">
          <div className="h-[220px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={response} barSize={18}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      </div>
    </AppShell>
  );
}
