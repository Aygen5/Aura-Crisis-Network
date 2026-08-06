import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { gisTilesService } from "@/services/gis-tiles.service";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";
import type { MapBoundsQuery, MarkerClusterDto } from "@/types";

export function useClusteredMarkers(params: MapBoundsQuery | null) {
  return useQuery<MarkerClusterDto[]>({
    queryKey: QUERY_KEYS.gis.clusters(
      params?.minLat,
      params?.minLng,
      params?.maxLat,
      params?.maxLng,
      params?.zoom
    ),
    queryFn: () => gisTilesService.getClusteredMarkers(params!),
    enabled: params !== null,
    placeholderData: keepPreviousData,
    staleTime: QUERY_CACHE_TTL.GIS_CLUSTERS,
    gcTime: 300000,
  });
}
