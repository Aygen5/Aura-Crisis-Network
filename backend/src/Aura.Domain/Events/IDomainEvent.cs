namespace Aura.Domain.Events;

public interface IDomainEvent
{
    DateTimeOffset OccurredOn { get; }
}
