using Aura.Application.Common.Interfaces;
using Aura.Application.GisTiles.DTOs;
using MediatR;

namespace Aura.Application.GisTiles.Queries;

public record GetClusteredMarkersQuery(
    double MinLat,
    double MinLng,
    double MaxLat,
    double MaxLng,
    int ZoomLevel) : IRequest<IReadOnlyList<MarkerClusterDto>>;

public class GetClusteredMarkersQueryHandler : IRequestHandler<GetClusteredMarkersQuery, IReadOnlyList<MarkerClusterDto>>
{
    private readonly IGisTileRepository _repository;

    public GetClusteredMarkersQueryHandler(IGisTileRepository repository)
    {
        _repository = repository;
    }

    public async Task<IReadOnlyList<MarkerClusterDto>> Handle(GetClusteredMarkersQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetClusteredMarkersAsync(
            request.MinLat,
            request.MinLng,
            request.MaxLat,
            request.MaxLng,
            request.ZoomLevel,
            cancellationToken);
    }
}
