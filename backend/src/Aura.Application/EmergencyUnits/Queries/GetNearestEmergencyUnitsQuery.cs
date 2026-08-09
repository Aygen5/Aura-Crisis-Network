using Aura.Application.Common.Interfaces;
using Aura.Application.EmergencyUnits.DTOs;
using Aura.Domain.Enums;
using MediatR;
using NetTopologySuite.Geometries;

namespace Aura.Application.EmergencyUnits.Queries;

public record GetNearestEmergencyUnitsQuery(
    double Latitude,
    double Longitude,
    int Count = 50,
    UnitType? TypeFilter = null) : IRequest<IReadOnlyList<EmergencyUnitDto>>;

public class GetNearestEmergencyUnitsQueryHandler : IRequestHandler<GetNearestEmergencyUnitsQuery, IReadOnlyList<EmergencyUnitDto>>
{
    private readonly IEmergencyUnitRepository _repository;

    public GetNearestEmergencyUnitsQueryHandler(IEmergencyUnitRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<EmergencyUnitDto>> Handle(GetNearestEmergencyUnitsQuery request, CancellationToken cancellationToken)
    {
        var units = await _repository.GetNearestUnitsAsync(
            request.Latitude,
            request.Longitude,
            request.Count,
            request.TypeFilter,
            cancellationToken);

        var targetPoint = new Point(request.Longitude, request.Latitude) { SRID = 4326 };

        return units.Select(u =>
        {
            var distanceMeters = u.CurrentLocation != null ? u.CurrentLocation.Distance(targetPoint) * 111320.0 : 0.0;
            var distanceKm = Math.Round(distanceMeters / 1000.0, 2);
            return u.ToDto(distanceKm);
        }).ToList();
    }
}
