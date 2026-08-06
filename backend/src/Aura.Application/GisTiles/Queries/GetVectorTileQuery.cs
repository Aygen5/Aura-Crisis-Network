using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.GisTiles.Queries;

public record GetVectorTileQuery(int Z, int X, int Y) : IRequest<byte[]>;

public class GetVectorTileQueryHandler : IRequestHandler<GetVectorTileQuery, byte[]>
{
    private readonly IGisTileRepository _repository;

    public GetVectorTileQueryHandler(IGisTileRepository repository)
    {
        _repository = repository;
    }

    public async Task<byte[]> Handle(GetVectorTileQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetVectorTileAsync(request.Z, request.X, request.Y, cancellationToken);
    }
}
