using System.Net;
using System.Net.Http.Json;
using Aura.Domain.Enums;
using FluentAssertions;
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
}
