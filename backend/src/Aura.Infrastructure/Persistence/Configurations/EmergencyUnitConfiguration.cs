using Aura.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence.Configurations;

public class EmergencyUnitConfiguration : IEntityTypeConfiguration<EmergencyUnit>
{
    public void Configure(EntityTypeBuilder<EmergencyUnit> builder)
    {
        builder.ToTable("EmergencyUnits");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.CallSign)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.PlateNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.Type)
            .IsRequired();

        builder.Property(u => u.Status)
            .IsRequired();

        builder.Property(u => u.CurrentLocation)
            .HasConversion(
                point => point.ToText(),
                wkt => (Point)new NetTopologySuite.IO.WKTReader().Read(wkt)
            )
            .HasColumnType("text")
            .IsRequired();
    }
}
