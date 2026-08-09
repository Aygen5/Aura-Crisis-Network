using Aura.Domain.Entities;
using Aura.Domain.Enums;
using Aura.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence;

public static class AuraDbSeeder
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public static async Task SeedAsync(AuraDbContext dbContext)
    {
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(
                "ALTER TABLE \"CitizenReports\" ADD COLUMN IF NOT EXISTS \"ReporterUserId\" character varying(128);");
        }
        catch
        {
        }

        if (!dbContext.EmergencyUnits.Any())
        {
            var units = new List<EmergencyUnit>
            {
                new("AFAD-01", "34 AFAD 01", UnitType.SearchAndRescue, GeometryFactory.CreatePoint(new Coordinate(29.02, 41.01))),
                new("AFAD-02", "34 AFAD 02", UnitType.SearchAndRescue, GeometryFactory.CreatePoint(new Coordinate(28.97, 41.04))),
                new("UMKE-01", "34 UMKE 10", UnitType.Ambulance, GeometryFactory.CreatePoint(new Coordinate(29.05, 40.99))),
                new("AKUT-01", "34 AKUT 05", UnitType.SearchAndRescue, GeometryFactory.CreatePoint(new Coordinate(29.11, 40.98))),
                new("AKUT-02", "34 AKUT 06", UnitType.SearchAndRescue, GeometryFactory.CreatePoint(new Coordinate(28.94, 41.02))),
                new("İTFAİYE-01", "34 ITR 112", UnitType.FireEngine, GeometryFactory.CreatePoint(new Coordinate(28.98, 41.05))),
                new("İTFAİYE-02", "34 ITR 114", UnitType.FireEngine, GeometryFactory.CreatePoint(new Coordinate(29.08, 41.03))),
                new("POLİS-01", "34 A 9912", UnitType.PolicePatrol, GeometryFactory.CreatePoint(new Coordinate(29.00, 41.00)))
            };

            await dbContext.EmergencyUnits.AddRangeAsync(units);
            await dbContext.SaveChangesAsync();
        }

        if (!dbContext.Events.Any(e => e.Type == DisasterType.Wildfire || e.Type == DisasterType.Flood))
        {
            var sampleEvents = new List<Event>
            {
                new Event("Çanakkale Gelibolu Orman Yangını", DisasterType.Wildfire, 88, new GeoPoint(40.15, 26.41), "Gelibolu / Çanakkale", "Gelibolu", "MGM / Orman Genel Müz.", "88", "Şiddet", "Yüksek rüzgar hızı nedeniyle yangın riski kritik seviyede.", DateTimeOffset.UtcNow.AddHours(-3)),
                new Event("Muğla Bodrum Kıyı Yangın İhbarı", DisasterType.Wildfire, 75, new GeoPoint(37.03, 27.43), "Bodrum / Muğla", "Bodrum", "Vatandaş İhbarı", "75", "Şiddet", "Makilik alanda başlayan yangına itfaiye ekipleri sevk edildi.", DateTimeOffset.UtcNow.AddHours(-1)),
                new Event("Şile Ormanlık Alan Yangın Uyarısı", DisasterType.Wildfire, 65, new GeoPoint(41.17, 29.61), "Şile / İstanbul", "Şile", "Uydu Termal Kamera", "65", "Şiddet", "Termal kameralarda tespit edilen sıcaklık artışı.", DateTimeOffset.UtcNow.AddHours(-2)),
                new Event("Kurubağ Dere Yatağı Sel & Taşkın Uyarısı", DisasterType.Flood, 82, new GeoPoint(40.99, 29.03), "Kadıköy / İstanbul", "Kadıköy", "Meteoroloji Gn. Müz.", "82mm/h", "Yağış", "Aşırı yağış nedeniyle dere yatağı taşma riski yüksek.", DateTimeOffset.UtcNow.AddHours(-4)),
                new Event("Kastamonu Bozkurt Dere Taşkın İhbarı", DisasterType.Flood, 90, new GeoPoint(41.95, 31.95), "Bozkurt / Kastamonu", "Bozkurt", "AFAD", "90mm/h", "Yağış", "Debi yükselmesi ve su baskını uyarısı.", DateTimeOffset.UtcNow.AddHours(-5)),
                new Event("Rize Çayeli Sel ve Kıyı Taşkını", DisasterType.Flood, 78, new GeoPoint(41.09, 40.72), "Çayeli / Rize", "Çayeli", "Meteoroloji", "78mm/h", "Yağış", "Şiddetli yağış sonrasında cadde ve sokaklarda su birikintisi.", DateTimeOffset.UtcNow.AddHours(-6)),
                new Event("Avcılar Heyelan Duyarlı Bölge Uyarısı", DisasterType.Landslide, 70, new GeoPoint(40.98, 28.72), "Avcılar / İstanbul", "Avcılar", "MTA", "70", "Risk", "Zemin kayma riski tespiti.", DateTimeOffset.UtcNow.AddHours(-8)),
            };

            await dbContext.Events.AddRangeAsync(sampleEvents);
            await dbContext.SaveChangesAsync();
        }

        if (!dbContext.CitizenReports.Any())
        {
            var sampleReports = new List<CitizenReport>
            {
                new CitizenReport("Kadıköy Binasında Derin Çatlak İhbarı", DisasterType.Report, "Kadıköy", "Ahmet Yılmaz", "05321112233", new GeoPoint(40.992, 29.028), "Binanın taşıyıcı kolonlarında çatlaklar görüldü."),
                new CitizenReport("Fatih Su Baskını ve Mahsur Kalma İhbarı", DisasterType.Flood, "Fatih", "Mehmet Demir", "05429998877", new GeoPoint(41.019, 28.951), "Zemin kat daireyi su bastı, elektrikler kesik."),
                new CitizenReport("Beşiktaş Orman Sınırı Duman İhbarı", DisasterType.Wildfire, "Beşiktaş", "Ayşe Kaya", "05053334455", new GeoPoint(41.043, 29.008), "Park alanından yoğun duman yükseliyor."),
                new CitizenReport("Avcılar Acil Medikal Yardım Talebi", DisasterType.Medical, "Avcılar", "Fatma Çelik", "05556667788", new GeoPoint(40.981, 28.719), "Deprem sonrası şok geçiren vatandaş için ambulans sevk talebi."),
            };

            await dbContext.CitizenReports.AddRangeAsync(sampleReports);
            await dbContext.SaveChangesAsync();
        }
    }
}
