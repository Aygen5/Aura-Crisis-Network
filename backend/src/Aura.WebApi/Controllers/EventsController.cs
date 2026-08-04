using Aura.Application.DTOs;
using Aura.Application.Events.Commands.EscalateEvent;
using Aura.Application.Events.Queries.GetActiveEvents;
using Aura.Application.Events.Queries.GetEventById;
using Aura.Application.Events.Queries.GetEventsByBoundingBox;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

public class EventsController : BaseApiController
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetActiveEvents(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetActiveEventsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<EventDto>> GetEventById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetEventByIdQuery(id), cancellationToken);
        if (result == null) return NotFound(new { Message = $"Event with ID {id} was not found." });
        return Ok(result);
    }

    [HttpGet("bounding-box")]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetEventsByBoundingBox(
        [FromQuery] double minLat,
        [FromQuery] double minLng,
        [FromQuery] double maxLat,
        [FromQuery] double maxLng,
        CancellationToken cancellationToken)
    {
        var query = new GetEventsByBoundingBoxQuery(minLat, minLng, maxLat, maxLng);
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/escalate")]
    [Authorize(Roles = "Operator,Admin")]
    public async Task<IActionResult> EscalateEvent(Guid id, CancellationToken cancellationToken)
    {
        var success = await Mediator.Send(new EscalateEventCommand(id), cancellationToken);
        if (!success) return NotFound(new { Message = $"Event with ID {id} was not found." });
        return NoContent();
    }
}
