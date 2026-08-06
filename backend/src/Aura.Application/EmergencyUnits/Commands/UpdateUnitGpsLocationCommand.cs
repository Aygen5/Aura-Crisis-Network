using Aura.Application.Common.Interfaces;
using Aura.Application.EmergencyUnits.DTOs;
using MediatR;

namespace Aura.Application.EmergencyUnits.Commands;

public record UpdateUnitGpsLocationCommand(
    Guid UnitId,
    double Latitude,
    double Longitude,
    double SpeedKmh,
    double HeadingDegrees) : IRequest<EmergencyUnitDto>;

public class UpdateUnitGpsLocationCommandHandler : IRequestHandler<UpdateUnitGpsLocationCommand, EmergencyUnitDto>
{
    private readonly IEmergencyUnitRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUnitGpsLocationCommandHandler(IEmergencyUnitRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<EmergencyUnitDto> Handle(UpdateUnitGpsLocationCommand request, CancellationToken cancellationToken)
    {
        var unit = await _repository.GetByIdAsync(request.UnitId, cancellationToken);
        if (unit == null)
        {
            throw new KeyNotFoundException($"Emergency unit '{request.UnitId}' was not found.");
        }

        unit.UpdateGpsLocation(request.Latitude, request.Longitude, request.SpeedKmh, request.HeadingDegrees);

        await _repository.UpdateAsync(unit, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return unit.ToDto();
    }
}
