using Aura.Application.DTOs;

namespace Aura.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<(bool Succeeded, string UserId, string[] Errors)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role,
        CancellationToken cancellationToken = default);

    Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> RefreshTokenAsync(
        string accessToken,
        string refreshToken,
        CancellationToken cancellationToken = default);
}
