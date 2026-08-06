namespace Aura.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; private set; }
    public Guid? UserId { get; private set; }
    public string? UserEmail { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public string? CorrelationId { get; private set; }
    public string? RequestId { get; private set; }
    public string EntityName { get; private set; }
    public string Action { get; private set; }
    public string EntityId { get; private set; }
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string? ChangedColumns { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }

#pragma warning disable CS8618
    private AuditLog() { }
#pragma warning restore CS8618

    public AuditLog(
        Guid? userId,
        string? userEmail,
        string? ipAddress,
        string? userAgent,
        string? correlationId,
        string? requestId,
        string entityName,
        string action,
        string entityId,
        string? oldValues,
        string? newValues,
        string? changedColumns)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        UserEmail = userEmail;
        IpAddress = ipAddress;
        UserAgent = userAgent;
        CorrelationId = correlationId;
        RequestId = requestId;
        EntityName = entityName ?? throw new ArgumentNullException(nameof(entityName));
        Action = action ?? throw new ArgumentNullException(nameof(action));
        EntityId = entityId ?? throw new ArgumentNullException(nameof(entityId));
        OldValues = oldValues;
        NewValues = newValues;
        ChangedColumns = changedColumns;
        CreatedAt = DateTimeOffset.UtcNow;
    }
}
