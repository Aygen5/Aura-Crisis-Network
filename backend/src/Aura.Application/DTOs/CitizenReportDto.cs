using Aura.Domain.Enums;

namespace Aura.Application.DTOs;

public record CitizenReportDto(
    Guid Id,
    string Title,
    DisasterType Type,
    string District,
    string ReporterName,
    string ReporterPhone,
    double Latitude,
    double Longitude,
    ReportStatus Status,
    int CorroborationCount,
    string Summary,
    DateTimeOffset CreatedAt
);
