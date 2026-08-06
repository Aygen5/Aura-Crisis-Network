export type UnitType = "SearchAndRescue" | "Ambulance" | "FireEngine" | "PolicePatrol";

export type UnitStatus = "Available" | "Dispatched" | "OnScene" | "Maintenance";

export interface EmergencyUnitDto {
  id: string;
  callSign: string;
  plateNumber: string;
  type: UnitType;
  status: UnitStatus;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDegrees: number;
  assignedEventId?: string;
  lastGpsUpdateAt: string;
  distanceKmFromTarget?: number;
}

export interface CreateEmergencyUnitRequest {
  callSign: string;
  plateNumber: string;
  type: UnitType;
  initialLatitude: number;
  initialLongitude: number;
}

export interface UpdateGpsLocationRequest {
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDegrees: number;
}
