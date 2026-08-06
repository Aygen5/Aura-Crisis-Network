using Aura.Application.AuditLogs.DTOs;

namespace Aura.Application.Common.Interfaces;

public interface IAuditLogRepository
{
    Task<PagedResultDto<AuditLogDto>> GetPagedAuditLogsAsync(
        int page = 1,
        int pageSize = 20,
        Guid? userId = null,
        string? entityName = null,
        string? action = null,
        DateTimeOffset? startDate = null,
        DateTimeOffset? endDate = null,
        CancellationToken cancellationToken = default);
}
