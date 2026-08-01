using Aura.Domain.Enums;

namespace Aura.Domain.Events;

public record ReportStatusChangedDomainEvent(
    Guid ReportId,
    ReportStatus PreviousStatus,
    ReportStatus NewStatus,
    DateTimeOffset OccurredOn
) : IDomainEvent;
