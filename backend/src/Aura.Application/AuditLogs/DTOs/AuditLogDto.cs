namespace Aura.Application.AuditLogs.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string? IpAddress,
    string EntityName,
    string Action,
    string EntityId,
    string? OldValues,
    string? NewValues,
    string? ChangedColumns,
    DateTimeOffset CreatedAt);

public record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages);
