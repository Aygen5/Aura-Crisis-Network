using Aura.Application.Common.Interfaces;
using Aura.Application.EmergencyUnits.DTOs;
using MediatR;

namespace Aura.Application.EmergencyUnits.Queries;

public record GetAllEmergencyUnitsQuery : IRequest<IReadOnlyList<EmergencyUnitDto>>, ICacheableRequest
{
    public string CacheKey => "emergency-units:all";
    public TimeSpan? Expiration => TimeSpan.FromSeconds(15);
}

public class GetAllEmergencyUnitsQueryHandler : IRequestHandler<GetAllEmergencyUnitsQuery, IReadOnlyList<EmergencyUnitDto>>
{
    private readonly IEmergencyUnitRepository _repository;

    public GetAllEmergencyUnitsQueryHandler(IEmergencyUnitRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<EmergencyUnitDto>> Handle(GetAllEmergencyUnitsQuery request, CancellationToken cancellationToken)
    {
        var units = await _repository.GetAllAsync(cancellationToken);
        return units.Select(u => u.ToDto()).ToList();
    }
}
