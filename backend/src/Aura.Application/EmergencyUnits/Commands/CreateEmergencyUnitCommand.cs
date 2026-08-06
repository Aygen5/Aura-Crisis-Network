using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using MediatR;
using NetTopologySuite.Geometries;

namespace Aura.Application.EmergencyUnits.Commands;

public record CreateEmergencyUnitCommand(
    string CallSign,
    string PlateNumber,
    UnitType Type,
    double InitialLatitude,
    double InitialLongitude) : IRequest<Guid>;

public class CreateEmergencyUnitCommandHandler : IRequestHandler<CreateEmergencyUnitCommand, Guid>
{
    private readonly IEmergencyUnitRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateEmergencyUnitCommandHandler(IEmergencyUnitRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateEmergencyUnitCommand request, CancellationToken cancellationToken)
    {
        var point = new Point(request.InitialLongitude, request.InitialLatitude) { SRID = 4326 };
        var unit = new EmergencyUnit(
            request.CallSign,
            request.PlateNumber,
            request.Type,
            point
        );

        await _repository.AddAsync(unit, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return unit.Id;
    }
}
