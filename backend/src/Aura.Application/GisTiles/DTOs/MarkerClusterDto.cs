namespace Aura.Application.GisTiles.DTOs;

public record MarkerClusterDto(
    string ClusterId,
    int PointCount,
    double Latitude,
    double Longitude,
    int MaxSeverity,
    string PrimaryDisasterType,
    bool IsCluster);
