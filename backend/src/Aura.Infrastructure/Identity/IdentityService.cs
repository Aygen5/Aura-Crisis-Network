using System.Security.Claims;
using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using Aura.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly ITokenProvider _tokenProvider;
    private readonly AuraDbContext _dbContext;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ITokenProvider tokenProvider,
        AuraDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _tokenProvider = tokenProvider;
        _dbContext = dbContext;
    }

    public async Task<(bool Succeeded, string UserId, string[] Errors)> CreateUserAsync(
        string email,
        string password,
        string fullName,
        string role,
        CancellationToken cancellationToken = default)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return (false, string.Empty, new[] { "User with this email already exists." });
        }

        if (!await _roleManager.RoleExistsAsync(role))
        {
            await _roleManager.CreateAsync(new ApplicationRole(role));
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            FullName = fullName
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return (false, string.Empty, result.Errors.Select(e => e.Description).ToArray());
        }

        await _userManager.AddToRoleAsync(user, role);

        return (true, user.Id.ToString(), Array.Empty<string>());
    }

    public async Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return (false, null, new[] { "Invalid email or password." });
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, password);
        if (!isPasswordValid)
        {
            return (false, null, new[] { "Invalid email or password." });
        }

        var roles = await _userManager.GetRolesAsync(user);

        var accessToken = _tokenProvider.GenerateAccessToken(user.Id.ToString(), user.Email!, user.FullName, roles);
        var refreshTokenValue = _tokenProvider.GenerateRefreshToken();
        var refreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        var refreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = refreshTokenExpiry
        };

        _dbContext.RefreshTokens.Add(refreshTokenEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var authResponse = new AuthResponseDto(
            user.Id.ToString(),
            user.Email!,
            user.FullName,
            accessToken,
            refreshTokenValue,
            refreshTokenExpiry,
            roles.ToList()
        );

        return (true, authResponse, Array.Empty<string>());
    }

    public async Task<(bool Succeeded, AuthResponseDto? AuthResponse, string[] Errors)> RefreshTokenAsync(
        string accessToken,
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        var principal = _tokenProvider.GetPrincipalFromExpiredToken(accessToken);
        if (principal == null)
        {
            return (false, null, new[] { "Invalid access token." });
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return (false, null, new[] { "Invalid claims in access token." });
        }

        var user = await _userManager.FindByIdAsync(userIdClaim);
        if (user == null)
        {
            return (false, null, new[] { "User not found." });
        }

        var existingRefreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && t.UserId == userId, cancellationToken);

        if (existingRefreshToken == null || existingRefreshToken.IsExpired || existingRefreshToken.IsRevoked)
        {
            return (false, null, new[] { "Invalid or expired refresh token." });
        }

        existingRefreshToken.IsRevoked = true;
        _dbContext.RefreshTokens.Update(existingRefreshToken);

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = _tokenProvider.GenerateAccessToken(user.Id.ToString(), user.Email!, user.FullName, roles);
        var newRefreshTokenValue = _tokenProvider.GenerateRefreshToken();
        var newRefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        var newRefreshTokenEntity = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenValue,
            ExpiresAt = newRefreshTokenExpiry
        };

        _dbContext.RefreshTokens.Add(newRefreshTokenEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var authResponse = new AuthResponseDto(
            user.Id.ToString(),
            user.Email!,
            user.FullName,
            newAccessToken,
            newRefreshTokenValue,
            newRefreshTokenExpiry,
            roles.ToList()
        );

        return (true, authResponse, Array.Empty<string>());
    }
}
