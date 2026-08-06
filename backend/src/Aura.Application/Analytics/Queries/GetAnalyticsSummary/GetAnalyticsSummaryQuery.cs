using System.Globalization;
using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using Aura.Domain.Enums;
using MediatR;

namespace Aura.Application.Analytics.Queries.GetAnalyticsSummary;

public record GetAnalyticsSummaryQuery() : IRequest<AnalyticsSummaryDto>, ICacheableRequest
{
    public string CacheKey => "analytics:summary";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public class GetAnalyticsSummaryQueryHandler : IRequestHandler<GetAnalyticsSummaryQuery, AnalyticsSummaryDto>
{
    private readonly IEventRepository _eventRepository;
    private readonly ICitizenReportRepository _citizenReportRepository;
    private readonly IDistrictRiskRepository _districtRiskRepository;

    public GetAnalyticsSummaryQueryHandler(
        IEventRepository eventRepository,
        ICitizenReportRepository citizenReportRepository,
        IDistrictRiskRepository districtRiskRepository)
    {
        _eventRepository = eventRepository;
        _citizenReportRepository = citizenReportRepository;
        _districtRiskRepository = districtRiskRepository;
    }

    public async Task<AnalyticsSummaryDto> Handle(GetAnalyticsSummaryQuery request, CancellationToken cancellationToken)
    {
        var activeEvents = await _eventRepository.GetActiveEventsAsync(cancellationToken);
        var pendingReports = await _citizenReportRepository.GetReportsByStatusAsync(ReportStatus.Pending, cancellationToken);
        var verifiedReports = await _citizenReportRepository.GetReportsByStatusAsync(ReportStatus.Verified, cancellationToken);
        var rejectedReports = await _citizenReportRepository.GetReportsByStatusAsync(ReportStatus.Rejected, cancellationToken);
        var districtRisks = await _districtRiskRepository.GetAllDistrictRisksAsync(cancellationToken);

        double maxMagnitude = 0;
        foreach (var ev in activeEvents)
        {
            if (double.TryParse(ev.Metric, NumberStyles.Any, CultureInfo.InvariantCulture, out var mag))
            {
                if (mag > maxMagnitude)
                {
                    maxMagnitude = mag;
                }
            }
        }

        return new AnalyticsSummaryDto(
            TotalActiveEvents: activeEvents.Count,
            PendingReportsCount: pendingReports.Count,
            VerifiedReportsCount: verifiedReports.Count,
            RejectedReportsCount: rejectedReports.Count,
            TotalDistrictsMonitored: districtRisks.Count,
            HighestEarthquakeMagnitude: maxMagnitude
        );
    }
}
