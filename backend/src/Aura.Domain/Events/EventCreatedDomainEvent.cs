using Aura.Domain.Enums;

namespace Aura.Domain.Events;

public record EventCreatedDomainEvent(
    Guid EventId,
    DisasterType Type,
    string District,
    DateTimeOffset OccurredOn
) : IDomainEvent;
