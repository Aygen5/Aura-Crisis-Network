import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEYS } from "@/constants";
import {
  startSignalRConnection,
  onEventCreated,
  onReportCreated,
  onReportStatusChanged,
  onVehiclePositionUpdated,
  getSignalRConnection,
  getVehiclesSignalRConnection,
} from "@/lib/signalr-client";
import type { EventDto, CitizenReportDto, EmergencyUnitDto } from "@/types";

interface SignalRContextType {
  isConnected: boolean;
  vehiclesConnected: boolean;
  subscribeEventCreated: (callback: (event: EventDto) => void) => () => void;
  subscribeReportStatusChanged: (callback: (report: CitizenReportDto) => void) => () => void;
  subscribeVehiclePositionUpdated: (callback: (unit: EmergencyUnitDto) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [vehiclesConnected, setVehiclesConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    startSignalRConnection().then(() => {
      setIsConnected(true);
      setVehiclesConnected(true);
    });

    const unsubEvent = onEventCreated((newEvent) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.active() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.summary() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });

      toast.warning(`Yeni ${newEvent.source} Afet Uyarısı: ${newEvent.title}`, {
        description: `${newEvent.district} · Şiddet: ${newEvent.severity}/100`,
      });
    });

    const unsubReportCreated = onReportCreated((newReport) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.active() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.summary() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });

      toast.warning(`Yeni Vatandaş İhbarı Alındı: ${newReport.title}`, {
        description: `${newReport.district} · Bildiren: ${newReport.reporterName || "Vatandaş"}`,
      });
    });

    const unsubReport = onReportStatusChanged((updatedReport) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reports.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.active() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.analytics.summary() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all });

      toast.info(`İhbar Durumu Güncellendi: ${updatedReport.title}`, {
        description: `${updatedReport.district} · Yeni Durum: ${updatedReport.status}`,
      });
    });

    // Throttled batching for vehicle telemetry updates to prevent main thread lockup
    const vehicleBatchBuffer = new Map<string, EmergencyUnitDto>();
    let batchTimer: number | null = null;

    const flushVehicleBatch = () => {
      batchTimer = null;
      if (vehicleBatchBuffer.size === 0) return;

      const batchMap = new Map(vehicleBatchBuffer);
      vehicleBatchBuffer.clear();

      queryClient.setQueryData<EmergencyUnitDto[]>(QUERY_KEYS.emergencyUnits.all, (old) => {
        if (!old) return Array.from(batchMap.values());
        let hasChanges = false;
        const updated = old.map((u) => {
          const fresh = batchMap.get(u.id);
          if (fresh) {
            if (
              u.latitude !== fresh.latitude ||
              u.longitude !== fresh.longitude ||
              u.status !== fresh.status ||
              u.speedKmh !== fresh.speedKmh ||
              u.headingDegrees !== fresh.headingDegrees
            ) {
              hasChanges = true;
              return fresh;
            }
          }
          return u;
        });

        // Add any new units that were not in cache
        for (const [id, fresh] of batchMap.entries()) {
          if (!old.some((u) => u.id === id)) {
            updated.push(fresh);
            hasChanges = true;
          }
        }

        return hasChanges ? updated : old;
      });
    };

    const unsubVehicle = onVehiclePositionUpdated((updatedUnit) => {
      vehicleBatchBuffer.set(updatedUnit.id, updatedUnit);
      if (batchTimer === null) {
        batchTimer = window.setTimeout(flushVehicleBatch, 150);
      }
    });

    const interval = setInterval(() => {
      const conn = getSignalRConnection();
      const vConn = getVehiclesSignalRConnection();
      setIsConnected(conn?.state === "Connected");
      setVehiclesConnected(vConn?.state === "Connected");
    }, 5000);

    return () => {
      unsubEvent();
      unsubReportCreated();
      unsubReport();
      unsubVehicle();
      if (batchTimer !== null) {
        clearTimeout(batchTimer);
      }
      clearInterval(interval);
    };
  }, [queryClient]);

  return (
    <SignalRContext.Provider
      value={{
        isConnected,
        vehiclesConnected,
        subscribeEventCreated: onEventCreated,
        subscribeReportStatusChanged: onReportStatusChanged,
        subscribeVehiclePositionUpdated: onVehiclePositionUpdated,
      }}
    >
      {children}
    </SignalRContext.Provider>
  );
}

export function useSignalR() {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error("useSignalR must be used within a SignalRProvider");
  }
  return context;
}
