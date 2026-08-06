using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence.Repositories;

public class RiskZoneRepository : IRiskZoneRepository
{
    private readonly AuraDbContext _dbContext;
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public RiskZoneRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(RiskZone zone, CancellationToken cancellationToken = default)
    {
        await _dbContext.RiskZones.AddAsync(zone, cancellationToken);
    }

    public async Task<RiskZone?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.RiskZones
            .FirstOrDefaultAsync(z => z.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<RiskZone>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.RiskZones
            .OrderByDescending(z => z.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RiskZone>> GetIntersectingZonesAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        var point = GeometryFactory.CreatePoint(new Coordinate(longitude, latitude));

        return await _dbContext.RiskZones
            .Where(z => z.Boundary.Intersects(point) || z.Boundary.Contains(point))
            .OrderByDescending(z => z.Severity)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RiskZone>> GetZonesWithinBufferAsync(
        double latitude,
        double longitude,
        double radiusMeters,
        CancellationToken cancellationToken = default)
    {
        var point = GeometryFactory.CreatePoint(new Coordinate(longitude, latitude));

        return await _dbContext.RiskZones
            .Where(z => EF.Functions.IsWithinDistance(z.Boundary, point, radiusMeters, true))
            .OrderByDescending(z => z.Severity)
            .ToListAsync(cancellationToken);
    }
}
