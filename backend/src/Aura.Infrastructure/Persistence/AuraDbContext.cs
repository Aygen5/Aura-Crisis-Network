using System.Linq.Expressions;
using Aura.Domain.Common;
using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence;

public class AuraDbContext : DbContext
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<CitizenReport> CitizenReports => Set<CitizenReport>();
    public DbSet<DistrictRisk> DistrictRisks => Set<DistrictRisk>();
    public DbSet<Operator> Operators => Set<Operator>();

    public AuraDbContext(DbContextOptions<AuraDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("postgis");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AuraDbContext).Assembly);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasQueryFilter(GetIsDeletedFilter(entityType.ClrType));
            }
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Modified:
                    entry.Entity.MarkUpdated();
                    break;

                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.SoftDelete();
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    private static LambdaExpression GetIsDeletedFilter(Type entityType)
    {
        var parameter = Expression.Parameter(entityType, "e");
        var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
        var falseConstant = Expression.Constant(false);
        var comparison = Expression.Equal(property, falseConstant);

        return Expression.Lambda(comparison, parameter);
    }
}
