namespace Aura.Application.Common.Interfaces;

public interface INotificationDispatcher
{
    Task DispatchAsync(string recipientUserId, string title, string message, string? payloadJson, CancellationToken cancellationToken = default);
}
