import type { UserRole } from "@/types";

export const PERMISSIONS = {
  CAN_ESCALATE_EVENTS: ["Operator", "Admin"] as UserRole[],
  CAN_UPDATE_REPORT_STATUS: ["Operator", "Admin"] as UserRole[],
  CAN_VIEW_ANALYTICS: ["Citizen", "Operator", "Admin"] as UserRole[],
} as const;
