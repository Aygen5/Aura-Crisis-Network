using Aura.Application.Auth.Commands.RegisterUser;
using Aura.Application.Common.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Aura.UnitTests.Application.Auth;

public class RegisterUserCommandHandlerTests
{
    private readonly Mock<IIdentityService> _identityServiceMock = new();
    private readonly RegisterUserCommandHandler _handler;

    public RegisterUserCommandHandlerTests()
    {
        _handler = new RegisterUserCommandHandler(_identityServiceMock.Object);
    }

    [Fact]
    public async Task Handle_WhenRegisterCommandExecuted_ShouldAlwaysPassCitizenRoleToIdentityService()
    {
        var command = new RegisterUserCommand("newuser@aura.gov.tr", "Password123!", "New Citizen User");

        _identityServiceMock
            .Setup(s => s.CreateUserAsync(command.Email, command.Password, command.FullName, "Citizen", It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, "user-id-123", Array.Empty<string>()));

        var result = await _handler.Handle(command, CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.UserId.Should().Be("user-id-123");
        result.Errors.Should().BeEmpty();

        _identityServiceMock.Verify(
            s => s.CreateUserAsync(command.Email, command.Password, command.FullName, "Citizen", It.IsAny<CancellationToken>()),
            Times.Once
        );
    }
}
