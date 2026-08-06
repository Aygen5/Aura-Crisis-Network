using Aura.Domain.Common;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;

namespace Aura.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; private set; }
    public DisasterType Type { get; private set; }
    public int Severity { get; private set; }
    public GeoPoint Location { get; private set; }
    public string LocationName { get; private set; }
    public string District { get; private set; }
    public EventStatus Status { get; private set; }
    public string Source { get; private set; }
    public string Metric { get; private set; }
    public string MetricLabel { get; private set; }
    public string Summary { get; private set; }
    public DateTimeOffset DetectedAt { get; private set; }
    public DateTimeOffset? EscalatedAt { get; private set; }

#pragma warning disable CS8618
    private Event() { }
#pragma warning restore CS8618

    public Event(
        string title,
        DisasterType type,
        int severity,
        GeoPoint location,
        string locationName,
        string district,
        string source,
        string metric,
        string metricLabel,
        string summary,
        DateTimeOffset detectedAt)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title cannot be empty.", nameof(title));
        if (severity is < 0 or > 100) throw new ArgumentOutOfRangeException(nameof(severity), "Severity must be between 0 and 100.");
        if (string.IsNullOrWhiteSpace(district)) throw new ArgumentException("District cannot be empty.", nameof(district));

        Title = title;
        Type = type;
        Severity = severity;
        Location = location;
        LocationName = locationName ?? string.Empty;
        District = district;
        Source = source ?? "Unknown";
        Metric = metric ?? string.Empty;
        MetricLabel = metricLabel ?? string.Empty;
        Summary = summary ?? string.Empty;
        DetectedAt = detectedAt.ToUniversalTime();
        Status = EventStatus.Active;
    }

    public void Escalate()
    {
        EscalatedAt = DateTimeOffset.UtcNow;
        Severity = Math.Min(100, Severity + 15);
        MarkUpdated();
    }

    public void UpdateStatus(EventStatus newStatus)
    {
        if (Status == newStatus) return;
        Status = newStatus;
        MarkUpdated();
    }

    public void Resolve()
    {
        UpdateStatus(EventStatus.Resolved);
    }
}
