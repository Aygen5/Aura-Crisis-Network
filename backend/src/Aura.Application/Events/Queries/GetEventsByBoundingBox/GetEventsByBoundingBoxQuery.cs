using Aura.Application.Common.Interfaces;
using Aura.Application.DTOs;
using MediatR;

namespace Aura.Application.Events.Queries.GetEventsByBoundingBox;

public record GetEventsByBoundingBoxQuery(
    double MinLat,
    double MinLng,
    double MaxLat,
    double MaxLng
) : IRequest<IReadOnlyList<EventDto>>;

public class GetEventsByBoundingBoxQueryHandler : IRequestHandler<GetEventsByBoundingBoxQuery, IReadOnlyList<EventDto>>
{
    private readonly IEventRepository _eventRepository;

    public GetEventsByBoundingBoxQueryHandler(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    public async Task<IReadOnlyList<EventDto>> Handle(GetEventsByBoundingBoxQuery request, CancellationToken cancellationToken)
    {
        var events = await _eventRepository.GetEventsByBoundingBoxAsync(
            request.MinLat, request.MinLng, request.MaxLat, request.MaxLng, cancellationToken);

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
