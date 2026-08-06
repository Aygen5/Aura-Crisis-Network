using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly AuraDbContext _dbContext;

    public NotificationRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task AddAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        await _dbContext.Notifications.AddAsync(notification, cancellationToken);
    }

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Notifications
            .FirstOrDefaultAsync(n => n.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Notification>> GetUserNotificationsAsync(string recipientUserId, int limit = 20, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Notifications
            .Where(n => n.RecipientUserId == recipientUserId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(string recipientUserId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Notifications
            .Where(n => n.RecipientUserId == recipientUserId && !n.IsRead)
            .CountAsync(cancellationToken);
    }
}
