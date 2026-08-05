import type { DisasterType, ReportStatus } from "./common.types";

export interface ReportAttachmentDto {
  id: string;
  citizenReportId: string;
  fileName: string;
  fileUrl: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface CitizenReportDto {
  id: string;
  title: string;
  type: DisasterType;
  district: string;
  reporterName: string;
  reporterPhone: string;
  latitude: number;
  longitude: number;
  status: ReportStatus;
  corroborationCount: number;
  summary: string;
  createdAt: string;
  attachments?: ReportAttachmentDto[];
}

export interface CreateReportRequest {
  title: string;
  type: DisasterType;
  district: string;
  reporterName: string;
  reporterPhone: string;
  latitude: number;
  longitude: number;
  summary: string;
}
