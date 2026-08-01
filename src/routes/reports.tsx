import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Search } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { AuraBadge, PanelCard, toneText } from "@/components/aura/primitives";
import { disasterMeta, reports } from "@/lib/aura-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Report Center — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Review, verify and triage incoming field and citizen incident reports across every district in one enterprise table.",
      },
      { property: "og:title", content: "Report Center — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Triage pending, verified and rejected crisis reports.",
      },
    ],
  }),
  component: ReportCenter,
});

const tabs = ["All", "Pending", "Verified", "Rejected"] as const;

const statusTone = {
  Pending: "warning",
  Verified: "online",
  Rejected: "critical",
} as const;

function ReportCenter() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      reports.filter(
        (r) =>
          (tab === "All" || r.status === tab) &&
          (q === "" ||
            `${r.title} ${r.district} ${r.reporter} ${r.id}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [tab, q],
  );

  return (
    <AppShell
      title="Report Center"
      description="Field and citizen submissions awaiting verification by the duty desk."
      actions={
        <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      }
    >
      <PanelCard className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] transition-colors duration-200",
                  tab === t
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
                <span className="num ml-1.5 text-[11px] text-muted-foreground">
                  {t === "All" ? reports.length : reports.filter((r) => r.status === t).length}
                </span>
              </button>
            ))}
          </div>

          <label className="ml-auto flex h-9 w-72 items-center gap-2 rounded-lg border border-border px-3 transition-colors duration-200 focus-within:border-ring">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search reports"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </label>

          <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filters
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Report", "Type", "District", "Reporter", "Received", "Status", ""].map((h) => (
                <th key={h} className="label-xs px-6 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-secondary/50"
              >
                <td className="px-6 py-4">
                  <div className="text-[13px] font-medium">{r.title}</div>
                  <div className="num mt-0.5 text-[11px] text-muted-foreground">{r.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 text-[12px]",
                      toneText[disasterMeta[r.type].tone],
                    )}
                  >
                    <span className="h-3.5 w-3.5">
                      <DisasterIcon type={r.type} animated={false} />
                    </span>
                    {disasterMeta[r.type].label}
                  </span>
                </td>
                <td className="px-6 py-4 text-[12px] text-muted-foreground">{r.district}</td>
                <td className="px-6 py-4 text-[12px] text-muted-foreground">{r.reporter}</td>
                <td className="num px-6 py-4 text-[12px] text-muted-foreground">{r.time}</td>
                <td className="px-6 py-4">
                  <AuraBadge tone={statusTone[r.status]}>{r.status}</AuraBadge>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-[12px] text-muted-foreground">
            Showing {rows.length} of {reports.length} reports
          </span>
          <div className="flex items-center gap-1">
            {["Previous", "1", "2", "Next"].map((p) => (
              <button
                key={p}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] transition-colors duration-200",
                  p === "1"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </PanelCard>
    </AppShell>
  );
}
