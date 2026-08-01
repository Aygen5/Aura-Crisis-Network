using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.DistrictRisks.Queries.GetAllDistrictRisks;

public record GetAllDistrictRisksQuery() : IRequest<IReadOnlyList<DistrictRiskDto>>;

public class GetAllDistrictRisksQueryHandler : IRequestHandler<GetAllDistrictRisksQuery, IReadOnlyList<DistrictRiskDto>>
{
    private readonly IDistrictRiskRepository _districtRiskRepository;

    public GetAllDistrictRisksQueryHandler(IDistrictRiskRepository districtRiskRepository)
    {
        _districtRiskRepository = districtRiskRepository;
    }

    public async Task<IReadOnlyList<DistrictRiskDto>> Handle(GetAllDistrictRisksQuery request, CancellationToken cancellationToken)
    {
        var risks = await _districtRiskRepository.GetAllDistrictRisksAsync(cancellationToken);

        return risks.Select(d => new DistrictRiskDto(
            d.Id,
            d.DistrictName,
            d.SeismicRisk,
            d.FloodRisk,
            d.LandslideRisk,
            d.WildfireRisk,
            d.LastCalculatedAt
        )).ToList();
    }
}
