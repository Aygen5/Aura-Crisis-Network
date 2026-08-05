import { httpClient } from "@/lib/http-client";
import type { CitizenReportDto, CreateReportRequest, ReportAttachmentDto, ReportStatus } from "@/types";

export const reportsService = {
  async getReportsByStatus(status: ReportStatus = "Pending"): Promise<CitizenReportDto[]> {
    return httpClient<CitizenReportDto[]>(`/reports?status=${status}`);
  },

  async createReport(request: CreateReportRequest): Promise<CitizenReportDto> {
    return httpClient<CitizenReportDto>("/reports", {
      method: "POST",
      body: JSON.stringify(request)
    });
  },

  async uploadAttachment(reportId: string, file: File): Promise<ReportAttachmentDto> {
    const formData = new FormData();
    formData.append("file", file);

    return httpClient<ReportAttachmentDto>(`/reports/${reportId}/attachments`, {
      method: "POST",
      body: formData
    });
  },

  async updateReportStatus(id: string, status: ReportStatus): Promise<void> {
    await httpClient<void>(`/reports/${id}/status?status=${status}`, { method: "PATCH" });
  }
};
