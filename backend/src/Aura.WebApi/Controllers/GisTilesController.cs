using Aura.Application.GisTiles.DTOs;
using Aura.Application.GisTiles.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[ApiController]
[Route("api/v1/gis")]
public class GisTilesController : ControllerBase
{
    private readonly ISender _sender;

    public GisTilesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet("tiles/{z:int}/{x:int}/{y:int}.pbf")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetVectorTile(
        [FromRoute] int z,
        [FromRoute] int x,
        [FromRoute] int y,
        CancellationToken cancellationToken = default)
    {
        var pbfBytes = await _sender.Send(new GetVectorTileQuery(z, x, y), cancellationToken);
        return File(pbfBytes, "application/x-protobuf");
    }

    [HttpGet("clusters")]
    [ProducesResponseType(typeof(IReadOnlyList<MarkerClusterDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MarkerClusterDto>>> GetClusteredMarkers(
        [FromQuery] double minLat = 35.0,
        [FromQuery] double minLng = 25.0,
        [FromQuery] double maxLat = 43.0,
        [FromQuery] double maxLng = 45.0,
        [FromQuery] int zoom = 10,
        CancellationToken cancellationToken = default)
    {
        var clusters = await _sender.Send(
            new GetClusteredMarkersQuery(minLat, minLng, maxLat, maxLng, zoom),
            cancellationToken);

        return Ok(clusters);
    }
}
