import { httpClient } from "@/lib/http-client";
import type { AuditLogDto, AuditLogFilterParams, PagedResultDto } from "@/types";

export const auditLogsService = {
  getAuditLogs: (params: AuditLogFilterParams): Promise<PagedResultDto<AuditLogDto>> => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params.userId) query.append("userId", params.userId);
    if (params.entityName) query.append("entityName", params.entityName);
    if (params.action) query.append("action", params.action);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    return httpClient<PagedResultDto<AuditLogDto>>(`/audit-logs?${query.toString()}`);
  },
};
