export type NotificationType =
  | "SystemAlert"
  | "CriticalEvent"
  | "ReportStatusChanged"
  | "EmergencyDispatch";

export interface NotificationDto {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  payloadJson?: string;
  createdAt: string;
}

export interface SendNotificationRequest {
  recipientUserId: string;
  title: string;
  message: string;
  type: NotificationType;
  payloadJson?: string;
}
