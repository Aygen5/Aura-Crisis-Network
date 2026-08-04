using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(
    string AccessToken,
    string RefreshToken
) : IRequest<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, (bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)>
{
    private readonly IIdentityService _identityService;

    public RefreshTokenCommandHandler(IIdentityService identityService)
    {
        _identityService = identityService;
    }

    public async Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        return await _identityService.RefreshTokenAsync(
            request.AccessToken,
            request.RefreshToken,
            cancellationToken
        );
    }
}
