namespace Aura.Application.DTOs;

public record DistrictRiskDto(
    Guid Id,
    string DistrictName,
    int SeismicRisk,
    int FloodRisk,
    int LandslideRisk,
    int WildfireRisk,
    DateTimeOffset LastCalculatedAt
);
