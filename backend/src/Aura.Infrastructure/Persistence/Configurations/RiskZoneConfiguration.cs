using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Aura.Infrastructure.Persistence.Configurations;

public class RiskZoneConfiguration : IEntityTypeConfiguration<RiskZone>
{
    public void Configure(EntityTypeBuilder<RiskZone> builder)
    {
        builder.ToTable("RiskZones");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.District)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.Type)
            .IsRequired();

        builder.Property(r => r.Severity)
            .IsRequired();

        builder.Property(r => r.Description)
            .HasMaxLength(2000);

        builder.Property(r => r.Boundary)
            .HasColumnType("geometry(Polygon, 4326)")
            .IsRequired();

        builder.HasIndex(r => r.Boundary)
            .HasMethod("gist");
    }
}
