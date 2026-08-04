using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Auth.Commands.LoginUser;

public record LoginUserCommand(
    string Email,
    string Password
) : IRequest<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)>;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, (bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)>
{
    private readonly IIdentityService _identityService;

    public LoginUserCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        return await _identityService.LoginAsync(
            request.Email,
            request.Password,
            cancellationToken
        );
    }
}
