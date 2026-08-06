import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { auditLogsService } from "@/services/audit-logs.service";
import { QUERY_KEYS, QUERY_CACHE_TTL } from "@/constants";
import type { AuditLogDto, AuditLogFilterParams, PagedResultDto } from "@/types";

export function useAuditLogs(params: AuditLogFilterParams) {
  return useQuery<PagedResultDto<AuditLogDto>>({
    queryKey: QUERY_KEYS.auditLogs.paged(params),
    queryFn: () => auditLogsService.getAuditLogs(params),
    placeholderData: keepPreviousData,
    staleTime: QUERY_CACHE_TTL.AUDIT_LOGS,
  });
}
