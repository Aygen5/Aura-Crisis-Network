using Aura.Application.Common.Interfaces;
using Aura.Application.RiskZones.DTOs;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using MediatR;
using NetTopologySuite.Geometries;

namespace Aura.Application.RiskZones.Commands;

public record CreateRiskZoneCommand(
    string Name,
    string District,
    RiskZoneType Type,
    int Severity,
    string Description,
    List<GeoPointDto> PolygonPoints) : IRequest<Guid>;

public class CreateRiskZoneCommandHandler : IRequestHandler<CreateRiskZoneCommand, Guid>
{
    private readonly IRiskZoneRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public CreateRiskZoneCommandHandler(IRiskZoneRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateRiskZoneCommand request, CancellationToken cancellationToken)
    {
        if (request.PolygonPoints == null || request.PolygonPoints.Count < 3)
        {
            throw new ArgumentException("A polygon requires at least 3 points.", nameof(request.PolygonPoints));
        }

        var coordinates = request.PolygonPoints
            .Select(p => new Coordinate(p.Longitude, p.Latitude))
            .ToList();

        if (coordinates.First().X != coordinates.Last().X || coordinates.First().Y != coordinates.Last().Y)
        {
            coordinates.Add(new Coordinate(coordinates.First().X, coordinates.First().Y));
        }

        var linearRing = GeometryFactory.CreateLinearRing(coordinates.ToArray());
        var polygon = GeometryFactory.CreatePolygon(linearRing);

        var riskZone = new RiskZone(
            request.Name,
            request.District,
            request.Type,
            request.Severity,
            request.Description,
            polygon
        );

        await _repository.AddAsync(riskZone, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return riskZone.Id;
    }
}
