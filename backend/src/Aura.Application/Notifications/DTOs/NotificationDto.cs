using Aura.Domain.Enums;

namespace Aura.Application.Notifications.DTOs;

public record NotificationDto(
    Guid Id,
    string RecipientUserId,
    string Title,
    string Message,
    NotificationType Type,
    bool IsRead,
    DateTimeOffset? ReadAt,
    string? PayloadJson,
    DateTimeOffset CreatedAt);
