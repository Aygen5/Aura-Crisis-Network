using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using Aura.Domain.Enums;
using MediatR;

namespace Aura.Application.Reports.Queries.GetReportsByStatus;

public record GetReportsByStatusQuery(ReportStatus Status) : IRequest<IReadOnlyList<CitizenReportDto>>;

public class GetReportsByStatusQueryHandler : IRequestHandler<GetReportsByStatusQuery, IReadOnlyList<CitizenReportDto>>
{
    private readonly ICitizenReportRepository _citizenReportRepository;

    public GetReportsByStatusQueryHandler(ICitizenReportRepository citizenReportRepository)
    {
        _citizenReportRepository = citizenReportRepository;
    }

    public async Task<IReadOnlyList<CitizenReportDto>> Handle(GetReportsByStatusQuery request, CancellationToken cancellationToken)
    {
        var reports = await _citizenReportRepository.GetReportsByStatusAsync(request.Status, cancellationToken);

        return reports.Select(r => new CitizenReportDto(
            r.Id,
            r.Title,
            r.Type,
            r.District,
            r.ReporterName,
            r.ReporterPhone,
            r.Location.Latitude,
            r.Location.Longitude,
            r.Status,
            r.CorroborationCount,
            r.Summary,
            r.CreatedAt
        )).ToList();
    }
}
