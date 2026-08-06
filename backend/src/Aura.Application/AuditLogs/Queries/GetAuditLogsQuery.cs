using Aura.Application.AuditLogs.DTOs;
using Aura.Application.Common.Interfaces;
using MediatR;

namespace Aura.Application.AuditLogs.Queries;

public record GetAuditLogsQuery(
    int Page = 1,
    int PageSize = 20,
    Guid? UserId = null,
    string? EntityName = null,
    string? Action = null,
    DateTimeOffset? StartDate = null,
    DateTimeOffset? EndDate = null) : IRequest<PagedResultDto<AuditLogDto>>;

public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, PagedResultDto<AuditLogDto>>
{
    private readonly IAuditLogRepository _repository;

    public GetAuditLogsQueryHandler(IAuditLogRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResultDto<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        return await _repository.GetPagedAuditLogsAsync(
            request.Page,
            request.PageSize,
            request.UserId,
            request.EntityName,
            request.Action,
            request.StartDate,
            request.EndDate,
            cancellationToken);
    }
}
