using System.Net;
using System.Net.Http.Json;
using Aura.Application.EmergencyUnits.DTOs;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using NetTopologySuite.Geometries;
using Xunit;

namespace Aura.IntegrationTests.Geospatial;

[Collection("IntegrationTests")]
public class PostGisGeospatialIntegrationTests
{
    private static readonly GeometryFactory GeoFactory = new(new PrecisionModel(), 4326);
    private readonly AuraWebApplicationFactory _factory;

    public PostGisGeospatialIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetNearestEmergencyUnits_ShouldCalculateDistancesUsingPostGisAndOrderNearestFirst()
    {
        var client = _factory.CreateClient();

        double targetLat = 41.0082;
        double targetLng = 28.9784;

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<AuraDbContext>();

            var closeUnit = new EmergencyUnit("YAKIN-EKIP", "34-YKN-01", UnitType.Ambulance, GeoFactory.CreatePoint(new Coordinate(28.9800, 41.0100)));
            var farUnit = new EmergencyUnit("UZAK-EKIP", "34-UZK-99", UnitType.Ambulance, GeoFactory.CreatePoint(new Coordinate(29.1500, 41.1000)));

            dbContext.EmergencyUnits.Add(closeUnit);
            dbContext.EmergencyUnits.Add(farUnit);
            await dbContext.SaveChangesAsync();
        }

        var url = $"/api/v1/emergency-units/nearest?latitude={targetLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}&longitude={targetLng.ToString(System.Globalization.CultureInfo.InvariantCulture)}&count=50";
        var response = await client.GetAsync(url);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var units = await response.Content.ReadFromJsonAsync<List<EmergencyUnitDto>>(AuraWebApplicationFactory.JsonOptions);
        units.Should().NotBeNull();
        units!.Should().NotBeEmpty();

        var closeIndex = units!.FindIndex(u => u.CallSign == "YAKIN-EKIP");
        closeIndex.Should().BeGreaterThanOrEqualTo(0);

        var farIndex = units.FindIndex(u => u.CallSign == "UZAK-EKIP");
        if (farIndex >= 0)
        {
            closeIndex.Should().BeLessThan(farIndex);
        }
    }
}
