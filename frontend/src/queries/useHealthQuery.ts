import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/health.service";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";
import type { SystemHealthDto } from "@/types";

export function useSystemHealth() {
  return useQuery<SystemHealthDto>({
    queryKey: QUERY_KEYS.health.system(),
    queryFn: () => healthService.getSystemHealth(),
    refetchInterval: 10000,
    staleTime: QUERY_CACHE_TTL.HEALTH_SYSTEM,
  });
}
