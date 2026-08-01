using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aura.Infrastructure.Persistence.Configurations;

public class OperatorConfiguration : IEntityTypeConfiguration<Operator>
{
    public void Configure(EntityTypeBuilder<Operator> builder)
    {
        builder.ToTable("Operators");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(o => o.BadgeNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(o => o.BadgeNumber)
            .IsUnique();

        builder.Property(o => o.Email)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(o => o.Email)
            .IsUnique();

        builder.Property(o => o.Organization)
            .IsRequired()
            .HasMaxLength(100);
    }
}
