using Aura.Domain.Entities;
using Aura.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("Events");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Severity)
            .IsRequired();

        builder.Property(e => e.Location)
            .HasConversion(
                geoPoint => new Point(geoPoint.Longitude, geoPoint.Latitude) { SRID = 4326 },
                point => new GeoPoint(point.Y, point.X)
            )
            .HasColumnType("geometry(Point, 4326)")
            .IsRequired();

        builder.HasIndex(e => e.Location)
            .HasMethod("GIST");

        builder.Property(e => e.LocationName)
            .HasMaxLength(200);

        builder.Property(e => e.District)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Source)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(e => e.Metric)
            .HasMaxLength(50);

        builder.Property(e => e.MetricLabel)
            .HasMaxLength(50);

        builder.Property(e => e.Summary)
            .HasMaxLength(2000);
    }
}
