import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    startSignalRConnection().then(() => {
      setIsConnected(true);
    });

    const interval = setInterval(() => {
      const conn = getSignalRConnection();
      setIsConnected(conn?.state === "Connected");
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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
