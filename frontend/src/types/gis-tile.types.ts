export interface MarkerClusterDto {
  clusterId: string;
  pointCount: number;
  latitude: number;
  longitude: number;
  maxSeverity: number;
  primaryDisasterType: string;
  isCluster: boolean;
}

export interface MapBoundsQuery {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  zoom: number;
}
