namespace Aura.Application.Health.DTOs;

public record ComponentHealthDto(
    string Name,
    string Status,
    double LatencyMs,
    string? Description,
    string? Error);

public record SystemHealthDto(
    string OverallStatus,
    double TotalLatencyMs,
    DateTimeOffset CheckedAt,
    double MemoryUsageMb,
    int ActiveSignalRConnections,
    IReadOnlyList<ComponentHealthDto> Components);
