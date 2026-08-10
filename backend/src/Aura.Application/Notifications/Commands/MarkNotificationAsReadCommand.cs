using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.Notifications.Commands;

public record MarkNotificationAsReadCommand(Guid NotificationId) : IRequest<bool>;

public class MarkNotificationAsReadCommandHandler : IRequestHandler<MarkNotificationAsReadCommand, bool>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IUnitOfWork _unitOfWork;

    public MarkNotificationAsReadCommandHandler(
        INotificationRepository notificationRepository,
        ICurrentUserService currentUserService,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _currentUserService = currentUserService;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(MarkNotificationAsReadCommand request, CancellationToken cancellationToken)
    {
        var notification = await _notificationRepository.GetByIdAsync(request.NotificationId, cancellationToken);
        if (notification == null) return false;

        var currentUserId = _currentUserService.UserId;

        if (string.IsNullOrWhiteSpace(currentUserId) || notification.RecipientUserId != currentUserId)
        {
            return false;
        }

        notification.MarkAsRead();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
