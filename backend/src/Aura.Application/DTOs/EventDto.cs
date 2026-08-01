using Aura.Domain.Enums;

namespace Aura.Application.DTOs;

public record EventDto(
    Guid Id,
    string Title,
    DisasterType Type,
    int Severity,
    double Latitude,
    double Longitude,
    string LocationName,
    string District,
    EventStatus Status,
    string Source,
    string Metric,
    string MetricLabel,
    string Summary,
    DateTimeOffset DetectedAt,
    DateTimeOffset? EscalatedAt
);
