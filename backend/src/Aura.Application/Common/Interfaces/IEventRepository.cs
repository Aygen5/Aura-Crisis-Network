using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IEventRepository
{
    Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetActiveEventsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Event>> GetEventsByBoundingBoxAsync(
        double minLat, double minLng, double maxLat, double maxLng, CancellationToken cancellationToken = default);
    Task AddAsync(Event entity, CancellationToken cancellationToken = default);
    void Update(Event entity);
}
