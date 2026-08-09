using Aura.Application.Auth.Commands.LoginUser;
using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Auth;

public class LoginUserCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock = new();
    private readonly LoginUserCommandHandler _handler;

    public LoginUserCommandHandlerTests()
    {
        _handler = new LoginUserCommandHandler(_identityServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCredentialsAreValid_ShouldReturnSuccessfulAuthResponse()
    {
        var command = new LoginUserCommand("operator@aura.gov.tr", "Operator123!");
        var authResponse = new AuthResponseDto(
            UserId: "user-op-1",
            Email: "operator@aura.gov.tr",
            FullName: "Ahmet Operator",
            AccessToken: "jwt-token-xyz",
            RefreshToken: "refresh-token-123",
            RefreshTokenExpiresAt: DateTime.UtcNow.AddHours(1),
            Roles: new[] { "Operator" }
        );

        _identityServiceMock.Setup(s => s.LoginAsync(command.Email, command.Password, It.IsAny<CancellationToken>()))
                           .ReturnsAsync((true, authResponse, Array.Empty<string>()));

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.AuthResponse.Should().NotBeNull();
        result.AuthResponse!.AccessToken.Should().Be("jwt-token-xyz");
        result.AuthResponse.Roles.Should().Contain("Operator");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_WhenCredentialsAreInvalid_ShouldReturnFailureWithErrors()
    {
        var command = new LoginUserCommand("invalid@aura.gov.tr", "wrongpass");

        _identityServiceMock.Setup(s => s.LoginAsync(command.Email, command.Password, It.IsAny<CancellationToken>()))
                           .ReturnsAsync((false, null, new[] { "Invalid email or password." }));

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.AuthResponse.Should().BeNull();
        result.Errors.Should().ContainSingle().Which.Should().Be("Invalid email or password.");
    }
}
