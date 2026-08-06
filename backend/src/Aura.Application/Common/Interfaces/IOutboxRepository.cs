using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IOutboxRepository
{
    Task AddAsync(OutboxMessage message, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OutboxMessage>> GetPendingMessagesAsync(int batchSize = 20, CancellationToken cancellationToken = default);
}
