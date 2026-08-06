using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class OutboxRepository : IOutboxRepository
{
    private readonly AuraDbContext _dbContext;

    public OutboxRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(OutboxMessage message, CancellationToken cancellationToken = default)
    {
        await _dbContext.OutboxMessages.AddAsync(message, cancellationToken);
    }

    public async Task<IReadOnlyList<OutboxMessage>> GetPendingMessagesAsync(int batchSize = 20, CancellationToken cancellationToken = default)
    {
        return await _dbContext.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount < 5)
            .OrderBy(m => m.CreatedAt)
            .Take(batchSize)
            .ToListAsync(cancellationToken);
    }
}
