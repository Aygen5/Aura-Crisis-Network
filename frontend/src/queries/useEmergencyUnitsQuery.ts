import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emergencyUnitsService } from "@/services/emergency-units.service";
import type { EmergencyUnitDto, UnitType } from "@/types";

export function useEmergencyUnits() {
  return useQuery<EmergencyUnitDto[]>({
    queryKey: ["emergencyUnits"],
    queryFn: () => emergencyUnitsService.getAllUnits(),
    refetchInterval: 10000,
  });
}

export function useNearestEmergencyUnits(
  latitude: number | null,
  longitude: number | null,
  count = 5,
  typeFilter?: UnitType
) {
  return useQuery<EmergencyUnitDto[]>({
    queryKey: ["emergencyUnits", "nearest", latitude, longitude, count, typeFilter],
    queryFn: () => emergencyUnitsService.getNearestUnits(latitude!, longitude!, count, typeFilter),
    enabled: latitude !== null && longitude !== null,
  });
}

export function useDispatchUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, eventId }: { unitId: string; eventId: string }) =>
      emergencyUnitsService.dispatchUnit(unitId, eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergencyUnits"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
