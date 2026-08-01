using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Microsoft.AspNetCore.SignalR;

namespace Aura.Infrastructure.Services;

public class CrisisNotificationService<THub> : ICrisisNotificationService where THub : Hub
{
    private readonly IHubContext<THub> _hubContext;

    public CrisisNotificationService(IHubContext<THub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyEventCreatedAsync(Event eventEntity, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            eventEntity.Id,
            eventEntity.Title,
            Type = eventEntity.Type.ToString(),
            eventEntity.Severity,
            Latitude = eventEntity.Location.Latitude,
            Longitude = eventEntity.Location.Longitude,
            eventEntity.LocationName,
            eventEntity.District,
            Status = eventEntity.Status.ToString(),
            eventEntity.Source,
            eventEntity.Metric,
            eventEntity.MetricLabel,
            eventEntity.Summary,
            eventEntity.DetectedAt
        };

        await _hubContext.Clients.All.SendAsync("ReceiveEventCreated", payload, cancellationToken);

        if (!string.IsNullOrWhiteSpace(eventEntity.District))
        {
            await _hubContext.Clients.Group(eventEntity.District.ToLowerInvariant())
                .SendAsync("ReceiveDistrictEvent", payload, cancellationToken);
        }
    }

    public async Task NotifyReportStatusChangedAsync(CitizenReport reportEntity, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            reportEntity.Id,
            reportEntity.Title,
            Type = reportEntity.Type.ToString(),
            reportEntity.District,
            Status = reportEntity.Status.ToString(),
            reportEntity.CorroborationCount,
            Latitude = reportEntity.Location.Latitude,
            Longitude = reportEntity.Location.Longitude
        };

        await _hubContext.Clients.All.SendAsync("ReceiveReportStatusChanged", payload, cancellationToken);
    }
}
