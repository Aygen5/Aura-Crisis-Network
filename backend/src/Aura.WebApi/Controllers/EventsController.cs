using Aura.Application.DTOs;
using Aura.Application.Events.Queries.GetActiveEvents;
using Aura.Application.Events.Queries.GetEventsByBoundingBox;
using Microsoft.AspNetCore.Mvc;

namespace Aura.WebApi.Controllers;

public class EventsController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetActiveEvents(CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetActiveEventsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("bounding-box")]
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
}
