export const QUERY_KEYS = {
  events: {
    all: ["events"] as const,
    active: () => ["events", "active"] as const,
    detail: (id: string) => ["events", id] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    summary: () => ["analytics", "summary"] as const,
  },
  emergencyUnits: {
    all: ["emergency-units", "all"] as const,
    nearest: (lat: number | null, lng: number | null, count: number, typeFilter?: string) =>
      ["emergency-units", "nearest", lat, lng, count, typeFilter] as const,
  },
  reports: {
    all: ["reports"] as const,
    byStatus: (status: string) => ["reports", status] as const,
  },
  riskZones: {
    all: ["risk-zones"] as const,
    intersects: (lat: number, lng: number) => ["risk-zones", "intersects", lat, lng] as const,
    buffer: (lat: number, lng: number, radius: number) => ["risk-zones", "buffer", lat, lng, radius] as const,
  },
  gis: {
    all: ["gis"] as const,
    clusters: (minLat?: number, minLng?: number, maxLat?: number, maxLng?: number, zoom?: number) =>
      ["gis", "clusters", minLat, minLng, maxLat, maxLng, zoom] as const,
  },
  notifications: {
    all: ["notifications"] as const,
  },
} as const;

export const QUERY_CACHE_TTL = {
  EVENTS_ACTIVE: 120000,
  ANALYTICS_SUMMARY: 300000,
  EMERGENCY_UNITS_ALL: 15000,
  RISK_ZONES: 1800000,
  GIS_CLUSTERS: 30000,
  REPORTS: 60000,
} as const;
