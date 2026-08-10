using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Aura.Infrastructure.Persistence;

public class AuraDbContextFactory : IDesignTimeDbContextFactory<AuraDbContext>
{
    public AuraDbContext CreateDbContext(string[] args)
    {
        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? "Host=127.0.0.1;Port=5433;Database=aura_db;Username=aura_user;Password=aura_dev_local_password_only;";

        var optionsBuilder = new DbContextOptionsBuilder<AuraDbContext>();
        optionsBuilder.UseNpgsql(
            connStr,
            npgsqlOptions => npgsqlOptions.UseNetTopologySuite());

        return new AuraDbContext(optionsBuilder.Options);
    }
}
