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

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.events.all });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.events.detail(id) });
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.events.active() });

      const previousDetail = queryClient.getQueryData(QUERY_KEYS.events.detail(id));
      const previousActive = queryClient.getQueryData<any[]>(QUERY_KEYS.events.active());

      const updateOptimistically = (event: any) => ({
        ...event,
        severity: Math.min(100, (event.severity || 70) + 15),
        escalatedAt: new Date().toISOString(),
        summary: event.summary?.includes("(YÜKSELTİLDİ)")
          ? event.summary
          : `${event.summary || ""} [ALARM SEVİYESİ YÜKSELTİLDİ]`,
      });

      if (previousDetail) {
        queryClient.setQueryData(
          QUERY_KEYS.events.detail(id),
          updateOptimistically(previousDetail)
        );
      }

      if (previousActive) {
        queryClient.setQueryData(
          QUERY_KEYS.events.active(),
          previousActive.map((e) => (e.id === id ? updateOptimistically(e) : e))
        );
      }

      return { previousDetail, previousActive };
    },

    onError: (err: any, id: string, context: any) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(QUERY_KEYS.events.detail(id), context.previousDetail);
      }
      if (context?.previousActive) {
        queryClient.setQueryData(QUERY_KEYS.events.active(), context.previousActive);
      }
      toast.error(err?.message || "Afet seviyesi yükseltilemedi. Lütfen yetkinizi kontrol ediniz.");
    },

    onSuccess: () => {
      toast.success("Afet alarm seviyesi başarıyla yükseltildi.");
    },

    onSettled: (_, __, id: string) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.detail(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.active() });
    },
  });
}
