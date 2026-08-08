import * as signalR from "@microsoft/signalr";
import { API_CONFIG } from "@/config/api.config";
import type { CitizenReportDto, EventDto, EmergencyUnitDto } from "./api-client";

const BASE_SERVER_URL = API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "");
const CRISIS_HUB_URL = `${BASE_SERVER_URL}/hubs/crisis`;
const VEHICLES_HUB_URL = `${BASE_SERVER_URL}/hubs/vehicles`;

let crisisConnection: signalR.HubConnection | null = null;
let vehiclesConnection: signalR.HubConnection | null = null;

export function getSignalRConnection(): signalR.HubConnection {
  if (!crisisConnection) {
    crisisConnection = new signalR.HubConnectionBuilder()
      .withUrl(CRISIS_HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return crisisConnection;
}

export function getVehiclesSignalRConnection(): signalR.HubConnection {
  if (!vehiclesConnection) {
    vehiclesConnection = new signalR.HubConnectionBuilder()
      .withUrl(VEHICLES_HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return vehiclesConnection;
}

export async function startSignalRConnection(): Promise<void> {
  const crisisConn = getSignalRConnection();
  const vehiclesConn = getVehiclesSignalRConnection();

  if (crisisConn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await crisisConn.start();
    } catch {}
  }

  if (vehiclesConn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await vehiclesConn.start();
    } catch {}
  }
}

export function onEventCreated(callback: (event: EventDto) => void): () => void {
  const conn = getSignalRConnection();
  const handler = (data: EventDto) => callback(data);
  conn.on("ReceiveEventCreated", handler);
  conn.on("receiveEventCreated", handler);
  conn.on("receiveeventcreated", handler);

  return () => {
    conn.off("ReceiveEventCreated", handler);
    conn.off("receiveEventCreated", handler);
    conn.off("receiveeventcreated", handler);
  };
}

export function onReportStatusChanged(callback: (report: CitizenReportDto) => void): () => void {
  const conn = getSignalRConnection();
  const handler = (data: CitizenReportDto) => callback(data);
  conn.on("ReceiveReportStatusChanged", handler);
  conn.on("receiveReportStatusChanged", handler);
  conn.on("receivereportstatuschanged", handler);

  return () => {
    conn.off("ReceiveReportStatusChanged", handler);
    conn.off("receiveReportStatusChanged", handler);
    conn.off("receivereportstatuschanged", handler);
  };
}

export function onVehiclePositionUpdated(callback: (unit: EmergencyUnitDto) => void): () => void {
  const conn = getVehiclesSignalRConnection();
  const handler = (data: EmergencyUnitDto) => callback(data);
  conn.on("VehiclePositionUpdated", handler);
  conn.on("vehiclePositionUpdated", handler);
  conn.on("vehiclepositionupdated", handler);

  return () => {
    conn.off("VehiclePositionUpdated", handler);
    conn.off("vehiclePositionUpdated", handler);
    conn.off("vehiclepositionupdated", handler);
  };
}
