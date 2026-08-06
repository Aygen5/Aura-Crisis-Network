using Aura.Domain.Common;
using Aura.Domain.Enums;
using NetTopologySuite.Geometries;

namespace Aura.Domain.Entities;

public class EmergencyUnit : BaseEntity
{
    public string CallSign { get; private set; }
    public string PlateNumber { get; private set; }
    public UnitType Type { get; private set; }
    public UnitStatus Status { get; private set; }
    public Point CurrentLocation { get; private set; }
    public double SpeedKmh { get; private set; }
    public double HeadingDegrees { get; private set; }
    public Guid? AssignedEventId { get; private set; }
    public DateTimeOffset LastGpsUpdateAt { get; private set; }

#pragma warning disable CS8618
    private EmergencyUnit() { }
#pragma warning restore CS8618

    public EmergencyUnit(
        string callSign,
        string plateNumber,
        UnitType type,
        Point initialLocation)
    {
        if (string.IsNullOrWhiteSpace(callSign))
            throw new ArgumentException("Call sign cannot be empty.", nameof(callSign));
        if (string.IsNullOrWhiteSpace(plateNumber))
            throw new ArgumentException("Plate number cannot be empty.", nameof(plateNumber));
        if (initialLocation == null || initialLocation.IsEmpty)
            throw new ArgumentException("Initial location point cannot be empty.", nameof(initialLocation));

        CallSign = callSign;
        PlateNumber = plateNumber;
        Type = type;
        Status = UnitStatus.Available;
        CurrentLocation = initialLocation;
        SpeedKmh = 0.0;
        HeadingDegrees = 0.0;
        AssignedEventId = null;
        LastGpsUpdateAt = DateTimeOffset.UtcNow;
    }

    public void UpdateGpsLocation(double latitude, double longitude, double speedKmh, double headingDegrees)
    {
        if (latitude is < -90.0 or > 90.0)
            throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude must be between -90 and 90.");
        if (longitude is < -180.0 or > 180.0)
            throw new ArgumentOutOfRangeException(nameof(longitude), "Longitude must be between -180 and 180.");

        CurrentLocation = new Point(longitude, latitude) { SRID = 4326 };
        SpeedKmh = Math.Max(0.0, speedKmh);
        HeadingDegrees = (headingDegrees % 360.0 + 360.0) % 360.0;
        LastGpsUpdateAt = DateTimeOffset.UtcNow;
        MarkUpdated();
    }

    public void DispatchToEvent(Guid eventId)
    {
        if (Status == UnitStatus.Maintenance)
            throw new InvalidOperationException("Units in maintenance cannot be dispatched.");

        Status = UnitStatus.Dispatched;
        AssignedEventId = eventId;
        MarkUpdated();
    }

    public void ArriveOnScene()
    {
        if (Status != UnitStatus.Dispatched)
            throw new InvalidOperationException("Only dispatched units can mark arrival on scene.");

        Status = UnitStatus.OnScene;
        MarkUpdated();
    }

    public void CompleteMission()
    {
        Status = UnitStatus.Available;
        AssignedEventId = null;
        MarkUpdated();
    }

    public void SetMaintenance(bool isMaintenance)
    {
        Status = isMaintenance ? UnitStatus.Maintenance : UnitStatus.Available;
        if (isMaintenance) AssignedEventId = null;
        MarkUpdated();
    }
}
