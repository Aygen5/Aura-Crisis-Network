import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emergencyUnitsService } from "@/services/emergency-units.service";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";
import type { EmergencyUnitDto, UnitType } from "@/types";

export function useEmergencyUnits() {
  return useQuery<EmergencyUnitDto[]>({
    queryKey: QUERY_KEYS.emergencyUnits.all,
    queryFn: () => emergencyUnitsService.getAllUnits(),
    staleTime: QUERY_CACHE_TTL.EMERGENCY_UNITS_ALL,
    gcTime: 300000,
  });
}

export function useNearestEmergencyUnits(
  latitude: number | null,
  longitude: number | null,
  count = 5,
  typeFilter?: UnitType
) {
  return useQuery<EmergencyUnitDto[]>({
    queryKey: QUERY_KEYS.emergencyUnits.nearest(latitude, longitude, count, typeFilter),
    queryFn: () => emergencyUnitsService.getNearestUnits(latitude!, longitude!, count, typeFilter),
    enabled: latitude !== null && longitude !== null,
    staleTime: QUERY_CACHE_TTL.EMERGENCY_UNITS_ALL,
  });
}

export function useDispatchUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ unitId, eventId }: { unitId: string; eventId: string }) =>
      emergencyUnitsService.dispatchUnit(unitId, eventId),

    onMutate: async ({ unitId, eventId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.emergencyUnits.all });
      const previousUnits = queryClient.getQueryData<EmergencyUnitDto[]>(QUERY_KEYS.emergencyUnits.all);

      if (previousUnits) {
        queryClient.setQueryData<EmergencyUnitDto[]>(
          QUERY_KEYS.emergencyUnits.all,
          previousUnits.map((u) =>
            u.id === unitId
              ? { ...u, status: "Dispatched", assignedEventId: eventId }
              : u
          )
        );
      }

      return { previousUnits };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousUnits) {
        queryClient.setQueryData(QUERY_KEYS.emergencyUnits.all, context.previousUnits);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.emergencyUnits.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events.all });
    },
  });
}
