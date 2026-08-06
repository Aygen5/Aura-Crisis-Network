using Aura.Domain.Entities;
using Aura.Domain.Enums;

namespace Aura.Application.Common.Interfaces;

public interface IEmergencyUnitRepository
{
    Task AddAsync(EmergencyUnit unit, CancellationToken cancellationToken = default);
    Task<EmergencyUnit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmergencyUnit>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmergencyUnit>> GetNearestUnitsAsync(
        double latitude,
        double longitude,
        int count = 5,
        UnitType? typeFilter = null,
        CancellationToken cancellationToken = default);
    Task UpdateAsync(EmergencyUnit unit, CancellationToken cancellationToken = default);
}
