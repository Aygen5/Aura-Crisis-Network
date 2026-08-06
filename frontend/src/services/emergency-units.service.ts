import { httpClient } from "@/lib/http-client";
import type { CreateEmergencyUnitRequest, EmergencyUnitDto, UnitType, UpdateGpsLocationRequest } from "@/types";

export const emergencyUnitsService = {
  getAllUnits: (): Promise<EmergencyUnitDto[]> =>
    httpClient<EmergencyUnitDto[]>("/emergency-units"),

  getNearestUnits: (
    latitude: number,
    longitude: number,
    count = 5,
    typeFilter?: UnitType
  ): Promise<EmergencyUnitDto[]> => {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      count: count.toString(),
    });
    if (typeFilter) params.append("typeFilter", typeFilter);
    return httpClient<EmergencyUnitDto[]>(`/emergency-units/nearest?${params.toString()}`);
  },

  createUnit: (request: CreateEmergencyUnitRequest): Promise<string> =>
    httpClient<string>("/emergency-units", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  updateLocation: (id: string, request: UpdateGpsLocationRequest): Promise<EmergencyUnitDto> =>
    httpClient<EmergencyUnitDto>(`/emergency-units/${id}/location`, {
      method: "POST",
      body: JSON.stringify(request),
    }),

  dispatchUnit: (id: string, eventId: string): Promise<EmergencyUnitDto> =>
    httpClient<EmergencyUnitDto>(`/emergency-units/${id}/dispatch`, {
      method: "POST",
      body: JSON.stringify({ eventId }),
    }),
};
