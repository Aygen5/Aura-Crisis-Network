using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.Events.Commands.EscalateEvent;

public record EscalateEventCommand(Guid Id) : IRequest<bool>;

public class EscalateEventCommandHandler : IRequestHandler<EscalateEventCommand, bool>
{
    private readonly IEventRepository _eventRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICrisisNotificationService _notificationService;

    public EscalateEventCommandHandler(
        IEventRepository eventRepository,
        IUnitOfWork unitOfWork,
        ICrisisNotificationService notificationService)
    {
        _eventRepository = eventRepository;
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<bool> Handle(EscalateEventCommand request, CancellationToken cancellationToken)
    {
        var ev = await _eventRepository.GetByIdAsync(request.Id, cancellationToken);
        if (ev == null) return false;

        ev.Escalate();
        _eventRepository.Update(ev);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyEventCreatedAsync(ev, cancellationToken);

        return true;
    }
}
