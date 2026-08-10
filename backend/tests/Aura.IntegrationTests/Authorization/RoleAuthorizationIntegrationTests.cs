using System.Net;
using System.Net.Http.Json;
using Aura.Application.EmergencyUnits.DTOs;
using Aura.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Aura.IntegrationTests.Authorization;

[Collection("IntegrationTests")]
public class RoleAuthorizationIntegrationTests
{
    private readonly AuraWebApplicationFactory _factory;

    public RoleAuthorizationIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task OperatorEndpoint_WhenCalledByCitizen_ShouldReturn403Forbidden()
    {
        var citizenClient = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");
        var reportId = Guid.NewGuid();

        var response = await citizenClient.PatchAsync($"/api/v1/reports/{reportId}/status?status=Verified", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task DispatchEndpoint_WhenCalledByCitizen_ShouldReturn403Forbidden()
    {
        var citizenClient = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");
        var unitId = Guid.NewGuid();
        var eventId = Guid.NewGuid();

        var response = await citizenClient.PostAsync($"/api/v1/emergency-units/{unitId}/dispatch?eventId={eventId}", null);

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task OperatorEndpoint_WhenCalledByUnauthenticatedUser_ShouldReturn401Unauthorized()
    {
        var anonymousClient = _factory.CreateClient();
        var reportId = Guid.NewGuid();

        var response = await anonymousClient.PatchAsync($"/api/v1/reports/{reportId}/status?status=Verified", null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateLocationEndpoint_WhenCalledByUnauthenticatedUser_ShouldReturn401Unauthorized()
    {
        var anonymousClient = _factory.CreateClient();
        var unitId = Guid.NewGuid();

        var response = await anonymousClient.PostAsJsonAsync($"/api/v1/emergency-units/{unitId}/location", new { latitude = 41.01, longitude = 28.97, speedKmh = 50.0, headingDegrees = 180.0 });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateLocationEndpoint_WhenCalledByCitizen_ShouldReturn403Forbidden()
    {
        var citizenClient = await _factory.CreateAuthenticatedClientAsync("citizen.test@aura.gov.tr", "Citizen123!");
        var unitId = Guid.NewGuid();

        var response = await citizenClient.PostAsJsonAsync($"/api/v1/emergency-units/{unitId}/location", new { latitude = 41.01, longitude = 28.97, speedKmh = 50.0, headingDegrees = 180.0 });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task UpdateLocationEndpoint_WhenCalledByOperatorForExistingUnit_ShouldReturn200OkAndUpdatedDto()
    {
        var operatorClient = await _factory.CreateAuthenticatedClientAsync("operator.test@aura.gov.tr", "Operator123!");
        Guid unitId;

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext = scope.ServiceProvider.GetRequiredService<Aura.Infrastructure.Persistence.AuraDbContext>();
            var geoFactory = new NetTopologySuite.Geometries.GeometryFactory(new NetTopologySuite.Geometries.PrecisionModel(), 4326);
            var unit = new Aura.Domain.Entities.EmergencyUnit("AUTH-TEST-UNIT", "34-AUTH-99", Aura.Domain.Enums.UnitType.Ambulance, geoFactory.CreatePoint(new NetTopologySuite.Geometries.Coordinate(28.97, 41.00)));
            dbContext.EmergencyUnits.Add(unit);
            await dbContext.SaveChangesAsync();
            unitId = unit.Id;
        }

        var response = await operatorClient.PostAsJsonAsync($"/api/v1/emergency-units/{unitId}/location", new { latitude = 41.02, longitude = 28.98, speedKmh = 60.0, headingDegrees = 90.0 });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var dto = await response.Content.ReadFromJsonAsync<EmergencyUnitDto>(AuraWebApplicationFactory.JsonOptions);
        dto.Should().NotBeNull();
        dto!.Latitude.Should().Be(41.02);
        dto.Longitude.Should().Be(28.98);
        dto.SpeedKmh.Should().Be(60.0);
    }
}
