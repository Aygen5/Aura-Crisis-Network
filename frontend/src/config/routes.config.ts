export const ROUTES = {
  HOME: "/",
  REPORTS: "/reports",
  RISK: "/risk",
  ANALYTICS: "/analytics",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
  LOGIN: "/login",
  SIGNUP: "/signup",
  EVENT_DETAIL: (id: string) => `/event/${id}`,
} as const;
