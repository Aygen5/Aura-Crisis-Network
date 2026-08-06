export interface ComponentHealthDto {
  name: string;
  status: string;
  latencyMs: number;
  description?: string;
  error?: string;
}

export interface SystemHealthDto {
  overallStatus: string;
  totalLatencyMs: number;
  checkedAt: string;
  memoryUsageMb: number;
  activeSignalRConnections: number;
  components: ComponentHealthDto[];
}
