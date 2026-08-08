using Aura.Domain.Entities;
using Aura.Domain.Enums;
using NetTopologySuite.Geometries;

namespace Aura.Infrastructure.Persistence;

public static class AuraDbSeeder
{
    private static readonly GeometryFactory GeometryFactory = new(new PrecisionModel(), 4326);

    public static async Task SeedAsync(AuraDbContext dbContext)
    {
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
    }
}
