using System.Data;
using Aura.Application.Common.Interfaces;
using Aura.Application.GisTiles.DTOs;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Aura.Infrastructure.Persistence.Repositories;

public class GisTileRepository : IGisTileRepository
{
    private readonly AuraDbContext _dbContext;

    public GisTileRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<byte[]> GetVectorTileAsync(int z, int x, int y, CancellationToken cancellationToken = default)
    {
        var n = Math.Pow(2, z);
        var lonMin = x / n * 360.0 - 180.0;
        var lonMax = (x + 1) / n * 360.0 - 180.0;
        var latMax = Math.Atan(Math.Sinh(Math.PI * (1 - 2 * y / n))) * 180.0 / Math.PI;
        var latMin = Math.Atan(Math.Sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180.0 / Math.PI;

        const string sql = @"
            WITH tile_bounds AS (
                SELECT ST_MakeEnvelope(@lonMin, @latMin, @lonMax, @latMax, 4326) AS bbox
            ),
            mvt_geom AS (
                SELECT 
                    r.""Id"" AS id,
                    r.""Name"" AS name,
                    r.""District"" AS district,
                    r.""Type"" AS type,
                    r.""Severity"" AS severity,
                    ST_AsMVTGeom(r.""Boundary"", tb.bbox, 4096, 256, true) AS geom
                FROM ""RiskZones"" r, tile_bounds tb
                WHERE r.""IsDeleted"" = false 
                  AND ST_Intersects(r.""Boundary"", tb.bbox)
            )
            SELECT COALESCE(ST_AsMVT(mvt_geom.*, 'risk_zones', 4096, 'geom'), '\x'::bytea)
            FROM mvt_geom;";

        try
        {
            var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
            if (connection.State != ConnectionState.Open)
            {
                await connection.OpenAsync(cancellationToken);
            }

            using var command = new NpgsqlCommand(sql, connection);
            command.Parameters.AddWithValue("lonMin", lonMin);
            command.Parameters.AddWithValue("latMin", latMin);
            command.Parameters.AddWithValue("lonMax", lonMax);
            command.Parameters.AddWithValue("latMax", latMax);

            var result = await command.ExecuteScalarAsync(cancellationToken);
            return result is byte[] bytes ? bytes : Array.Empty<byte>();
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }

    public async Task<IReadOnlyList<MarkerClusterDto>> GetClusteredMarkersAsync(
        double minLat,
        double minLng,
        double maxLat,
        double maxLng,
        int zoomLevel,
        CancellationToken cancellationToken = default)
    {
        double gridStep = zoomLevel switch
        {
            < 6 => 2.0,
            < 9 => 0.5,
            < 12 => 0.1,
            < 14 => 0.02,
            _ => 0.005
        };

        var allEvents = await _dbContext.Events
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);

        var allReports = await _dbContext.CitizenReports
            .Where(r => !r.IsDeleted)
            .ToListAsync(cancellationToken);

        var events = allEvents
            .Where(e => e.Location != null && e.Location.Latitude >= minLat && e.Location.Latitude <= maxLat && e.Location.Longitude >= minLng && e.Location.Longitude <= maxLng)
            .ToList();

        var reports = allReports
            .Where(r => r.Location != null && r.Location.Latitude >= minLat && r.Location.Latitude <= maxLat && r.Location.Longitude >= minLng && r.Location.Longitude <= maxLng)
            .ToList();

        var allMarkers = events.Select(e => new {
            Id = e.Id.ToString(),
            Lat = e.Location.Latitude,
            Lng = e.Location.Longitude,
            Severity = e.Severity,
            Type = e.Type.ToString()
        }).Concat(reports.Select(r => new {
            Id = r.Id.ToString(),
            Lat = r.Location.Latitude,
            Lng = r.Location.Longitude,
            Severity = 50,
            Type = r.Type.ToString() == "Earthquake" || r.Type.ToString() == "Flood" || r.Type.ToString() == "Wildfire" || r.Type.ToString() == "Landslide" || r.Type.ToString() == "Medical" ? r.Type.ToString() : "Report"
        })).ToList();

        if (allMarkers.Count == 0) return Array.Empty<MarkerClusterDto>();

        var grouped = allMarkers.GroupBy(m => new {
            LatGrid = Math.Floor(m.Lat / gridStep),
            LngGrid = Math.Floor(m.Lng / gridStep)
        });

        var result = new List<MarkerClusterDto>();
        foreach (var g in grouped)
        {
            var count = g.Count();
            var avgLat = g.Average(x => x.Lat);
            var avgLng = g.Average(x => x.Lng);
            var maxSeverity = g.Max(x => x.Severity);
            var primaryType = g.GroupBy(x => x.Type).OrderByDescending(tg => tg.Count()).First().Key;
            var clusterId = count == 1 ? g.First().Id : $"{g.Key.LatGrid}_{g.Key.LngGrid}";

            result.Add(new MarkerClusterDto(
                ClusterId: clusterId,
                PointCount: count,
                Latitude: avgLat,
                Longitude: avgLng,
                MaxSeverity: maxSeverity,
                PrimaryDisasterType: primaryType,
                IsCluster: count > 1
            ));
        }

        return result;
    }
}
