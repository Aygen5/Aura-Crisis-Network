using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class OperatorRepository : IOperatorRepository
{
    private readonly AuraDbContext _context;

    public OperatorRepository(AuraDbContext context)
    {
        _context = context;
    }

    public async Task<Operator?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Operators
            .FirstOrDefaultAsync(o => o.Email.ToLower() == email.ToLower(), cancellationToken);
    }

    public async Task<Operator?> GetByBadgeNumberAsync(string badgeNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Operators
            .FirstOrDefaultAsync(o => o.BadgeNumber == badgeNumber, cancellationToken);
    }

    public async Task AddAsync(Operator entity, CancellationToken cancellationToken = default)
    {
        await _context.Operators.AddAsync(entity, cancellationToken);
    }

    public void Update(Operator entity)
    {
        _context.Operators.Update(entity);
    }
}
