import { httpClient } from "@/lib/http-client";
import type { NotificationDto, SendNotificationRequest } from "@/types";

export const notificationsService = {
  getMyNotifications: (limit = 20): Promise<NotificationDto[]> =>
    httpClient<NotificationDto[]>(`/notifications?limit=${limit}`),

  sendNotification: (request: SendNotificationRequest): Promise<string> =>
    httpClient<string>("/notifications", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  markAsRead: (id: string): Promise<void> =>
    httpClient<void>(`/notifications/${id}/read`, {
      method: "PATCH",
    }),
};
