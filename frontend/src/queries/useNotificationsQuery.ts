import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/services/notifications.service";
import { useAuth } from "@/providers/AuthProvider";
import { isAuthenticated } from "@/lib/api-client";
import type { NotificationDto } from "@/types";

export function useUserNotifications(limit = 20) {
  const { authenticated, user } = useAuth();
  const userId = user?.email || user?.fullName || "anonymous";
  const hasValidAuth = typeof window !== "undefined" && Boolean(user?.accessToken) && isAuthenticated();

  return useQuery<NotificationDto[]>({
    queryKey: ["notifications", userId, limit],
    queryFn: () => notificationsService.getMyNotifications(limit),
    enabled: Boolean(authenticated && hasValidAuth),
    staleTime: 60000,
    gcTime: 300000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
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

  return useMutation({
    mutationFn: async () => {
      const notifications = queryClient.getQueryData<NotificationDto[]>(["notifications", 20]) || [];
      const unreadList = notifications.filter((n) => !n.isRead);
      await Promise.all(unreadList.map((n) => notificationsService.markAsRead(n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
