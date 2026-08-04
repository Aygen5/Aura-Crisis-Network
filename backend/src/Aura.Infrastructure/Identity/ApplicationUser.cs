using Microsoft.AspNetCore.Identity;

namespace Aura.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}
