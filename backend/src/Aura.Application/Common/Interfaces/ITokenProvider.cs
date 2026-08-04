using System.Security.Claims;

namespace Aura.Application.Common.Interfaces;

public interface ITokenProvider
{
    string GenerateAccessToken(string userId, string email, string fullName, IEnumerable<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}
