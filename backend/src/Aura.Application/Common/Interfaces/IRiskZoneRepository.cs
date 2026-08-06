using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IRiskZoneRepository
{
    Task AddAsync(RiskZone zone, CancellationToken cancellationToken = default);
    Task<RiskZone?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RiskZone>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RiskZone>> GetIntersectingZonesAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RiskZone>> GetZonesWithinBufferAsync(double latitude, double longitude, double radiusMeters, CancellationToken cancellationToken = default);
}
