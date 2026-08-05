import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  startSignalRConnection,
  onEventCreated,
  onReportStatusChanged,
  getSignalRConnection,
} from "@/lib/signalr-client";
import type { EventDto, CitizenReportDto } from "@/types";

interface SignalRContextType {
  isConnected: boolean;
  subscribeEventCreated: (callback: (event: EventDto) => void) => () => void;
  subscribeReportStatusChanged: (callback: (report: CitizenReportDto) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    startSignalRConnection().then(() => {
      setIsConnected(true);
    });

    const unsubEvent = onEventCreated((newEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    });

    const unsubReport = onReportStatusChanged((updatedReport) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    });

    const interval = setInterval(() => {
      const conn = getSignalRConnection();
      setIsConnected(conn?.state === "Connected");
    }, 5000);

    return () => {
      unsubEvent();
      unsubReport();
      clearInterval(interval);
    };
  }, [queryClient]);

  return (
    <SignalRContext.Provider
      value={{
        isConnected,
        subscribeEventCreated: onEventCreated,
        subscribeReportStatusChanged: onReportStatusChanged,
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
