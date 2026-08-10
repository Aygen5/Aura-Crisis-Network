using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.Auth.Commands.RegisterUser;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FullName
) : IRequest<(bool Succeeded, string UserId, string[] Errors)>;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, (bool Succeeded, string UserId, string[] Errors)>
{
    private readonly IIdentityService _identityService;

    public RegisterUserCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<(bool Succeeded, string UserId, string[] Errors)> Handle(
        RegisterUserCommand request,
        CancellationToken cancellationToken)
    {
        return await _identityService.CreateUserAsync(
            request.Email,
            request.Password,
            request.FullName,
            "Citizen",
            cancellationToken
        );
    }
}
