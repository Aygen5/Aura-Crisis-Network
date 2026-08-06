using Aura.Domain.Common;
using Aura.Domain.Enums;
using NetTopologySuite.Geometries;

namespace Aura.Domain.Entities;

public class RiskZone : BaseEntity
{
    public string Name { get; private set; }
    public string District { get; private set; }
    public RiskZoneType Type { get; private set; }
    public int Severity { get; private set; }
    public string Description { get; private set; }
    public Polygon Boundary { get; private set; }

#pragma warning disable CS8618
    private RiskZone() { }
#pragma warning restore CS8618

    public RiskZone(
        string name,
        string district,
        RiskZoneType type,
        int severity,
        string description,
        Polygon boundary)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Risk zone name cannot be empty.", nameof(name));
        if (string.IsNullOrWhiteSpace(district))
            throw new ArgumentException("District cannot be empty.", nameof(district));
        if (severity is < 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(severity), "Severity must be between 0 and 100.");
        if (boundary == null || boundary.IsEmpty)
            throw new ArgumentException("Boundary polygon cannot be null or empty.", nameof(boundary));

        Name = name;
        District = district;
        Type = type;
        Severity = severity;
        Description = description ?? string.Empty;
        Boundary = boundary;
    }

    public void UpdateBoundary(Polygon newBoundary)
    {
        if (newBoundary == null || newBoundary.IsEmpty)
            throw new ArgumentException("New boundary polygon cannot be empty.", nameof(newBoundary));

        Boundary = newBoundary;
        MarkUpdated();
    }

    public void UpdateSeverity(int newSeverity)
    {
        if (newSeverity is < 0 or > 100)
            throw new ArgumentOutOfRangeException(nameof(newSeverity), "Severity must be between 0 and 100.");

        Severity = newSeverity;
        MarkUpdated();
    }
}
