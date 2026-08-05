import type { DisasterType, EventStatus } from "./common.types";

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
