using Aura.Application.Common.Interfaces;
using Aura.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Aura.Infrastructure.Notifications.Channels;

public class SignalRNotificationChannel : INotificationChannel
{
    private readonly ICrisisNotificationService _crisisNotificationService;
    private readonly ILogger<SignalRNotificationChannel> _logger;

    public NotificationChannelType ChannelType => NotificationChannelType.SignalR;

    public SignalRNotificationChannel(
        ICrisisNotificationService crisisNotificationService,
        ILogger<SignalRNotificationChannel> logger)
    {
        _crisisNotificationService = crisisNotificationService;
        _logger = logger;
    }

    public async Task SendAsync(
        string recipientUserId,
        string title,
        string message,
        string? payloadJson,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Broadcasting SignalR notification to user {UserId}: {Title}", recipientUserId, title);
        await Task.CompletedTask;
    }
}
