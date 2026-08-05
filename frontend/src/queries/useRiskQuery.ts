import { useQuery } from "@tanstack/react-query";
import { riskService } from "@/services";

export function useRiskAnalysis() {
  return useQuery({
    queryKey: ["risk", "analysis"],
    queryFn: () => riskService.getRiskAnalysis(),
  });
}
