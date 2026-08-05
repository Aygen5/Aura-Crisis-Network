import * as signalR from "@microsoft/signalr";
import type { CitizenReportDto, EventDto } from "./api-client";

const HUB_URL = "http://localhost:5000/hubs/crisis";

let connection: signalR.HubConnection | null = null;

export function getSignalRConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return connection;
}

export async function startSignalRConnection(): Promise<void> {
  const conn = getSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
    } catch {
    }
  }
}

export async function stopSignalRConnection(): Promise<void> {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    try {
      await connection.stop();
    } catch {
    }
  }
}

export function onEventCreated(callback: (event: EventDto) => void): () => void {
  const conn = getSignalRConnection();
  const handler = (data: EventDto) => callback(data);
  conn.on("ReceiveEventCreated", handler);

  return () => {
    conn.off("ReceiveEventCreated", handler);
  };
}

export function onReportStatusChanged(callback: (report: CitizenReportDto) => void): () => void {
  const conn = getSignalRConnection();
  const handler = (data: CitizenReportDto) => callback(data);
  conn.on("ReceiveReportStatusChanged", handler);

  return () => {
    conn.off("ReceiveReportStatusChanged", handler);
  };
}

export async function joinDistrictGroup(districtName: string): Promise<void> {
  const conn = getSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke("JoinDistrictGroup", districtName);
  }
}

export async function leaveDistrictGroup(districtName: string): Promise<void> {
  const conn = getSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke("LeaveDistrictGroup", districtName);
  }
}
