using Aura.Infrastructure.Identity;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Aura.UnitTests.Infrastructure;

public class SecretConfigurationSecurityTests
{
    [Fact]
    public void JwtTokenProvider_WhenSecretKeyConfigured_ShouldGenerateAndValidateTokenSuccessfully()
    {
        var configDict = new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "SuperSecretCustomProductionKeyForTestingPurposes2026!",
            ["JwtSettings:Issuer"] = "AuraCrisisNetwork",
            ["JwtSettings:Audience"] = "AuraClients",
            ["JwtSettings:ExpiryMinutes"] = "15"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configDict)
            .Build();

        var tokenProvider = new JwtTokenProvider(configuration);

        var token = tokenProvider.GenerateAccessToken("user-123", "user@aura.gov.tr", "Test User", new[] { "Citizen" });
        token.Should().NotBeNullOrWhiteSpace();

        var principal = tokenProvider.GetPrincipalFromExpiredToken(token);
        principal.Should().NotBeNull();
        principal!.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value.Should().Be("user-123");
    }

    [Fact]
    public void JwtTokenProvider_WhenSecretKeyMissing_ShouldUseDevFallbackWithoutCrashingInDev()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var tokenProvider = new JwtTokenProvider(configuration);

        var token = tokenProvider.GenerateAccessToken("user-456", "dev@aura.gov.tr", "Dev User", new[] { "Citizen" });
        token.Should().NotBeNullOrWhiteSpace();

        var principal = tokenProvider.GetPrincipalFromExpiredToken(token);
        principal.Should().NotBeNull();
    }
}
