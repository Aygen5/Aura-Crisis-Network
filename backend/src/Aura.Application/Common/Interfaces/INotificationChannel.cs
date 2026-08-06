using Aura.Domain.Enums;

namespace Aura.Application.Common.Interfaces;

public interface INotificationChannel
{
    NotificationChannelType ChannelType { get; }
    Task SendAsync(string recipientUserId, string title, string message, string? payloadJson, CancellationToken cancellationToken = default);
}
