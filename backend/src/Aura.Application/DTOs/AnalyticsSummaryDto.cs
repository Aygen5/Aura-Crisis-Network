namespace Aura.Application.DTOs;

public record AnalyticsSummaryDto(
    int TotalActiveEvents,
    int PendingReportsCount,
    int VerifiedReportsCount,
    int RejectedReportsCount,
    int TotalDistrictsMonitored,
    double HighestEarthquakeMagnitude
);
