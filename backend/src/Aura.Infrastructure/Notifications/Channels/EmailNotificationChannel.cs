using Aura.Application.Common.Interfaces;
using Aura.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.Notifications.Channels;

public class EmailNotificationChannel : INotificationChannel
{
    private readonly ILogger<EmailNotificationChannel> _logger;

    public NotificationChannelType ChannelType => NotificationChannelType.Email;

    public EmailNotificationChannel(ILogger<EmailNotificationChannel> logger)
    {
        _logger = logger;
    }

    public async Task SendAsync(
        string recipientUserId,
        string title,
        string message,
        string? payloadJson,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Dispatching Email notification to user {UserId}: {Title}", recipientUserId, title);
        await Task.CompletedTask;
    }
}
