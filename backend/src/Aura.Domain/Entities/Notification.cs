using Aura.Domain.Common;
using Aura.Domain.Enums;

namespace Aura.Domain.Entities;

public class Notification : BaseEntity
{
    public string RecipientUserId { get; private set; }
    public string Title { get; private set; }
    public string Message { get; private set; }
    public NotificationType Type { get; private set; }
    public bool IsRead { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }
    public string? PayloadJson { get; private set; }

#pragma warning disable CS8618
    private Notification() { }
#pragma warning restore CS8618

    public Notification(
        string recipientUserId,
        string title,
        string message,
        NotificationType type,
        string? payloadJson = null)
    {
        if (string.IsNullOrWhiteSpace(recipientUserId))
            throw new ArgumentException("Recipient user ID cannot be empty.", nameof(recipientUserId));
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty.", nameof(title));
        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message cannot be empty.", nameof(message));

        RecipientUserId = recipientUserId;
        Title = title;
        Message = message;
        Type = type;
        PayloadJson = payloadJson;
        IsRead = false;
    }

    public void MarkAsRead()
    {
        if (IsRead) return;
        IsRead = true;
        ReadAt = DateTimeOffset.UtcNow;
        MarkUpdated();
    }
}
