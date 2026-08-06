import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { gisTilesService } from "@/services/gis-tiles.service";
import type { MapBoundsQuery, MarkerClusterDto } from "@/types";

export function useClusteredMarkers(params: MapBoundsQuery | null) {
  return useQuery<MarkerClusterDto[]>({
    queryKey: [
      "gis",
      "clusters",
      params?.minLat,
      params?.minLng,
      params?.maxLat,
      params?.maxLng,
      params?.zoom,
    ],
    queryFn: () => gisTilesService.getClusteredMarkers(params!),
    enabled: params !== null,
    placeholderData: keepPreviousData,
    staleTime: 30000,
    gcTime: 300000,
  });
}
