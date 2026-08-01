import { createFileRoute } from "@tanstack/react-router";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
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

const ranges = ["Daily", "Weekly", "Monthly"] as const;

const volume = [
  { t: "Mon", earthquake: 14, flood: 6, wildfire: 3, report: 21 },
  { t: "Tue", earthquake: 9, flood: 11, wildfire: 2, report: 18 },
  { t: "Wed", earthquake: 17, flood: 8, wildfire: 5, report: 26 },
  { t: "Thu", earthquake: 12, flood: 14, wildfire: 4, report: 30 },
  { t: "Fri", earthquake: 21, flood: 9, wildfire: 7, report: 24 },
  { t: "Sat", earthquake: 16, flood: 5, wildfire: 6, report: 19 },
  { t: "Sun", earthquake: 11, flood: 7, wildfire: 3, report: 15 },
];

const distribution = [
  { name: "Earthquake", value: 42, color: "var(--critical)" },
  { name: "Flood", value: 24, color: "var(--warning)" },
  { name: "Wildfire", value: 14, color: "var(--critical)" },
  { name: "Landslide", value: 10, color: "var(--warning)" },
  { name: "User Report", value: 10, color: "var(--violet)" },
];

const response = [
  { d: "W1", minutes: 8.4 },
  { d: "W2", minutes: 7.1 },
  { d: "W3", minutes: 6.8 },
  { d: "W4", minutes: 5.9 },
  { d: "W5", minutes: 6.2 },
  { d: "W6", minutes: 5.1 },
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
  const [range, setRange] = useState<(typeof ranges)[number]>("Weekly");

  return (
    <AppShell
      title="Analytics"
      description="Response performance and event distribution across the coordination region."
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
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value="412" delta="+12.4%" />
        <StatCard label="Verified Reports" value="286" tone="online" delta="+8.1%" />
        <StatCard label="Avg. Response" value="5.1m" tone="info" delta="−1.7m" />
        <StatCard label="Critical Incidents" value="34" tone="critical" delta="+3" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <PanelCard title={`Event Volume · ${range}`} className="lg:col-span-2">
          <div className="h-[300px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume}>
                <defs>
                  {["critical", "warning", "violet"].map((c) => (
                    <linearGradient key={c} id={`g-${c}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={`var(--${c})`} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={`var(--${c})`} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "var(--border)" }} />
                <Area type="monotone" dataKey="report" stackId="1" stroke="var(--violet)" fill="url(#g-violet)" strokeWidth={2} />
                <Area type="monotone" dataKey="earthquake" stackId="1" stroke="var(--critical)" fill="url(#g-critical)" strokeWidth={2} />
                <Area type="monotone" dataKey="flood" stackId="1" stroke="var(--warning)" fill="url(#g-warning)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>

        <PanelCard title="Disaster Distribution">
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
                <span className="num ml-auto text-foreground">{d.value}%</span>
              </li>
            ))}
          </ul>
        </PanelCard>

        <PanelCard title="Heatmap Summary" className="lg:col-span-2">
          <div className="grid grid-cols-6 gap-1.5 p-6 md:grid-cols-12">
            {districts.map((d, i) => {
              const intensity = ((i * 37) % 100) / 100;
              return (
                <div
                  key={d}
                  title={`${d} · ${Math.round(intensity * 100)} index`}
                  className="group aspect-square rounded-md border border-border/60 transition-transform duration-200 hover:scale-110"
                  style={{
                    background: `color-mix(in oklab, var(--critical) ${Math.round(intensity * 70)}%, var(--card))`,
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3 px-6 pb-6 text-[11px] text-muted-foreground">
            Low
            <span className="h-1.5 flex-1 rounded-full bg-linear-to-r from-card to-critical" />
            High
          </div>
        </PanelCard>

        <PanelCard title="Response Time Trend">
          <div className="h-[220px] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={response} barSize={18}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" {...axis} />
                <YAxis {...axis} width={28} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="minutes" fill="var(--info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelCard>
      </div>
    </AppShell>
  );
}
