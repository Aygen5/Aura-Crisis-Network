import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Filter, Search, CheckCircle2, XCircle, Plus, Paperclip } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import { CreateReportModal } from "@/components/aura/CreateReportModal";
import { ReportDetailModal } from "@/components/aura/ReportDetailModal";
import { HasRole } from "@/components/aura/HasRole";
import { useReportsByStatus, useUpdateReportStatus } from "@/queries/useReportsQuery";
import { disasterMeta, isAuthenticated, hasAnyRole, type CitizenReportDto, type ReportStatus } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
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

const tabs: Array<ReportStatus | "All"> = ["All", "Pending", "Verified", "Rejected"];

const statusTone: Record<ReportStatus, "warning" | "online" | "critical"> = {
  Pending: "warning",
  Verified: "online",
  Rejected: "critical",
};

function ReportCenter() {
  const [tab, setTab] = useState<ReportStatus | "All">("All");
  const [q, setQ] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CitizenReportDto | null>(null);

  const pendingQuery = useReportsByStatus("Pending");
  const verifiedQuery = useReportsByStatus("Verified");
  const rejectedQuery = useReportsByStatus("Rejected");
  const updateStatusMutation = useUpdateReportStatus();

  const reportsList = useMemo(() => {
    const p = pendingQuery.data || [];
    const v = verifiedQuery.data || [];
    const r = rejectedQuery.data || [];
    if (tab === "Pending") return p;
    if (tab === "Verified") return v;
    if (tab === "Rejected") return r;
    return [...p, ...v, ...r];
  }, [tab, pendingQuery.data, verifiedQuery.data, rejectedQuery.data]);

  async function handleVerify(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    updateStatusMutation.mutate({ id, status: "Verified" });
  }

  async function handleReject(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    updateStatusMutation.mutate({ id, status: "Rejected" });
  }

  const rows = useMemo(
    () =>
      reportsList.filter(
        (r) =>
          (tab === "All" || r.status === tab) &&
          (q === "" ||
            `${r.title} ${r.district} ${r.reporterName} ${r.id}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [tab, q, reportsList]
  );

  return (
    <AppShell
      title="İhbar Yönetim Merkezi"
      description="Saha ve vatandaşlardan gelen canlı ihbarların ve ekli medyanın nöbetçi masa tarafından doğrulanması."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Yeni İhbar Bildir
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
            <Download className="h-3.5 w-3.5" /> Dışa Aktar CSV
          </button>
        </div>
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
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                <span className="num ml-1.5 text-[11px] text-muted-foreground">
                  {t === "All" ? reportsList.length : reportsList.filter((r) => r.status === t).length}
                </span>
              </button>
            ))}
          </div>

          <label className="ml-auto flex h-9 w-72 items-center gap-2 rounded-lg border border-border px-3 transition-colors duration-200 focus-within:border-ring">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İhbarlarda ara..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </label>

          <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
            <Filter className="h-3.5 w-3.5" /> Filtreler
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["İhbar Başlığı", "Tür", "İlçe", "Bildiren", "Tarih", "Medya", "Durum", "İşlemler"].map((h) => (
                <th key={h} className="label-xs px-6 py-3 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = disasterMeta[r.type] ?? disasterMeta.Report;
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className="group border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-secondary/50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="text-[13px] font-medium group-hover:text-primary transition-colors">
                      {r.title}
                    </div>
                    <div className="num mt-0.5 text-[11px] text-muted-foreground">{r.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center gap-2 text-[12px]"
                      style={{ color: meta.color }}
                    >
                      <span className="h-3.5 w-3.5">
                        <DisasterIcon type={r.type} animated={false} />
                      </span>
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] text-muted-foreground">{r.district}</td>
                  <td className="px-6 py-4 text-[12px] text-muted-foreground">{r.reporterName}</td>
                  <td className="num px-6 py-4 text-[12px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4">
                    {r.attachments && r.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                        <Paperclip className="h-3 w-3" /> {r.attachments.length} Dosya
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <AuraBadge tone={statusTone[r.status]}>{r.status}</AuraBadge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {r.status === "Pending" ? (
                      <HasRole roles={["Operator", "Admin"]} fallback={<span className="text-[11px] text-muted-foreground">Nöbetçi İncelemesi</span>}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleVerify(e, r.id)}
                            className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Onayla
                          </button>
                          <button
                            onClick={(e) => handleReject(e, r.id)}
                            className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/20"
                          >
                            <XCircle className="h-3 w-3" /> Reddet
                          </button>
                        </div>
                      </HasRole>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Tamamlandı</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-6 py-4">
          <span className="text-[12px] text-muted-foreground">
            Toplam {rows.length} ihbar listeleniyor
          </span>
        </div>
      </PanelCard>

      <CreateReportModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          pendingQuery.refetch();
          verifiedQuery.refetch();
        }}
      />

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onRefresh={() => {
          pendingQuery.refetch();
          verifiedQuery.refetch();
          rejectedQuery.refetch();
          setSelectedReport(null);
        }}
      />
    </AppShell>
  );
}
