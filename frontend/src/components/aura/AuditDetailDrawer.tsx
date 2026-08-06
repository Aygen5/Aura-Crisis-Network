import { useState } from "react";
import { X, ShieldCheck, User, Globe, Clock, FileCode, CheckCircle2, Copy } from "lucide-react";
import type { AuditLogDto } from "@/types";
import { toast } from "sonner";

type Props = {
  log: AuditLogDto | null;
  onClose: () => void;
};

export function AuditDetailDrawer({ log, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const actionStyles = {
    Added: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Modified: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Deleted: "bg-red-500/20 text-red-400 border-red-500/30",
    SoftDeleted: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    Restored: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  function parseJson(str?: string) {
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  }

  const oldParsed = parseJson(log.oldValues);
  const newParsed = parseJson(log.newValues);
  const changedCols: string[] = log.changedColumns ? parseJson(log.changedColumns) ?? [] : [];

  function copyLogToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    toast.success("Denetim izi JSON panoya kopyalandı!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass fixed bottom-6 right-6 top-[88px] z-50 flex w-[520px] flex-col overflow-hidden rounded-xl border border-border p-6 shadow-2xl backdrop-blur-2xl animate-slide-in">
      <div className="flex items-start justify-between border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight">{log.entityName}</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${
                actionStyles[log.action as keyof typeof actionStyles] ?? "bg-zinc-500/20 text-zinc-300"
              }`}
            >
              {log.action}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Entity Key: {log.entityId}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyLogToClipboard}
            title="JSON Kopyala"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="scroll-slim flex-1 space-y-4 overflow-y-auto pt-4 pr-1 text-xs">
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-foreground/5 p-3 border border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" /> İşlemi Yapan Kullanıcı
            </span>
            <p className="font-medium text-foreground truncate">{log.userEmail || "Sistem / Anonim"}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{log.userId || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> İstemci IP & Tarayıcı
            </span>
            <p className="font-mono font-medium text-foreground">{log.ipAddress || "Bilinmiyor"}</p>
            <p className="truncate text-[10px] text-muted-foreground">{log.userAgent || "Yerel İstemci"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-white/8 pb-3">
          <div>
            <span className="text-muted-foreground">Correlation ID:</span>
            <p className="font-mono font-semibold text-primary truncate">{log.correlationId || "N/A"}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Zaman Damgası:</span>
            <p className="num font-semibold text-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {changedCols.length > 0 && (
          <div>
            <span className="block mb-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
              Değiştirilen Sütunlar ({changedCols.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {changedCols.map((col) => (
                <span key={col} className="rounded bg-primary/15 px-2 py-0.5 font-mono text-[11px] text-primary font-medium">
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {oldParsed && (
            <div>
              <span className="block mb-1 font-semibold text-[11px] uppercase tracking-wider text-red-400 flex items-center gap-1">
                <FileCode className="h-3.5 w-3.5" /> Eski Değerler (OldValues JSON)
              </span>
              <pre className="scroll-slim rounded-lg bg-black/60 p-3 font-mono text-[11px] text-red-300/90 border border-red-500/20 overflow-x-auto">
                {JSON.stringify(oldParsed, null, 2)}
              </pre>
            </div>
          )}

          {newParsed && (
            <div>
              <span className="block mb-1 font-semibold text-[11px] uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <FileCode className="h-3.5 w-3.5" /> Yeni Değerler (NewValues JSON)
              </span>
              <pre className="scroll-slim rounded-lg bg-black/60 p-3 font-mono text-[11px] text-emerald-300/90 border border-emerald-500/20 overflow-x-auto">
                {JSON.stringify(newParsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
