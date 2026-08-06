using Aura.Application.EmergencyUnits.Commands;
using Aura.Application.EmergencyUnits.DTOs;
using Aura.Application.EmergencyUnits.Queries;
using Aura.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

[ApiController]
[Route("api/v1/emergency-units")]
public class EmergencyUnitsController : ControllerBase
{
    private readonly ISender _sender;

    public EmergencyUnitsController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    public async Task<ActionResult<Guid>> CreateUnit(
        [FromBody] CreateEmergencyUnitCommand command,
        CancellationToken cancellationToken = default)
    {
        var id = await _sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetAllUnits), new { id }, id);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<EmergencyUnitDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EmergencyUnitDto>>> GetAllUnits(CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new GetAllEmergencyUnitsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("nearest")]
    [ProducesResponseType(typeof(IReadOnlyList<EmergencyUnitDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EmergencyUnitDto>>> GetNearestUnits(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] int count = 5,
        [FromQuery] UnitType? typeFilter = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new GetNearestEmergencyUnitsQuery(latitude, longitude, count, typeFilter),
            cancellationToken);

        return Ok(result);
    }

    [HttpPost("{id:guid}/location")]
    [ProducesResponseType(typeof(EmergencyUnitDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmergencyUnitDto>> UpdateLocation(
        [FromRoute] Guid id,
        [FromBody] UpdateGpsRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(
            new UpdateUnitGpsLocationCommand(id, request.Latitude, request.Longitude, request.SpeedKmh, request.HeadingDegrees),
            cancellationToken);

        return Ok(result);
    }

    [HttpPost("{id:guid}/dispatch")]
    [Authorize(Roles = "Admin,Operator")]
    [ProducesResponseType(typeof(EmergencyUnitDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EmergencyUnitDto>> DispatchUnit(
        [FromRoute] Guid id,
        [FromBody] DispatchRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await _sender.Send(new DispatchUnitCommand(id, request.EventId), cancellationToken);
        return Ok(result);
    }
}

public record UpdateGpsRequest(double Latitude, double Longitude, double SpeedKmh, double HeadingDegrees);
public record DispatchRequest(Guid EventId);
