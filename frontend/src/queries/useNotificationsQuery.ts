import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import { isAuthenticated } from "@/lib/api-client";
import type { NotificationDto } from "@/types";

export function useUserNotifications(limit = 20) {
  const authed = isAuthenticated();
  return useQuery<NotificationDto[]>({
    queryKey: ["notifications", limit],
    queryFn: () => notificationsService.getMyNotifications(limit),
    enabled: authed,
    staleTime: 30000,
    gcTime: 300000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: () => (isAuthenticated() ? 30000 : false),
  });
}

export function useUnreadNotificationCount(providedList?: NotificationDto[]) {
  const { data: notifications = [] } = useUserNotifications(20);
  const list = providedList ?? notifications;
  return list.filter((n) => !n.isRead).length;
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
  const { data: notifications = [] } = useUserNotifications(20);

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
