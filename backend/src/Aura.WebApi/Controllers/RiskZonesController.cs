using Aura.Application.RiskZones.Commands;
using Aura.Application.RiskZones.DTOs;
using Aura.Application.RiskZones.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[ApiController]
[Route("api/v1/risk-zones")]
public class RiskZonesController : ControllerBase
{
    private readonly ISender _sender;

    public RiskZonesController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<ActionResult<Guid>> CreateRiskZone(
        [FromBody] CreateRiskZoneCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetIntersectingZones), new { latitude = command.PolygonPoints[0].Latitude, longitude = command.PolygonPoints[0].Longitude }, id);
    }

    [HttpGet("intersects")]
    [ProducesResponseType(typeof(IReadOnlyList<RiskZoneDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RiskZoneDto>>> GetIntersectingZones(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetIntersectingRiskZonesQuery(latitude, longitude), cancellationToken);
        return Ok(result);
    }

    [HttpGet("buffer")]
    [ProducesResponseType(typeof(BufferAnalysisResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<BufferAnalysisResultDto>> CalculateBufferAnalysis(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusMeters = 5000,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new CalculateBufferAnalysisQuery(latitude, longitude, radiusMeters), cancellationToken);
        return Ok(result);
    }
}
