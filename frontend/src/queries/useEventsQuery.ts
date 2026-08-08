import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventsService } from "@/services";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";

export function useActiveEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.events.active(),
    queryFn: () => eventsService.getActiveEvents(),
    staleTime: QUERY_CACHE_TTL.EVENTS_ACTIVE,
    gcTime: 600000,
  });
}

export function useEventById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.events.detail(id),
    queryFn: () => eventsService.getEventById(id),
    enabled: !!id,
    staleTime: QUERY_CACHE_TTL.EVENTS_ACTIVE,
  });
}

export function useEscalateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.escalateEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(id) });
      toast.success("Afet alarm seviyesi başarıyla yükseltildi.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Afet seviyesi yükseltilemedi. Lütfen yetkinizi kontrol ediniz.");
    },
  });
}
