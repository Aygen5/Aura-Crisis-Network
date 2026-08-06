import { httpClient } from "@/lib/http-client";
import type { SystemHealthDto } from "@/types";

export const healthService = {
  getSystemHealth: (): Promise<SystemHealthDto> => {
    return httpClient<SystemHealthDto>("/health");
  },
};
