import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useMemo, useCallback, memo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { AuditDetailDrawer } from "@/components/aura/AuditDetailDrawer";
import { StatCard, AuraBadge } from "@/components/aura/primitives";
import { useAuditLogs } from "@/queries/useAuditLogsQuery";
import { hasAnyRole, isAuthenticated, type AuditLogDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/audit-logs")({
  beforeLoad: () => {
    if (!isAuthenticated() || !hasAnyRole(["Admin"])) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Denetim İzi & Güvenlik Günlüğü — Aura Crisis Network" },
      {
        name: "description",
        content: "Kurumsal güvenlik ve EF Core Audit Trail denetim paneli.",
      },
    ],
  }),
  component: AuditLogsPage,
});

const entityOptions = ["All", "CitizenReport", "Event", "EmergencyUnit", "RiskZone", "ApplicationUser"];
const actionOptions = ["All", "Added", "Modified", "Deleted", "SoftDeleted", "Restored"];

const AuditRow = memo(function AuditRow({
  log,
  onSelect,
}: {
  log: AuditLogDto;
  onSelect: (log: AuditLogDto) => void;
}) {
  const actionColors = {
    Added: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Modified: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Deleted: "bg-red-500/15 text-red-400 border-red-500/30",
    SoftDeleted: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    Restored: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };

  const changedCount = useMemo(() => {
    if (!log.changedColumns) return 0;
    try {
      const arr = JSON.parse(log.changedColumns);
      return Array.isArray(arr) ? arr.length : 0;
    } catch {
      return 0;
    }
  }, [log.changedColumns]);

  const handleClick = useCallback(() => {
    onSelect(log);
  }, [log, onSelect]);

  return (
    <tr
      onClick={handleClick}
      className="group border-b border-white/5 transition-colors hover:bg-foreground/5 cursor-pointer text-xs"
    >
      <td className="py-3 px-4 num font-mono text-muted-foreground">
        {new Date(log.createdAt).toLocaleString()}
      </td>
      <td className="py-3 px-4 font-medium text-foreground">
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{log.userEmail || "Sistem / Anonim"}</span>
        </div>
      </td>
      <td className="py-3 px-4 font-semibold text-foreground">{log.entityName}</td>
      <td className="py-3 px-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
            actionColors[log.action as keyof typeof actionColors] ?? "bg-zinc-500/15 text-zinc-300 border-zinc-500/30"
          )}
        >
          {log.action}
        </span>
      </td>
      <td className="py-3 px-4 font-mono text-muted-foreground">{log.ipAddress || "—"}</td>
      <td className="py-3 px-4 num text-center font-bold text-primary">{changedCount}</td>
      <td className="py-3 px-4 text-right">
        <button className="rounded-lg p-1 text-muted-foreground transition-colors group-hover:text-foreground">
          <Eye className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
});

function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [entityFilter, setEntityFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogDto | null>(null);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      entityName: entityFilter !== "All" ? entityFilter : undefined,
      action: actionFilter !== "All" ? actionFilter : undefined,
    }),
    [page, pageSize, entityFilter, actionFilter]
  );

  const { data: pagedData, isLoading, isFetching, refetch } = useAuditLogs(queryParams);

  const logs = useMemo(() => {
    if (!pagedData?.items) return [];
    if (!search.trim()) return pagedData.items;

    const term = search.toLowerCase();
    return pagedData.items.filter(
      (l) =>
        l.entityName.toLowerCase().includes(term) ||
        (l.userEmail && l.userEmail.toLowerCase().includes(term)) ||
        (l.ipAddress && l.ipAddress.includes(term)) ||
        (l.correlationId && l.correlationId.toLowerCase().includes(term))
    );
  }, [pagedData, search]);

  const handleLogSelect = useCallback((log: AuditLogDto) => {
    setSelectedLog(log);
  }, []);

  function exportCsv() {
    if (!logs.length) {
      toast.warning("Dışa aktarılacak denetim kaydı bulunamadı.");
      return;
    }

    const headers = "ID,Tarih,Kullanici,Entity,Action,IP,CorrelationId\n";
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.createdAt}","${l.userEmail || ""}","${l.entityName}","${l.action}","${l.ipAddress || ""}","${l.correlationId || ""}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("Audit Log CSV raporu indirildi!");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold tracking-tight">Güvenlik & Denetim İzi (Audit Trail)</h1>
              <AuraBadge tone="online">EF Core Interceptor</AuraBadge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Veritabanında gerçekleşen tüm Ekleme, Güncelleme, Silme ve Restore işlemlerinin otomatik izleme günlüğü.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card/80 px-3 py-2 text-xs font-medium transition-colors hover:bg-foreground/10"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Yenile
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-transform hover:scale-105"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              CSV Dışa Aktar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Toplam Kayıt"
            value={pagedData?.totalCount.toString() ?? "0"}
            delta="Sayfalanmış"
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="Aktif Sayfa"
            value={`${page} / ${pagedData?.totalPages || 1}`}
            tone="online"
            delta="20 Kayıt/Sayfa"
            icon={<Activity className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="Seçili Filtre"
            value={entityFilter === "All" ? "Tüm Varlıklar" : entityFilter}
            tone="warning"
            delta={actionFilter}
            icon={<Filter className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="Veritabanı İzleyici"
            value="Aktif"
            tone="online"
            delta="Correlation Lock"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          />
        </div>

        <section className="glass rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Kullanıcı e-posta, IP veya Correlation ID ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-foreground/5 pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Varlık:</span>
                <select
                  value={entityFilter}
                  onChange={(e) => {
                    setEntityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium"
                >
                  {entityOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground font-medium">Eylem:</span>
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium"
                >
                  {actionOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-foreground/5 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-4 font-semibold">Tarih</th>
                  <th className="py-2.5 px-4 font-semibold">Kullanıcı</th>
                  <th className="py-2.5 px-4 font-semibold">Entity</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">İstemci IP</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Fark (Sütun)</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Detay</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      EF Core Audit kayıtları yükleniyor...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                      Seçilen filtrelere uygun denetim izi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <AuditRow key={log.id} log={log} onSelect={handleLogSelect} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagedData && pagedData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/8 pt-3 text-xs">
              <span className="text-muted-foreground num">
                Toplam {pagedData.totalCount} kayıttan {(page - 1) * pageSize + 1} -{" "}
                {Math.min(page * pageSize, pagedData.totalCount)} arası gösteriliyor
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 font-semibold num">{page}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pagedData.totalPages, p + 1))}
                  disabled={page >= pagedData.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <AuditDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </AppShell>
  );
}
