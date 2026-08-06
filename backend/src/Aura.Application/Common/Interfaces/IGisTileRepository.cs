using Aura.Application.GisTiles.DTOs;

namespace Aura.Application.Common.Interfaces;

public interface IGisTileRepository
{
    Task<byte[]> GetVectorTileAsync(int z, int x, int y, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MarkerClusterDto>> GetClusteredMarkersAsync(
        double minLat,
        double minLng,
        double maxLat,
        double maxLng,
        int zoomLevel,
        CancellationToken cancellationToken = default);
}
