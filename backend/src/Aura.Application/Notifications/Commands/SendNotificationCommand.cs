using System.Text.Json;
using Aura.Application.Common.Interfaces;
using Aura.Domain.Entities;
using Aura.Domain.Enums;
using MediatR;

namespace Aura.Application.Notifications.Commands;

public record SendNotificationCommand(
    string RecipientUserId,
    string Title,
    string Message,
    NotificationType Type,
    string? PayloadJson = null) : IRequest<Guid>;

public class SendNotificationCommandHandler : IRequestHandler<SendNotificationCommand, Guid>
{
    private readonly INotificationRepository _notificationRepository;
    private readonly IOutboxRepository _outboxRepository;
    private readonly IUnitOfWork _unitOfWork;

    public SendNotificationCommandHandler(
        INotificationRepository notificationRepository,
        IOutboxRepository outboxRepository,
        IUnitOfWork unitOfWork)
    {
        _notificationRepository = notificationRepository;
        _outboxRepository = outboxRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(SendNotificationCommand request, CancellationToken cancellationToken)
    {
        var notification = new Notification(
            request.RecipientUserId,
            request.Title,
            request.Message,
            request.Type,
            request.PayloadJson
        );

        await _notificationRepository.AddAsync(notification, cancellationToken);

        var payload = JsonSerializer.Serialize(new
        {
            NotificationId = notification.Id,
            request.RecipientUserId,
            request.Title,
            request.Message,
            Type = request.Type.ToString(),
            request.PayloadJson
        });

        var outboxMessage = new OutboxMessage("NotificationCreated", payload);
        await _outboxRepository.AddAsync(outboxMessage, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return notification.Id;
    }
}
