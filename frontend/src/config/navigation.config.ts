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
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "reports-center",
    title: "İhbar Yönetimi",
    route: ROUTES.REPORTS,
    icon: "FileWarning",
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "risk-analysis",
    title: "Risk Analizi",
    route: ROUTES.RISK,
    icon: "Activity",
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "analytics",
    title: "Analitik",
    route: ROUTES.ANALYTICS,
    icon: "BarChart3",
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
  {
    id: "settings",
    title: "Ayarlar",
    route: ROUTES.SETTINGS,
    icon: "Settings",
    showInSidebar: true,
    showInMobile: true,
    showInHeader: true,
  },
];
