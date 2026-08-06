using Aura.Domain.Entities;
using Aura.Domain.Enums;

namespace Aura.Application.RiskZones.DTOs;

public record GeoPointDto(double Latitude, double Longitude);

public record RiskZoneDto(
    Guid Id,
    string Name,
    string District,
    RiskZoneType Type,
    int Severity,
    string Description,
    List<List<GeoPointDto>> PolygonCoordinates,
    DateTimeOffset CreatedAt);

public static class RiskZoneMappingExtensions
{
    public static RiskZoneDto ToDto(this RiskZone zone)
    {
        var coordinates = new List<List<GeoPointDto>>();
        if (zone.Boundary != null && zone.Boundary.ExteriorRing != null)
        {
            var ringPoints = zone.Boundary.ExteriorRing.Coordinates
                .Select(c => new GeoPointDto(c.Y, c.X))
                .ToList();
            coordinates.Add(ringPoints);
        }

        return new RiskZoneDto(
            zone.Id,
            zone.Name,
            zone.District,
            zone.Type,
            zone.Severity,
            zone.Description,
            coordinates,
            zone.CreatedAt
        );
    }
}
