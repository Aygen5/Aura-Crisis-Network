using Aura.Application.AuditLogs.DTOs;
using Aura.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Aura.Infrastructure.Persistence.Repositories;

public class AuditLogRepository : IAuditLogRepository
{
    private readonly AuraDbContext _dbContext;

    public AuditLogRepository(AuraDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResultDto<AuditLogDto>> GetPagedAuditLogsAsync(
        int page = 1,
        int pageSize = 20,
        Guid? userId = null,
        string? entityName = null,
        string? action = null,
        DateTimeOffset? startDate = null,
        DateTimeOffset? endDate = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.AuditLogs.AsNoTracking();

        if (userId.HasValue)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        if (!string.IsNullOrWhiteSpace(entityName))
        {
            query = query.Where(a => a.EntityName == entityName);
        }

        if (!string.IsNullOrWhiteSpace(action))
        {
            query = query.Where(a => a.Action == action);
        }

        if (startDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= endDate.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.UserEmail,
                a.IpAddress,
                a.UserAgent,
                a.CorrelationId,
                a.RequestId,
                a.EntityName,
                a.Action,
                a.EntityId,
                a.OldValues,
                a.NewValues,
                a.ChangedColumns,
                a.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PagedResultDto<AuditLogDto>(
            items,
            totalCount,
            page,
            pageSize,
            totalPages
        );
    }
}
