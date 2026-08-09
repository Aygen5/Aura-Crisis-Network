using Aura.Domain.Entities;
using Aura.Domain.Enums;
using FluentAssertions;
using NetTopologySuite.Geometries;
using Xunit;

namespace Aura.UnitTests.Domain;

public class EmergencyUnitTests
{
    private static readonly GeometryFactory GeoFactory = new(new PrecisionModel(), 4326);

    [Fact]
    public void Constructor_WhenParametersAreValid_ShouldInitializeAsAvailable()
    {
        var location = GeoFactory.CreatePoint(new Coordinate(28.9784, 41.0082));

        var unit = new EmergencyUnit("KURTAR-01", "34-AFAD-101", UnitType.SearchAndRescue, location);

        unit.CallSign.Should().Be("KURTAR-01");
        unit.PlateNumber.Should().Be("34-AFAD-101");
        unit.Type.Should().Be(UnitType.SearchAndRescue);
        unit.Status.Should().Be(UnitStatus.Available);
        unit.CurrentLocation.Should().Be(location);
        unit.AssignedEventId.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_WhenCallSignIsEmpty_ShouldThrowArgumentException(string? invalidCallSign)
    {
        var location = GeoFactory.CreatePoint(new Coordinate(28.9784, 41.0082));

        var act = () => new EmergencyUnit(invalidCallSign!, "34-AFAD-101", UnitType.SearchAndRescue, location);

        act.Should().Throw<ArgumentException>()
           .WithParameterName("callSign");
    }

    [Fact]
    public void DispatchToEvent_WhenUnitIsAvailable_ShouldChangeStatusToDispatchedAndAssignEventId()
    {
        var unit = CreateTestUnit();
        var eventId = Guid.NewGuid();

        unit.DispatchToEvent(eventId);

        unit.Status.Should().Be(UnitStatus.Dispatched);
        unit.AssignedEventId.Should().Be(eventId);
    }

    [Fact]
    public void DispatchToEvent_WhenUnitIsInMaintenance_ShouldThrowInvalidOperationException()
    {
        var unit = CreateTestUnit();
        unit.SetMaintenance(true);
        var eventId = Guid.NewGuid();

        var act = () => unit.DispatchToEvent(eventId);

        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*maintenance*");
    }

    [Fact]
    public void ArriveOnScene_WhenUnitIsDispatched_ShouldChangeStatusToOnScene()
    {
        var unit = CreateTestUnit();
        var eventId = Guid.NewGuid();
        unit.DispatchToEvent(eventId);

        unit.ArriveOnScene();

        unit.Status.Should().Be(UnitStatus.OnScene);
    }

    [Fact]
    public void ArriveOnScene_WhenUnitIsNotDispatched_ShouldThrowInvalidOperationException()
    {
        var unit = CreateTestUnit();

        var act = () => unit.ArriveOnScene();

        act.Should().Throw<InvalidOperationException>()
           .WithMessage("*dispatched*");
    }

    [Fact]
    public void CompleteMission_ShouldResetStatusToAvailableAndClearAssignedEvent()
    {
        var unit = CreateTestUnit();
        unit.DispatchToEvent(Guid.NewGuid());
        unit.ArriveOnScene();

        unit.CompleteMission();

        unit.Status.Should().Be(UnitStatus.Available);
        unit.AssignedEventId.Should().BeNull();
    }

    [Fact]
    public void SetMaintenance_True_ShouldChangeStatusToMaintenanceAndClearAssignedEvent()
    {
        var unit = CreateTestUnit();
        unit.DispatchToEvent(Guid.NewGuid());

        unit.SetMaintenance(true);

        unit.Status.Should().Be(UnitStatus.Maintenance);
        unit.AssignedEventId.Should().BeNull();
    }

    [Fact]
    public void UpdateGpsLocation_WhenCoordinatesAreValid_ShouldUpdatePointSpeedAndHeading()
    {
        var unit = CreateTestUnit();

        unit.UpdateGpsLocation(41.015, 28.985, 45.5, 180.0);

        unit.CurrentLocation.Y.Should().Be(41.015);
        unit.CurrentLocation.X.Should().Be(28.985);
        unit.SpeedKmh.Should().Be(45.5);
        unit.HeadingDegrees.Should().Be(180.0);
    }

    [Theory]
    [InlineData(-91.0, 28.0)]
    [InlineData(91.0, 28.0)]
    public void UpdateGpsLocation_WhenLatitudeIsInvalid_ShouldThrowArgumentOutOfRangeException(double lat, double lng)
    {
        var unit = CreateTestUnit();

        var act = () => unit.UpdateGpsLocation(lat, lng, 30.0, 90.0);

        act.Should().Throw<ArgumentOutOfRangeException>()
           .WithParameterName("latitude");
    }

    private static EmergencyUnit CreateTestUnit()
    {
        var location = GeoFactory.CreatePoint(new Coordinate(28.9784, 41.0082));
        return new EmergencyUnit("AMBULANS-05", "34-UMKE-05", UnitType.Ambulance, location);
    }
}
