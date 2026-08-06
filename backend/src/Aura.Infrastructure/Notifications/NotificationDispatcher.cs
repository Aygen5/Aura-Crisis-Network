using Aura.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.Notifications;

public class NotificationDispatcher : INotificationDispatcher
{
    private readonly IEnumerable<INotificationChannel> _channels;
    private readonly ILogger<NotificationDispatcher> _logger;

    public NotificationDispatcher(
        IEnumerable<INotificationChannel> channels,
        ILogger<NotificationDispatcher> logger)
    {
        _channels = channels;
        _logger = logger;
    }

    public async Task DispatchAsync(
        string recipientUserId,
        string title,
        string message,
        string? payloadJson,
        CancellationToken cancellationToken = default)
    {
        foreach (var channel in _channels)
        {
            try
            {
                await channel.SendAsync(recipientUserId, title, message, payloadJson, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification via channel {ChannelType}", channel.ChannelType);
            }
        }
    }
}
