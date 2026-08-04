namespace Aura.Application.DTOs;

public record AuthResponseDto(
    string UserId,
    string Email,
    string FullName,
    string AccessToken,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    IReadOnlyList<string> Roles
);
