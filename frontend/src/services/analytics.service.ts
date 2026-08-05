import { httpClient } from "@/lib/http-client";
import type { AnalyticsSummaryDto } from "@/types";

export const analyticsService = {
  async getAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
    return httpClient<AnalyticsSummaryDto>("/analytics/summary");
  }
};
