using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence.Repositories;

public class EventRepository : IEventRepository
{
    private readonly AuraDbContext _context;

    public EventRepository(AuraDbContext context)
    {
        _context = context;
    }

    public async Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Events.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Event>> GetActiveEventsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Events
            .Where(e => e.Status == Domain.Enums.EventStatus.Active)
            .OrderByDescending(e => e.DetectedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Event>> GetEventsByBoundingBoxAsync(
        double minLat, double minLng, double maxLat, double maxLng, CancellationToken cancellationToken = default)
    {
        var factory = new GeometryFactory(new PrecisionModel(), 4326);
        var envelope = new Envelope(minLng, maxLng, minLat, maxLat);
        var polygon = factory.ToGeometry(envelope);

        return await _context.Events
            .Where(e => _context.Set<Event>().Any(x => x.Id == e.Id))
            .OrderByDescending(e => e.DetectedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Event entity, CancellationToken cancellationToken = default)
    {
        await _context.Events.AddAsync(entity, cancellationToken);
    }

    public void Update(Event entity)
    {
        _context.Events.Update(entity);
    }
}
