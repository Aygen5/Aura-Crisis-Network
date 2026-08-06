using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface INotificationRepository
{
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Notification>> GetUserNotificationsAsync(string recipientUserId, int limit = 20, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(string recipientUserId, CancellationToken cancellationToken = default);
}
