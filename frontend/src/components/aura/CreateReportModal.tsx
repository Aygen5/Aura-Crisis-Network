import { useState, useEffect } from "react";
import { X, MapPin, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { FileUploadZone } from "./FileUploadZone";
import {
  createCitizenReport,
  uploadReportAttachment,
  type DisasterType,
} from "@/lib/api-client";

interface CreateReportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const istanbulDistricts = [
  "Kadıköy", "Üsküdar", "Beşiktaş", "Fatih", "Şişli", "Maltepe",
  "Pendik", "Kartal", "Bakırköy", "Avcılar", "Beylikdüzü", "Silivri",
  "Sarıyer", "Beykoz", "Başakşehir", "Esenyurt", "Ümraniye", "Sancaktepe"
];

const defaultCoords: Record<string, { lat: number; lng: number }> = {
  "Kadıköy": { lat: 40.9901, lng: 29.0291 },
  "Üsküdar": { lat: 41.0267, lng: 29.0152 },
  "Beşiktaş": { lat: 41.0422, lng: 29.0083 },
  "Fatih": { lat: 41.0186, lng: 28.9392 },
  "Şişli": { lat: 41.0601, lng: 28.9877 },
  "Maltepe": { lat: 40.9247, lng: 29.1311 },
  "Pendik": { lat: 40.8753, lng: 29.2344 },
  "Bakırköy": { lat: 40.9801, lng: 28.8722 },
  "Avcılar": { lat: 40.9796, lng: 28.7217 },
  "Beylikdüzü": { lat: 41.0028, lng: 28.6419 },
  "Silivri": { lat: 41.0744, lng: 28.2475 },
};

export function CreateReportModal({ open, onClose, onSuccess }: CreateReportModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DisasterType>("Report");
  const [district, setDistrict] = useState("Kadıköy");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [latitude, setLatitude] = useState(40.9901);
  const [longitude, setLongitude] = useState(29.0291);
  const [summary, setSummary] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function handleDistrictChange(newDistrict: string) {
    setDistrict(newDistrict);
    if (defaultCoords[newDistrict]) {
      setLatitude(defaultCoords[newDistrict].lat);
      setLongitude(defaultCoords[newDistrict].lng);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !district || !summary) {
      toast.error("Lütfen gerekli alanları doldurunuz.");
      return;
    }

    setSubmitting(true);

    try {
      const disasterTypeNumericMap: Record<string, number> = {
        Earthquake: 1,
        Flood: 2,
        Wildfire: 3,
        Landslide: 4,
        Medical: 5,
        Report: 6,
      };

      const report = await createCitizenReport({
        title,
        type: (disasterTypeNumericMap[type] ?? 6) as any,
        district,
        reporterName: reporterName || "Anonim Vatandaş",
        reporterPhone: reporterPhone || "",
        latitude,
        longitude,
        summary
      });

      if (files.length > 0) {
        toast.info(`${files.length} adet medya yükleniyor...`);
        for (const file of files) {
          await uploadReportAttachment(report.id, file);
        }
      }

      toast.success("İhbar ve dosyalar başarıyla gönderildi.");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "İhbar oluşturulamadı. Lütfen tekrar deneyiniz.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle("");
    setType("Report");
    setDistrict("Kadıköy");
    setReporterName("");
    setReporterPhone("");
    setSummary("");
    setFiles([]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl scroll-slim"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 id="modal-title" className="text-[16px] font-semibold tracking-tight">
                Yeni Afet / İhbar Bildir
              </h2>
              <p className="text-[12px] text-muted-foreground">
                Saha gözlemlerinizi ve medya kanıtlarınızı komuta merkezine iletin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                İhbar Başlığı *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: Avcılar Sahil Yolu Su Baskını"
                required
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                Afet / İhbar Türü *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DisasterType)}
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              >
                <option value="Report">Saha İhbarı</option>
                <option value="Earthquake">Deprem</option>
                <option value="Flood">Sel / Taşkın</option>
                <option value="Wildfire">Orman Yangını</option>
                <option value="Landslide">Heyelan</option>
                <option value="Medical">Tıbbi Tahliye</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                İlçe *
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              >
                {istanbulDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                Enlem (Lat)
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                Boylam (Lng)
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                Bildiren Ad Soyad
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Ahmet Yılmaz (Opsiyonel)"
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium text-foreground">
                İletişim Telefonu
              </label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
                className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-foreground">
              Açıklama / Saha Detayı *
            </label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Olayın gelişimi, hasar durumu ve acil ihtiyaçlar..."
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">
              Fotoğraf / Video / Belge Kanıtı Yükle (FAZ 7.1)
            </label>
            <FileUploadZone files={files} onFilesChange={setFiles} disabled={submitting} />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-9 rounded-lg border border-border px-4 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-5 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? "Gönderiliyor..." : "İhbarı Bildir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
