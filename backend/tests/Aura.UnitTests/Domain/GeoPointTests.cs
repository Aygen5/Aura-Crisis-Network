using Aura.Domain.ValueObjects;
using FluentAssertions;
using Xunit;

namespace Aura.UnitTests.Domain;

public class GeoPointTests
{
    [Theory]
    [InlineData(41.0082, 28.9784)]
    [InlineData(-90.0, -180.0)]
    [InlineData(90.0, 180.0)]
    [InlineData(0.0, 0.0)]
    public void Constructor_WhenCoordinatesAreValid_ShouldInitializeGeoPoint(double latitude, double longitude)
    {
        var point = new GeoPoint(latitude, longitude);

        point.Latitude.Should().Be(latitude);
        point.Longitude.Should().Be(longitude);
    }

    [Theory]
    [InlineData(-90.1, 28.9784)]
    [InlineData(90.1, 28.9784)]
    [InlineData(-100.0, 0.0)]
    [InlineData(100.0, 0.0)]
    public void Constructor_WhenLatitudeIsOutOfRange_ShouldThrowArgumentOutOfRangeException(double latitude, double longitude)
    {
        var act = () => new GeoPoint(latitude, longitude);

        act.Should().Throw<ArgumentOutOfRangeException>()
           .WithParameterName("latitude");
    }

    [Theory]
    [InlineData(41.0082, -180.1)]
    [InlineData(41.0082, 180.1)]
    [InlineData(0.0, -200.0)]
    [InlineData(0.0, 200.0)]
    public void Constructor_WhenLongitudeIsOutOfRange_ShouldThrowArgumentOutOfRangeException(double latitude, double longitude)
    {
        var act = () => new GeoPoint(latitude, longitude);

        act.Should().Throw<ArgumentOutOfRangeException>()
           .WithParameterName("longitude");
    }
}
