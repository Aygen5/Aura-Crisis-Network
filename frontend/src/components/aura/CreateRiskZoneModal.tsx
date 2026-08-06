import { useState } from "react";
import { X, ShieldAlert, Plus, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useCreateRiskZone } from "@/queries/useRiskZonesQuery";
import type { RiskZoneType, GeoPointDto } from "@/types";

interface CreateRiskZoneModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateRiskZoneModal({ open, onClose, onSuccess }: CreateRiskZoneModalProps) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("Kadıköy");
  const [type, setType] = useState<RiskZoneType>("FloodHazardZone");
  const [severity, setSeverity] = useState(80);
  const [description, setDescription] = useState("");
  const [pointsInput, setPointsInput] = useState("41.01, 28.97\n41.03, 29.01\n40.99, 29.02");

  const createMutation = useCreateRiskZone();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Lütfen bölge adını giriniz.");
      return;
    }

    const rawLines = pointsInput.split("\n").filter((l) => l.trim().length > 0);
    const parsedPoints: GeoPointDto[] = [];

    for (const line of rawLines) {
      const parts = line.split(",").map((p) => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        parsedPoints.push({ latitude: parts[0], longitude: parts[1] });
      }
    }

    if (parsedPoints.length < 3) {
      toast.error("Poligon oluşturmak için en az 3 koordinat girmelisiniz.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name,
        district,
        type,
        severity,
        description,
        polygonPoints: parsedPoints,
      });

      toast.success(`'${name}' PostGIS risk poligonu veritabanına başarıyla eklendi.`);
      setName("");
      setDescription("");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Risk poligonu oluşturulurken bir hata oluştu.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl animate-fade-in">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight">Yeni PostGIS Risk Poligonu Oluştur</h2>
              <p className="text-[12px] text-muted-foreground">Harita üzerinde uzamsal geofencing alanı tanımlayın.</p>
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
          <div>
            <label className="block text-[12px] font-medium mb-1">Poligon Bölge Adı</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Kadıköy Kurubağ Dere Yatağı Sel Poligonu"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium mb-1">İlçe</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Örn. Kadıköy"
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium mb-1">Risk Türü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as RiskZoneType)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring"
              >
                <option value="FloodHazardZone">Sel / Taşkın Riski (Flood)</option>
                <option value="SeismicFaultZone">Sismik Fay Hattı (Seismic)</option>
                <option value="LandslideHazardZone">Heyelan Riski (Landslide)</option>
                <option value="EvacuationZone">Tahliye Bölgesi (Evacuation)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[12px] font-medium mb-1">
              <span>Şiddet İndeksi (Severity)</span>
              <span className="num text-primary font-bold">{severity} / 100</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium mb-1">Açıklama</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Risk alanı gerekçesi ve PostGIS analizi özeti..."
              className="w-full rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-[12px] font-medium mb-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Poligon Köşe Koordinatları (Enlem, Boylam)
            </label>
            <textarea
              rows={3}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="Her satıra bir koordinat çifti giriniz:\n41.01, 28.97\n41.03, 29.01\n40.99, 29.02"
              className="font-mono w-full rounded-lg border border-border bg-background p-3 text-[12px] outline-none focus:border-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-border px-4 text-[13px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "Kaydediliyor..." : "PostGIS Poligonunu Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
