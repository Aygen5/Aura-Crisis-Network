export type DisasterType = 'Earthquake' | 'Flood' | 'Wildfire' | 'Landslide' | 'Medical' | 'Report';
export type EventStatus = 'Active' | 'Monitoring' | 'Resolved';
export type ReportStatus = 'Pending' | 'Verified' | 'Rejected';

export interface EventDto {
  id: string;
  title: string;
  type: DisasterType;
  severity: number;
  latitude: number;
  longitude: number;
  locationName: string;
  district: string;
  status: EventStatus;
  source: string;
  metric: string;
  metricLabel: string;
  summary: string;
  detectedAt: string;
  escalatedAt?: string;
}

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

export interface DistrictRiskDto {
  id: string;
  districtName: string;
  seismicRisk: number;
  floodRisk: number;
  landslideRisk: number;
  wildfireRisk: number;
  lastCalculatedAt: string;
}

export interface AnalyticsSummaryDto {
  totalActiveEvents: number;
  pendingReportsCount: number;
  verifiedReportsCount: number;
  rejectedReportsCount: number;
  totalDistrictsMonitored: number;
  highestEarthquakeMagnitude: number;
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

export interface AuthResponseDto {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  roles: string[];
}

export const disasterMeta: Record<DisasterType, { label: string; icon: string; color: string; badgeClass: string }> = {
  Earthquake: { label: "Deprem", icon: "Activity", color: "#ef4444", badgeClass: "bg-red-500/10 text-red-400 border-red-500/20" },
  Flood: { label: "Sel / Taşkın", icon: "Waves", color: "#0ea5e9", badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  Wildfire: { label: "Orman Yangını", icon: "Flame", color: "#f97316", badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  Landslide: { label: "Heyelan", icon: "Mountain", color: "#eab308", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Medical: { label: "Tıbbi Tahliye", icon: "Cross", color: "#ec4899", badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  Report: { label: "Saha İhbarı", icon: "Radio", color: "#a855f7", badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
};

const API_BASE_URL = "http://localhost:5000/api/v1";
const AUTH_STORAGE_KEY = "aura_auth_session";

export function getStoredAuth(): AuthResponseDto | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(authData: AuthResponseDto): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  }
}

export function clearStoredAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  const auth = getStoredAuth();
  return auth !== null && !!auth.accessToken;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {})
  };

  if (!(options?.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (auth?.accessToken) {
    headers["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    const msg = errData?.errors?.[0] || errData?.Message || `API Error: ${response.status} ${response.statusText}`;
    throw new Error(msg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function loginUser(email: string, password: string): Promise<AuthResponseDto> {
  const response = await fetchJson<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  setStoredAuth(response);
  return response;
}

export async function registerUser(email: string, password: string, fullName: string, role: string = "Citizen"): Promise<{ userId: string }> {
  return fetchJson<{ userId: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName, role })
  });
}

export async function refreshAuthToken(): Promise<AuthResponseDto | null> {
  const auth = getStoredAuth();
  if (!auth) return null;

  try {
    const response = await fetchJson<AuthResponseDto>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ accessToken: auth.accessToken, refreshToken: auth.refreshToken })
    });
    setStoredAuth(response);
    return response;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export async function fetchActiveEvents(): Promise<EventDto[]> {
  return fetchJson<EventDto[]>("/events");
}

export async function fetchEventsByBoundingBox(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<EventDto[]> {
  return fetchJson<EventDto[]>(`/events/bounding-box?minLat=${minLat}&minLng=${minLng}&maxLat=${maxLat}&maxLng=${maxLng}`);
}

export async function fetchEventById(id: string): Promise<EventDto> {
  return fetchJson<EventDto>(`/events/${id}`);
}

export async function escalateEvent(id: string): Promise<void> {
  await fetchJson<void>(`/events/${id}/escalate`, { method: "POST" });
}

export async function fetchReportsByStatus(status: ReportStatus = "Pending"): Promise<CitizenReportDto[]> {
  return fetchJson<CitizenReportDto[]>(`/reports?status=${status}`);
}

export async function createCitizenReport(request: CreateReportRequest): Promise<CitizenReportDto> {
  return fetchJson<CitizenReportDto>("/reports", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function uploadReportAttachment(reportId: string, file: File): Promise<ReportAttachmentDto> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchJson<ReportAttachmentDto>(`/reports/${reportId}/attachments`, {
    method: "POST",
    body: formData
  });
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  await fetchJson<void>(`/reports/${id}/status?status=${status}`, { method: "PATCH" });
}

export async function fetchRiskAnalysis(): Promise<DistrictRiskDto[]> {
  return fetchJson<DistrictRiskDto[]>("/risk/analysis");
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummaryDto> {
  return fetchJson<AnalyticsSummaryDto>("/analytics/summary");
}
