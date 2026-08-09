using Aura.Domain.Entities;
using Aura.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

namespace Aura.Infrastructure.Persistence.Configurations;

public class CitizenReportConfiguration : IEntityTypeConfiguration<CitizenReport>
{
    public void Configure(EntityTypeBuilder<CitizenReport> builder)
    {
        builder.ToTable("CitizenReports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.District)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.ReporterName)
            .HasMaxLength(100);

        builder.Property(r => r.ReporterPhone)
            .HasMaxLength(30);

        builder.Property(r => r.Location)
            .HasConversion(
                geoPoint => new Point(geoPoint.Longitude, geoPoint.Latitude) { SRID = 4326 }.ToText(),
                wkt => ParseGeoPointFromWkt(wkt)
            )
            .HasColumnType("text")
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(r => r.Summary)
            .HasMaxLength(2000);

        builder.Property(r => r.ReporterUserId)
            .HasMaxLength(128)
            .IsRequired(false);

        builder.HasMany(r => r.Attachments)
            .WithOne()
            .HasForeignKey(a => a.CitizenReportId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static GeoPoint ParseGeoPointFromWkt(string wkt)
    {
        if (string.IsNullOrWhiteSpace(wkt)) return new GeoPoint(0, 0);
        var pt = (Point)new WKTReader().Read(wkt);
        return new GeoPoint(pt.Y, pt.X);
    }
}
