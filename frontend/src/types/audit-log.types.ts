export interface AuditLogDto {
  id: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  requestId?: string;
  entityName: string;
  action: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  changedColumns?: string;
  createdAt: string;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AuditLogFilterParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  entityName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
