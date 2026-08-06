import { httpClient } from "@/lib/http-client";
import type { MapBoundsQuery, MarkerClusterDto } from "@/types";

export const gisTilesService = {
  getClusteredMarkers: (params: MapBoundsQuery): Promise<MarkerClusterDto[]> => {
    const query = new URLSearchParams({
      minLat: params.minLat.toString(),
      minLng: params.minLng.toString(),
      maxLat: params.maxLat.toString(),
      maxLng: params.maxLng.toString(),
      zoom: params.zoom.toString(),
    });
    return httpClient<MarkerClusterDto[]>(`/gis/clusters?${query.toString()}`);
  },

  getVectorTileUrl: (z: number, x: number, y: number): string =>
    `/api/v1/gis/tiles/${z}/${x}/${y}.pbf`,
};
