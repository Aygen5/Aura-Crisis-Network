import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService } from "@/services";
import { getStoredAuth } from "@/lib/api-client";
import type { CreateReportRequest, ReportStatus } from "@/types";

export function useReportsByStatus(status: ReportStatus = "Pending") {
  const user = getStoredAuth();
  const userId = user?.email || user?.fullName || "anonymous";

  return useQuery({
    queryKey: ["reports", userId, status],
    queryFn: () => reportsService.getReportsByStatus(status),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateReportRequest) => reportsService.createReport(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      reportsService.updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, file }: { reportId: string; file: File }) =>
      reportsService.uploadAttachment(reportId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
