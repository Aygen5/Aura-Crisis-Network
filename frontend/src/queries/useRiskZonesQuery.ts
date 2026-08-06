import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riskZonesService } from "@/services/risk-zones.service";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";
import type { BufferAnalysisResultDto, CreateRiskZoneRequest, RiskZoneDto } from "@/types";

export function useIntersectingRiskZones(latitude: number | null, longitude: number | null) {
  return useQuery<RiskZoneDto[]>({
    queryKey: QUERY_KEYS.riskZones.intersects(latitude!, longitude!),
    queryFn: () => riskZonesService.getIntersectingZones(latitude!, longitude!),
    enabled: latitude !== null && longitude !== null,
    staleTime: QUERY_CACHE_TTL.RISK_ZONES,
  });
}

export function useBufferAnalysis(latitude: number | null, longitude: number | null, radiusMeters = 5000) {
  return useQuery<BufferAnalysisResultDto>({
    queryKey: QUERY_KEYS.riskZones.buffer(latitude!, longitude!, radiusMeters),
    queryFn: () => riskZonesService.getBufferAnalysis(latitude!, longitude!, radiusMeters),
    enabled: latitude !== null && longitude !== null,
    staleTime: QUERY_CACHE_TTL.RISK_ZONES,
  });
}

export function useCreateRiskZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRiskZoneRequest) => riskZonesService.createRiskZone(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.riskZones.all });
    },
  });
}
