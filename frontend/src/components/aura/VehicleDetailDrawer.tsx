import { X, Navigation, Gauge, ShieldAlert, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { AuraBadge } from "./primitives";
import { useDispatchUnit } from "@/queries/useEmergencyUnitsQuery";
import { useAuth } from "@/providers/AuthProvider";
import type { EmergencyUnitDto, EventDto } from "@/types";
import { toast } from "sonner";

type Props = {
  unit: EmergencyUnitDto | null;
  events?: EventDto[];
  onClose: () => void;
};

export function VehicleDetailDrawer({ unit, events = [], onClose }: Props) {
  const dispatchMutation = useDispatchUnit();
  const { user } = useAuth();
  const canDispatch = user?.role === "Operator" || user?.role === "Admin";

  if (!unit) return null;

  const statusColors = {
    Available: "bg-emerald-500 text-emerald-950 border-emerald-400",
    Dispatched: "bg-amber-500 text-amber-950 border-amber-400 animate-pulse",
    OnScene: "bg-red-500 text-red-950 border-red-400 animate-pulse",
    Maintenance: "bg-zinc-600 text-zinc-100 border-zinc-500",
  };

  const statusLabels = {
    Available: "Müsait",
    Dispatched: "Görevlendirildi",
    OnScene: "Olay Yerinde",
    Maintenance: "Bakımda",
  };

  const typeLabels = {
    SearchAndRescue: "AFAD Arama Kurtarma",
    Ambulance: "UMKE / 112 Ambulans",
    FireEngine: "İtfaiye Arazöz",
    PolicePatrol: "Polis / Jandarma Devriye",
  };

  function handleDispatch(eventId: string) {
    if (!unit) return;
    dispatchMutation.mutate(
      { unitId: unit.id, eventId },
      {
        onSuccess: () => {
          toast.success(`${unit.callSign} ekibi başarıyla olaya görevlendirildi!`);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Araç görevlendirme işlemi başarısız oldu.");
        },
      }
    );
  }

  return (
    <div className="glass fixed bottom-6 left-6 z-50 w-96 rounded-xl border border-border p-5 shadow-2xl backdrop-blur-xl animate-slide-in">
      <div className="flex items-start justify-between border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight">{unit.callSign}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase border ${statusColors[unit.status]}`}
            >
              {statusLabels[unit.status]}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{typeLabels[unit.type]}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-foreground/5 p-2.5 border border-white/5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <div>
              <span className="block text-[10px] text-muted-foreground">Anlık Hız</span>
              <span className="font-semibold num">{unit.speedKmh.toFixed(1)} km/s</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-amber-400" />
            <div>
              <span className="block text-[10px] text-muted-foreground">Yön Açısı</span>
              <span className="font-semibold num">{unit.headingDegrees}°</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Plaka No:</span>
            <span className="font-mono font-medium text-foreground">{unit.plateNumber}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Konum:</span>
            <span className="font-mono font-medium text-foreground num">
              {unit.latitude.toFixed(4)}, {unit.longitude.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Son GPS Sinyali:</span>
            <span className="num font-medium text-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {new Date(unit.lastGpsUpdateAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>

        {canDispatch && events.length > 0 && unit.status === "Available" && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <span className="block mb-2 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
              Afet Olayına Görevlendir
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scroll-slim">
              {events.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handleDispatch(e.id)}
                  disabled={dispatchMutation.isPending}
                  className="flex w-full items-center justify-between rounded-md bg-foreground/5 px-2.5 py-1.5 text-left text-[11px] hover:bg-primary/20 hover:text-primary transition-colors"
                >
                  <span className="truncate font-medium">{e.title} ({e.district})</span>
                  <span className="text-[10px] font-bold text-amber-400">Atama Yap →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!canDispatch && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/30 bg-foreground/5 p-2.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Araç görevlendirme ve atama aksiyonları yalnızca yetkili Operatörler içindir.</span>
          </div>
        )}
      </div>
    </div>
  );
}
