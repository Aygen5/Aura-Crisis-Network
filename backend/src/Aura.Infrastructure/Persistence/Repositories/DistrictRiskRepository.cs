using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class DistrictRiskRepository : IDistrictRiskRepository
{
    private readonly AuraDbContext _context;

    public DistrictRiskRepository(AuraDbContext context)
    {
        _context = context;
    }

    public async Task<DistrictRisk?> GetByDistrictNameAsync(string districtName, CancellationToken cancellationToken = default)
    {
        var local = _context.DistrictRisks.Local
            .FirstOrDefault(d => string.Equals(d.DistrictName, districtName, StringComparison.OrdinalIgnoreCase));
        if (local != null) return local;

        return await _context.DistrictRisks
            .FirstOrDefaultAsync(d => d.DistrictName.ToLower() == districtName.ToLower(), cancellationToken);
    }

    public async Task<IReadOnlyList<DistrictRisk>> GetAllDistrictRisksAsync(CancellationToken cancellationToken = default)
    {
        return await _context.DistrictRisks
            .OrderBy(d => d.DistrictName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(DistrictRisk entity, CancellationToken cancellationToken = default)
    {
        await _context.DistrictRisks.AddAsync(entity, cancellationToken);
    }

    public void Update(DistrictRisk entity)
    {
        _context.DistrictRisks.Update(entity);
    }
}
