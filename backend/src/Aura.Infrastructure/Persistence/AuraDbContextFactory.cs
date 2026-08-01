using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Aura.Infrastructure.Persistence;

public class AuraDbContextFactory : IDesignTimeDbContextFactory<AuraDbContext>
{
    public AuraDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuraDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Port=5432;Database=aura_db;Username=aura_user;Password=aura_password_2026!",
            npgsqlOptions => npgsqlOptions.UseNetTopologySuite());

        return new AuraDbContext(optionsBuilder.Options);
    }
}
