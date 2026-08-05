import { useState } from "react";
import { X, CheckCircle2, XCircle, Upload, MapPin, Phone, User, Calendar, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AuraBadge, StatusDot } from "./primitives";
import { AttachmentGallery } from "./AttachmentGallery";
import { FileUploadZone } from "./FileUploadZone";
import {
  updateReportStatus,
  uploadReportAttachment,
  disasterMeta,
  type CitizenReportDto,
  type ReportStatus,
} from "@/lib/api-client";

interface ReportDetailModalProps {
  report: CitizenReportDto | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const statusTone: Record<ReportStatus, "warning" | "online" | "critical"> = {
  Pending: "warning",
  Verified: "online",
  Rejected: "critical",
};

export function ReportDetailModal({ report, onClose, onRefresh }: ReportDetailModalProps) {
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!report) return null;

  const meta = disasterMeta[report.type] ?? disasterMeta.Report;

  async function handleStatusChange(status: ReportStatus) {
    if (!report) return;
    setActionLoading(true);
    try {
      await updateReportStatus(report.id, status);
      toast.success(`İhbar durumu '${status}' olarak güncellendi.`);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || "İhbar durumu güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUploadNewAttachments() {
    if (!report || newFiles.length === 0) return;
    setUploading(true);
    try {
      toast.info(`${newFiles.length} dosya yükleniyor...`);
      for (const file of newFiles) {
        await uploadReportAttachment(report.id, file);
      }
      toast.success("Yeni medyo/dosyalar başarıyla eklendi.");
      setNewFiles([]);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || "Dosyalar yüklenirken bir hata oluştu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl scroll-slim"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1 pr-4">
            <span
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/25 bg-background/50"
              style={{ color: meta.color }}
            >
              <ShieldAlert className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <AuraBadge tone={statusTone[report.status]}>{report.status}</AuraBadge>
                <span className="num text-[11px] text-muted-foreground">{report.id}</span>
              </div>
              <h2 className="mt-1 truncate text-[16px] font-semibold tracking-tight">{report.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" /> Konum / İlçe
              </span>
              <p className="mt-1 text-[13px] font-medium">{report.district}</p>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <User className="h-3 w-3" /> Bildiren
              </span>
              <p className="mt-1 text-[13px] font-medium">{report.reporterName || "Anonim"}</p>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3" /> İletişim
              </span>
              <p className="mt-1 text-[13px] font-medium">{report.reporterPhone || "Belirtilmedi"}</p>
            </div>

            <div className="rounded-xl border border-border bg-background/40 p-3">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" /> Bildirim Tarihi
              </span>
              <p className="mt-1 text-[12px] font-medium">
                {new Date(report.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-medium text-muted-foreground mb-1.5">Saha Açıklaması</h4>
            <div className="rounded-xl border border-border bg-background/50 p-4 text-[13px] leading-relaxed">
              {report.summary || "Açıklama girilmemiş."}
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-medium text-muted-foreground mb-2">
              Ekli Medya & Belgeler ({report.attachments?.length || 0})
            </h4>
            <AttachmentGallery attachments={report.attachments} />
          </div>

          <div className="rounded-xl border border-border bg-background/30 p-4 space-y-3">
            <h4 className="text-[12px] font-medium text-foreground flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-primary" /> Bu İhbara Ek Medya Yükle
            </h4>
            <FileUploadZone files={newFiles} onFilesChange={setNewFiles} disabled={uploading} />

            {newFiles.length > 0 && (
              <button
                type="button"
                onClick={handleUploadNewAttachments}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? "Yükleniyor..." : "Dosyaları Yükle"}
              </button>
            )}
          </div>

          {report.status === "Pending" && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-[12px] text-muted-foreground">
                Nöbetçi Masa İşlemi:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange("Verified")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[12px] font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" /> İhbarı Onayla
                </button>
                <button
                  onClick={() => handleStatusChange("Rejected")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-[12px] font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> İhbarı Reddet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
