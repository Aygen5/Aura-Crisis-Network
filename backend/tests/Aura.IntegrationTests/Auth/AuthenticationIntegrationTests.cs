using System.Net;
using System.Net.Http.Json;
using Aura.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Aura.IntegrationTests.Auth;

[Collection("IntegrationTests")]
public class AuthenticationIntegrationTests
{
    private readonly AuraWebApplicationFactory _factory;

    public AuthenticationIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Login_WithValidOperatorCredentials_ShouldReturnOkAndJwtToken()
    {
        var client = _factory.CreateClient();
        var request = new { Email = "operator.test@aura.gov.tr", Password = "Operator123!" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrWhiteSpace();
        body.Roles.Should().Contain("Operator");
        body.Email.Should().Be("operator.test@aura.gov.tr");
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ShouldReturnUnauthorizedOrBadRequest()
    {
        var client = _factory.CreateClient();
        var request = new { Email = "operator.test@aura.gov.tr", Password = "WrongPassword999!" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithNonExistentEmail_ShouldReturnUnauthorizedOrBadRequest()
    {
        var client = _factory.CreateClient();
        var request = new { Email = "nonexistent.user@aura.gov.tr", Password = "Password123!" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", request);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Unauthorized, HttpStatusCode.BadRequest);
    }
}
