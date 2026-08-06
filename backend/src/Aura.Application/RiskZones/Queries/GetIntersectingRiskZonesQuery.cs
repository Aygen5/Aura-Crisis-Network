using Aura.Application.Common.Interfaces;
using Aura.Application.RiskZones.DTOs;
using MediatR;

namespace Aura.Application.RiskZones.Queries;

public record GetIntersectingRiskZonesQuery(double Latitude, double Longitude) : IRequest<IReadOnlyList<RiskZoneDto>>;

public class GetIntersectingRiskZonesQueryHandler : IRequestHandler<GetIntersectingRiskZonesQuery, IReadOnlyList<RiskZoneDto>>
{
    private readonly IRiskZoneRepository _repository;

    public GetIntersectingRiskZonesQueryHandler(IRiskZoneRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<RiskZoneDto>> Handle(GetIntersectingRiskZonesQuery request, CancellationToken cancellationToken)
    {
        var zones = await _repository.GetIntersectingZonesAsync(request.Latitude, request.Longitude, cancellationToken);
        return zones.Select(z => z.ToDto()).ToList();
    }
}
