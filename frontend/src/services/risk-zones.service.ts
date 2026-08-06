import { httpClient } from "@/lib/http-client";
import type { BufferAnalysisResultDto, CreateRiskZoneRequest, RiskZoneDto } from "@/types";

export const riskZonesService = {
  createRiskZone: (request: CreateRiskZoneRequest): Promise<string> =>
    httpClient<string>("/risk-zones", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  getIntersectingZones: (latitude: number, longitude: number): Promise<RiskZoneDto[]> =>
    httpClient<RiskZoneDto[]>(`/risk-zones/intersects?latitude=${latitude}&longitude=${longitude}`),

  getBufferAnalysis: (latitude: number, longitude: number, radiusMeters = 5000): Promise<BufferAnalysisResultDto> =>
    httpClient<BufferAnalysisResultDto>(`/risk-zones/buffer?latitude=${latitude}&longitude=${longitude}&radiusMeters=${radiusMeters}`),
};
