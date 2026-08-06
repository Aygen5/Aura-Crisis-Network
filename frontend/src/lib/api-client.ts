export * from "@/types";
export * from "@/constants";
export { disasterMeta } from "@/constants/disaster-meta";
export { getStoredAuth, setStoredAuth, clearStoredAuth, isAuthenticated, getUserRoles, hasAnyRole } from "./http-client";
export { authService } from "@/services/auth.service";
export { eventsService } from "@/services/events.service";
export { reportsService } from "@/services/reports.service";
export { riskService } from "@/services/risk.service";
export { analyticsService } from "@/services/analytics.service";
export { notificationsService } from "@/services/notifications.service";
export { riskZonesService } from "@/services/risk-zones.service";
export { gisTilesService } from "@/services/gis-tiles.service";
export { emergencyUnitsService } from "@/services/emergency-units.service";

import { authService } from "@/services/auth.service";
import { eventsService } from "@/services/events.service";
import { reportsService } from "@/services/reports.service";
import { riskService } from "@/services/risk.service";
import { analyticsService } from "@/services/analytics.service";
import { notificationsService } from "@/services/notifications.service";
import { riskZonesService } from "@/services/risk-zones.service";
import { emergencyUnitsService } from "@/services/emergency-units.service";

export const loginUser = (email: string, pass: string) => authService.login({ email, password: pass });
export const registerUser = (email: string, pass: string, name: string, role = "Citizen") => authService.register({ email, password: pass, fullName: name, role });
export const refreshAuthToken = () => authService.refreshToken();

export const fetchActiveEvents = () => eventsService.getActiveEvents();
export const fetchEventsByBoundingBox = (minLat: number, minLng: number, maxLat: number, maxLng: number) => eventsService.getEventsByBoundingBox(minLat, minLng, maxLat, maxLng);
export const fetchEventById = (id: string) => eventsService.getEventById(id);
export const escalateEvent = (id: string) => eventsService.escalateEvent(id);

export const fetchReportsByStatus = (status: any = "Pending") => reportsService.getReportsByStatus(status);
export const createCitizenReport = (req: any) => reportsService.createReport(req);
export const uploadReportAttachment = (id: string, file: File) => reportsService.uploadAttachment(id, file);
export const updateReportStatus = (id: string, status: any) => reportsService.updateReportStatus(id, status);

export const fetchRiskAnalysis = () => riskService.getRiskAnalysis();
export const fetchAnalyticsSummary = () => analyticsService.getAnalyticsSummary();

export const fetchUserNotifications = (limit = 20) => notificationsService.getMyNotifications(limit);
export const markNotificationRead = (id: string) => notificationsService.markAsRead(id);

export const createRiskZone = (req: any) => riskZonesService.createRiskZone(req);
export const fetchIntersectingRiskZones = (lat: number, lng: number) => riskZonesService.getIntersectingZones(lat, lng);
export const fetchBufferAnalysis = (lat: number, lng: number, radius = 5000) => riskZonesService.getBufferAnalysis(lat, lng, radius);

export const fetchEmergencyUnits = () => emergencyUnitsService.getAllUnits();
export const fetchNearestEmergencyUnits = (lat: number, lng: number, count = 5, typeFilter?: any) => emergencyUnitsService.getNearestUnits(lat, lng, count, typeFilter);
export const dispatchEmergencyUnit = (id: string, eventId: string) => emergencyUnitsService.dispatchUnit(id, eventId);
