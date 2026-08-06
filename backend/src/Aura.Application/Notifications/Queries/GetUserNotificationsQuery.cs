using Aura.Application.Common.Interfaces;
using Aura.Application.Notifications.DTOs;
using MediatR;

namespace Aura.Application.Notifications.Queries;

public record GetUserNotificationsQuery(string RecipientUserId, int Limit = 20) : IRequest<IReadOnlyList<NotificationDto>>;

public class GetUserNotificationsQueryHandler : IRequestHandler<GetUserNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private readonly INotificationRepository _notificationRepository;

    public GetUserNotificationsQueryHandler(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<IReadOnlyList<NotificationDto>> Handle(GetUserNotificationsQuery request, CancellationToken cancellationToken)
    {
        var list = await _notificationRepository.GetUserNotificationsAsync(request.RecipientUserId, request.Limit, cancellationToken);
        return list.Select(n => new NotificationDto(
            n.Id,
            n.RecipientUserId,
            n.Title,
            n.Message,
            n.Type,
            n.IsRead,
            n.ReadAt,
            n.PayloadJson,
            n.CreatedAt
        )).ToList();
    }
}
