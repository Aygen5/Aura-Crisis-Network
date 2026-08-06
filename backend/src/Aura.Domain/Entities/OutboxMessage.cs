using Aura.Domain.Common;

namespace Aura.Domain.Entities;

public class OutboxMessage : BaseEntity
{
    public string Type { get; private set; }
    public string PayloadJson { get; private set; }
    public DateTimeOffset? ProcessedAt { get; private set; }
    public string? Error { get; private set; }
    public int RetryCount { get; private set; }

#pragma warning disable CS8618
    private OutboxMessage() { }
#pragma warning restore CS8618

    public OutboxMessage(string type, string payloadJson)
    {
        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Outbox message type cannot be empty.", nameof(type));
        if (string.IsNullOrWhiteSpace(payloadJson))
            throw new ArgumentException("Outbox payload cannot be empty.", nameof(payloadJson));

        Type = type;
        PayloadJson = payloadJson;
        RetryCount = 0;
    }

    public void MarkProcessed()
    {
        ProcessedAt = DateTimeOffset.UtcNow;
        Error = null;
        MarkUpdated();
    }

    public void MarkFailed(string error)
    {
        Error = error;
        RetryCount++;
        MarkUpdated();
    }
}
