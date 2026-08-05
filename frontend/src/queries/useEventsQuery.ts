import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsService } from "@/services";

export function useActiveEvents() {
  return useQuery({
    queryKey: ["events", "active"],
    queryFn: () => eventsService.getActiveEvents(),
  });
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventsService.getEventById(id),
    enabled: !!id,
  });
}

export function useEscalateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.escalateEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
    },
  });
}
