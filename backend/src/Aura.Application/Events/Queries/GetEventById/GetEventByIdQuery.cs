using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Events.Queries.GetEventById;

public record GetEventByIdQuery(Guid Id) : IRequest<EventDto?>;

public class GetEventByIdQueryHandler : IRequestHandler<GetEventByIdQuery, EventDto?>
{
    private readonly IEventRepository _eventRepository;

    public GetEventByIdQueryHandler(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<EventDto?> Handle(GetEventByIdQuery request, CancellationToken cancellationToken)
    {
        var ev = await _eventRepository.GetByIdAsync(request.Id, cancellationToken);
        if (ev == null) return null;

        return new EventDto(
            ev.Id,
            ev.Title,
            ev.Type,
            ev.Severity,
            ev.Location.Latitude,
            ev.Location.Longitude,
            ev.LocationName,
            ev.District,
            ev.Status,
            ev.Source,
            ev.Metric,
            ev.MetricLabel,
            ev.Summary,
            ev.DetectedAt,
            ev.EscalatedAt
        );
    }
}
