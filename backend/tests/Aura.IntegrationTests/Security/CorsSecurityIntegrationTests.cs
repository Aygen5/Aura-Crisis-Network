using System.Net;
using FluentAssertions;
using Xunit;

namespace Aura.IntegrationTests.Security;

[Collection("IntegrationTests")]
public class CorsSecurityIntegrationTests
{
    private readonly AuraWebApplicationFactory _factory;

    public CorsSecurityIntegrationTests(AuraWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_WhenOriginIsAllowedLocalhost_ShouldIncludeAccessControlAllowOriginHeader()
    {
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("Origin", "http://localhost:5173");

        var response = await client.SendAsync(request);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Contains("Access-Control-Allow-Origin").Should().BeTrue();
        response.Headers.GetValues("Access-Control-Allow-Origin").Should().Contain("http://localhost:5173");
        response.Headers.GetValues("Access-Control-Allow-Credentials").Should().Contain("true");
    }

    [Fact]
    public async Task Get_WhenOriginIsUntrustedMaliciousSite_ShouldNotAllowUntrustedOriginInHeader()
    {
        var client = _factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/health");
        request.Headers.Add("Origin", "https://evil-hacker.com");

        var response = await client.SendAsync(request);

        if (response.Headers.Contains("Access-Control-Allow-Origin"))
        {
            var allowedOrigins = response.Headers.GetValues("Access-Control-Allow-Origin");
            allowedOrigins.Should().NotContain("https://evil-hacker.com");
            allowedOrigins.Should().NotContain("*");
        }
    }
}
