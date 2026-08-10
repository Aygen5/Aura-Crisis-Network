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

    [Fact]
    public async Task Register_PublicRegistration_ShouldAssignCitizenRole()
    {
        var client = _factory.CreateClient();
        var email = $"citizen.new.{Guid.NewGuid():N}@aura.gov.tr";
        var registerRequest = new { Email = email, Password = "Password123!", FullName = "New Citizen User" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = email, Password = "Password123!" });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var authData = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        authData.Should().NotBeNull();
        authData!.Roles.Should().ContainSingle().Which.Should().Be("Citizen");
        authData.Roles.Should().NotContain("Admin");
        authData.Roles.Should().NotContain("Operator");
    }

    [Fact]
    public async Task Register_WithAdminRoleInPayload_ShouldIgnoreAdminRoleAndAssignCitizenRole()
    {
        var client = _factory.CreateClient();
        var email = $"attacker.admin.{Guid.NewGuid():N}@aura.gov.tr";
        var attackPayload = new { Email = email, Password = "Password123!", FullName = "Attacker Admin Attempt", Role = "Admin" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", attackPayload);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = email, Password = "Password123!" });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var authData = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        authData.Should().NotBeNull();
        authData!.Roles.Should().NotContain("Admin");
        authData.Roles.Should().NotContain("Operator");
        authData.Roles.Should().Contain("Citizen");
    }

    [Fact]
    public async Task Register_WithOperatorRoleInPayload_ShouldIgnoreOperatorRoleAndAssignCitizenRole()
    {
        var client = _factory.CreateClient();
        var email = $"attacker.op.{Guid.NewGuid():N}@aura.gov.tr";
        var attackPayload = new { Email = email, Password = "Password123!", FullName = "Attacker Operator Attempt", Role = "Operator" };

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", attackPayload);
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new { Email = email, Password = "Password123!" });
        loginResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var authData = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
        authData.Should().NotBeNull();
        authData!.Roles.Should().NotContain("Operator");
        authData.Roles.Should().NotContain("Admin");
        authData.Roles.Should().Contain("Citizen");
    }
}
