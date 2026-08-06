export type RiskZoneType =
  | "FloodHazardZone"
  | "SeismicFaultZone"
  | "LandslideHazardZone"
  | "EvacuationZone";

export interface GeoPointDto {
  latitude: number;
  longitude: number;
}

export interface RiskZoneDto {
  id: string;
  name: string;
  district: string;
  type: RiskZoneType;
  severity: number;
  description: string;
  polygonCoordinates: GeoPointDto[][];
  createdAt: string;
}

export interface BufferAnalysisResultDto {
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  impactedRiskZoneCount: number;
  impactedZones: RiskZoneDto[];
}

export interface CreateRiskZoneRequest {
  name: string;
  district: string;
  type: RiskZoneType;
  severity: number;
  description: string;
  polygonPoints: GeoPointDto[];
}
