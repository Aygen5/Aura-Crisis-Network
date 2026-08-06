import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import type { NotificationDto } from "@/types";

export function useUserNotifications(limit = 20) {
  return useQuery<NotificationDto[]>({
    queryKey: ["notifications", limit],
    queryFn: () => notificationsService.getMyNotifications(limit),
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications = [] } = useUserNotifications();
  return notifications.filter((n) => !n.isRead).length;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { data: notifications = [] } = useUserNotifications();

  return useMutation({
    mutationFn: async () => {
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(unreadList.map((n) => notificationsService.markAsRead(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
