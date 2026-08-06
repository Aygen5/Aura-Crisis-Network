import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { riskZonesService } from "@/services/risk-zones.service";
import type { BufferAnalysisResultDto, CreateRiskZoneRequest, RiskZoneDto } from "@/types";

export function useIntersectingRiskZones(latitude: number | null, longitude: number | null) {
  return useQuery<RiskZoneDto[]>({
    queryKey: ["riskZones", "intersects", latitude, longitude],
    queryFn: () => riskZonesService.getIntersectingZones(latitude!, longitude!),
    enabled: latitude !== null && longitude !== null,
  });
}

export function useBufferAnalysis(latitude: number | null, longitude: number | null, radiusMeters = 5000) {
  return useQuery<BufferAnalysisResultDto>({
    queryKey: ["riskZones", "buffer", latitude, longitude, radiusMeters],
    queryFn: () => riskZonesService.getBufferAnalysis(latitude!, longitude!, radiusMeters),
    enabled: latitude !== null && longitude !== null,
  });
}

export function useCreateRiskZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRiskZoneRequest) => riskZonesService.createRiskZone(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["riskZones"] });
      queryClient.invalidateQueries({ queryKey: ["risk"] });
    },
  });
}
