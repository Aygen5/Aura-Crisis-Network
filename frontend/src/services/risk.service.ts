import { httpClient } from "@/lib/http-client";
import type { DistrictRiskDto } from "@/types";

export const riskService = {
  async getRiskAnalysis(): Promise<DistrictRiskDto[]> {
    return httpClient<DistrictRiskDto[]>("/risk/analysis");
  }
};
