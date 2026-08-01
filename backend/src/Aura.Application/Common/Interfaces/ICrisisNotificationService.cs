using Aura.Domain.Entities;

namespace Aura.Application.Common.Interfaces;

public interface ICrisisNotificationService
{
    Task NotifyEventCreatedAsync(Event eventEntity, CancellationToken cancellationToken = default);
    Task NotifyReportStatusChangedAsync(CitizenReport reportEntity, CancellationToken cancellationToken = default);
}
