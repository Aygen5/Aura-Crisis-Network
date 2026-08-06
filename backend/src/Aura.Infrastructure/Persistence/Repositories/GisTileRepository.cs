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

        const string sql = @"
            SELECT 
                CAST(FLOOR(""Latitude"" / @gridStep) * @gridStep AS text) || '_' || CAST(FLOOR(""Longitude"" / @gridStep) * @gridStep AS text) AS ClusterId,
                COUNT(*) AS PointCount,
                AVG(""Latitude"") AS Latitude,
                AVG(""Longitude"") AS Longitude,
                MAX(""Severity"") AS MaxSeverity,
                MODE() WITHIN GROUP (ORDER BY ""Type"") AS PrimaryDisasterType,
                (COUNT(*) > 1) AS IsCluster
            FROM ""CitizenReports""
            WHERE ""IsDeleted"" = false
              AND ""Latitude"" BETWEEN @minLat AND @maxLat
              AND ""Longitude"" BETWEEN @minLng AND @maxLng
            GROUP BY FLOOR(""Latitude"" / @gridStep), FLOOR(""Longitude"" / @gridStep);";

        var clusters = new List<MarkerClusterDto>();

        var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("minLat", minLat);
        command.Parameters.AddWithValue("maxLat", maxLat);
        command.Parameters.AddWithValue("minLng", minLng);
        command.Parameters.AddWithValue("maxLng", maxLng);
        command.Parameters.AddWithValue("gridStep", gridStep);

        using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            clusters.Add(new MarkerClusterDto(
                ClusterId: reader.GetString(0),
                PointCount: reader.GetInt32(1),
                Latitude: reader.GetDouble(2),
                Longitude: reader.GetDouble(3),
                MaxSeverity: reader.GetInt32(4),
                PrimaryDisasterType: reader.GetString(5),
                IsCluster: reader.GetBoolean(6)
            ));
        }

        return clusters;
    }
}
