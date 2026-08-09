using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Aura.UnitTests.Domain;

public class EventTests
{
    [Fact]
    public void Constructor_WhenParametersAreValid_ShouldInitializeActiveEvent()
    {
        var location = new GeoPoint(40.9901, 29.0291);
        var detectedAt = DateTimeOffset.UtcNow;

        var ev = new Event(
            title: "Marmara Depremi",
            type: DisasterType.Earthquake,
            severity: 75,
            location: location,
            locationName: "Kadikoy Sahil",
            district: "Kadikoy",
            source: "Kandilli",
            metric: "5.4",
            metricLabel: "Büyüklük",
            summary: "Şiddetli sarsıntı",
            detectedAt: detectedAt
        );

        ev.Title.Should().Be("Marmara Depremi");
        ev.Type.Should().Be(DisasterType.Earthquake);
        ev.Severity.Should().Be(75);
        ev.Location.Should().Be(location);
        ev.LocationName.Should().Be("Kadikoy Sahil");
        ev.District.Should().Be("Kadikoy");
        ev.Source.Should().Be("Kandilli");
        ev.Metric.Should().Be("5.4");
        ev.MetricLabel.Should().Be("Büyüklük");
        ev.Summary.Should().Be("Şiddetli sarsıntı");
        ev.Status.Should().Be(EventStatus.Active);
        ev.EscalatedAt.Should().BeNull();
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(101)]
    [InlineData(150)]
    public void Constructor_WhenSeverityIsOutOfRange_ShouldThrowArgumentOutOfRangeException(int invalidSeverity)
    {
        var location = new GeoPoint(40.9901, 29.0291);

        var act = () => new Event(
            title: "Test Event",
            type: DisasterType.Wildfire,
            severity: invalidSeverity,
            location: location,
            locationName: "Test",
            district: "Kadikoy",
            source: "Test",
            metric: "1",
            metricLabel: "Level",
            summary: "Test",
            detectedAt: DateTimeOffset.UtcNow
        );

        act.Should().Throw<ArgumentOutOfRangeException>()
           .WithParameterName("severity");
    }

    [Fact]
    public void Escalate_ShouldIncreaseSeverityBy15AndSetEscalatedAt()
    {
        var ev = CreateTestEvent(severity: 70);

        ev.Escalate();

        ev.Severity.Should().Be(85);
        ev.EscalatedAt.Should().NotBeNull();
        ev.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Escalate_WhenSeverityIsAlreadyNear100_ShouldCapSeverityAt100()
    {
        var ev = CreateTestEvent(severity: 95);

        ev.Escalate();

        ev.Severity.Should().Be(100);
        ev.EscalatedAt.Should().NotBeNull();
    }

    [Fact]
    public void Resolve_ShouldUpdateStatusToResolved()
    {
        var ev = CreateTestEvent(severity: 50);

        ev.Resolve();

        ev.Status.Should().Be(EventStatus.Resolved);
        ev.UpdatedAt.Should().NotBeNull();
    }

    private static Event CreateTestEvent(int severity)
    {
        return new Event(
            title: "Orman Yangını",
            type: DisasterType.Wildfire,
            severity: severity,
            location: new GeoPoint(41.1, 29.1),
            locationName: "Sarıyer Ormanı",
            district: "Sariyer",
            source: "Meteoroloji",
            metric: "Yüksek",
            metricLabel: "Risk",
            summary: "Yangın riski",
            detectedAt: DateTimeOffset.UtcNow
        );
    }
}
