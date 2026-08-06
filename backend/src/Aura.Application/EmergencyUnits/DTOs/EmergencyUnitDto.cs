using Aura.Domain.Entities;
using Aura.Domain.Enums;

namespace Aura.Application.EmergencyUnits.DTOs;

public record EmergencyUnitDto(
    Guid Id,
    string CallSign,
    string PlateNumber,
    UnitType Type,
    UnitStatus Status,
    double Latitude,
    double Longitude,
    double SpeedKmh,
    double HeadingDegrees,
    Guid? AssignedEventId,
    DateTimeOffset LastGpsUpdateAt,
    double? DistanceKmFromTarget = null);

public static class EmergencyUnitMappingExtensions
{
    public static EmergencyUnitDto ToDto(this EmergencyUnit unit, double? distanceKm = null)
    {
        return new EmergencyUnitDto(
            unit.Id,
            unit.CallSign,
            unit.PlateNumber,
            unit.Type,
            unit.Status,
            unit.CurrentLocation?.Y ?? 0.0,
            unit.CurrentLocation?.X ?? 0.0,
            unit.SpeedKmh,
            unit.HeadingDegrees,
            unit.AssignedEventId,
            unit.LastGpsUpdateAt,
            distanceKm
        );
    }
}
