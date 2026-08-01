using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface IOperatorRepository
{
    Task<Operator?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<Operator?> GetByBadgeNumberAsync(string badgeNumber, CancellationToken cancellationToken = default);
    Task AddAsync(Operator entity, CancellationToken cancellationToken = default);
    void Update(Operator entity);
}
