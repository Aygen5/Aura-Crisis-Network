import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startSignalRConnection,
  onEventCreated,
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
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.warning(`Yeni ${newEvent.source} Afet Uyarısı: ${newEvent.title}`, {
        description: `${newEvent.district} · Şiddet: ${newEvent.severity}/100`,
      });
    });

    const unsubReport = onReportStatusChanged((updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.info(`İhbar Durumu Güncellendi: ${updatedReport.title}`, {
        description: `${updatedReport.district} · Yeni Durum: ${updatedReport.status}`,
      });
    });

    const unsubVehicle = onVehiclePositionUpdated((updatedUnit) => {
      queryClient.invalidateQueries({ queryKey: ["emergencyUnits"] });
    });

    const interval = setInterval(() => {
      const conn = getSignalRConnection();
      const vConn = getVehiclesSignalRConnection();
      setIsConnected(conn?.state === "Connected");
      setVehiclesConnected(vConn?.state === "Connected");
    }, 5000);

    return () => {
      unsubEvent();
      unsubReport();
      unsubVehicle();
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
