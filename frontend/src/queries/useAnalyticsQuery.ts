import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: QUERY_KEYS.analytics.summary(),
    queryFn: () => analyticsService.getAnalyticsSummary(),
    staleTime: QUERY_CACHE_TTL.ANALYTICS_SUMMARY,
    gcTime: 900000,
  });
}
