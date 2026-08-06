import { ROUTES } from "./routes.config";
import type { UserRole } from "@/types";

export interface NavItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  requiredRoles?: UserRole[];
  showInSidebar: boolean;
  showInMobile: boolean;
  showInHeader: boolean;
}

export const NAVIGATION_CONFIG: NavItem[] = [
  {
    id: "command-center",
    title: "Komuta Merkezi",
    route: ROUTES.HOME,
    icon: "LayoutDashboard",
    requiredRoles: ["Citizen", "Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "reports-center",
    title: "İhbar Yönetimi",
    route: ROUTES.REPORTS,
    icon: "FileWarning",
    requiredRoles: ["Citizen", "Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "notifications-center",
    title: "Bildirimler",
    route: ROUTES.NOTIFICATIONS,
    icon: "Bell",
    requiredRoles: ["Citizen", "Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "risk-analysis",
    title: "Risk Analizi",
    route: ROUTES.RISK,
    icon: "Activity",
    requiredRoles: ["Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "analytics",
    title: "Analitik",
    route: ROUTES.ANALYTICS,
    icon: "BarChart3",
    requiredRoles: ["Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "audit-logs",
    title: "Denetim İzi",
    route: "/audit-logs",
    icon: "ShieldCheck",
    requiredRoles: ["Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "system-health",
    title: "Sistem Sağlığı",
    route: "/system-health",
    icon: "Activity",
    requiredRoles: ["Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "settings",
    title: "Ayarlar",
    route: ROUTES.SETTINGS,
    icon: "Settings",
    requiredRoles: ["Citizen", "Operator", "Admin"],
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
];
