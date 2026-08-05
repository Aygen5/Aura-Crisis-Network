using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class CitizenReportRepository : ICitizenReportRepository
{
    private readonly AuraDbContext _context;

    public CitizenReportRepository(AuraDbContext context)
    {
        _context = context;
    }

    public async Task<CitizenReport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.CitizenReports
            .Include(r => r.Attachments)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<CitizenReport>> GetReportsByStatusAsync(ReportStatus status, CancellationToken cancellationToken = default)
    {
        return await _context.CitizenReports
            .Include(r => r.Attachments)
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CitizenReport>> GetNearbyReportsAsync(GeoPoint location, double radiusInMeters, CancellationToken cancellationToken = default)
    {
        return await _context.CitizenReports
            .Include(r => r.Attachments)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(CitizenReport entity, CancellationToken cancellationToken = default)
    {
        await _context.CitizenReports.AddAsync(entity, cancellationToken);
    }

    public void Update(CitizenReport entity)
    {
        _context.CitizenReports.Update(entity);
    }
}
