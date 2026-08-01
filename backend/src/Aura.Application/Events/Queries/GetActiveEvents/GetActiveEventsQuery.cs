using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Events.Queries.GetActiveEvents;

public record GetActiveEventsQuery() : IRequest<IReadOnlyList<EventDto>>;

public class GetActiveEventsQueryHandler : IRequestHandler<GetActiveEventsQuery, IReadOnlyList<EventDto>>
{
    private readonly IEventRepository _eventRepository;

    public GetActiveEventsQueryHandler(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<IReadOnlyList<EventDto>> Handle(GetActiveEventsQuery request, CancellationToken cancellationToken)
    {
        var events = await _eventRepository.GetActiveEventsAsync(cancellationToken);

        return events.Select(e => new EventDto(
            e.Id,
            e.Title,
            e.Type,
            e.Severity,
            e.Location.Latitude,
            e.Location.Longitude,
            e.LocationName,
            e.District,
            e.Status,
            e.Source,
            e.Metric,
            e.MetricLabel,
            e.Summary,
            e.DetectedAt,
            e.EscalatedAt
        )).ToList();
    }
}
