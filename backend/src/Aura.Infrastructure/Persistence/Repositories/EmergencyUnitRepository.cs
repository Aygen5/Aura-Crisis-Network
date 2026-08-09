using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence.Repositories;

public class EmergencyUnitRepository : IEmergencyUnitRepository
{
    private readonly AuraDbContext _dbContext;
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public EmergencyUnitRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(EmergencyUnit unit, CancellationToken cancellationToken = default)
    {
        await _dbContext.EmergencyUnits.AddAsync(unit, cancellationToken);
    }

    public async Task<EmergencyUnit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.EmergencyUnits
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<EmergencyUnit>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.EmergencyUnits
            .OrderBy(u => u.CallSign)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EmergencyUnit>> GetNearestUnitsAsync(
        double latitude,
        double longitude,
        int count = 50,
        UnitType? typeFilter = null,
        CancellationToken cancellationToken = default)
    {
        var targetPoint = GeometryFactory.CreatePoint(new Coordinate(longitude, latitude));

        var query = _dbContext.EmergencyUnits
            .Where(u => u.Status == UnitStatus.Available);

        if (typeFilter.HasValue)
        {
            query = query.Where(u => u.Type == typeFilter.Value);
        }

        var units = await query.ToListAsync(cancellationToken);

        return units
            .OrderBy(u => u.CurrentLocation != null ? u.CurrentLocation.Distance(targetPoint) : double.MaxValue)
            .Take(count)
            .ToList();
    }

    public Task UpdateAsync(EmergencyUnit unit, CancellationToken cancellationToken = default)
    {
        _dbContext.EmergencyUnits.Update(unit);
        return Task.CompletedTask;
    }
}
