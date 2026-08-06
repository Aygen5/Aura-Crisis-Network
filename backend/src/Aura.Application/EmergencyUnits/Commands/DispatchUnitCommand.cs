using Aura.Application.Common.Interfaces;
using Aura.Application.EmergencyUnits.DTOs;
using MediatR;

namespace Aura.Application.EmergencyUnits.Commands;

public record DispatchUnitCommand(Guid UnitId, Guid EventId) : IRequest<EmergencyUnitDto>, IInvalidatesCache
{
    public string[] CacheKeysToInvalidate => ["emergency-units:all", "events:active"];
}

public class DispatchUnitCommandHandler : IRequestHandler<DispatchUnitCommand, EmergencyUnitDto>
{
    private readonly IEmergencyUnitRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DispatchUnitCommandHandler(IEmergencyUnitRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<EmergencyUnitDto> Handle(DispatchUnitCommand request, CancellationToken cancellationToken)
    {
        var unit = await _repository.GetByIdAsync(request.UnitId, cancellationToken);
        if (unit == null)
        {
            throw new KeyNotFoundException($"Emergency unit '{request.UnitId}' was not found.");
        }

        unit.DispatchToEvent(request.EventId);

        await _repository.UpdateAsync(unit, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return unit.ToDto();
    }
}
