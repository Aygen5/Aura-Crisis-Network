export type DisasterType =
  | "earthquake"
  | "flood"
  | "wildfire"
  | "landslide"
  | "medical"
  | "report";

export const disasterMeta: Record<
  DisasterType,
  { label: string; tone: "critical" | "warning" | "online" | "info" | "violet" }
> = {
  earthquake: { label: "Earthquake", tone: "critical" },
  wildfire: { label: "Wildfire", tone: "critical" },
  flood: { label: "Flood", tone: "warning" },
  landslide: { label: "Landslide", tone: "warning" },
  medical: { label: "Medical", tone: "info" },
  report: { label: "User Report", tone: "violet" },
};

export const toneClass = {
  critical: { text: "text-critical", bg: "bg-critical", ring: "ring-critical/30" },
  warning: { text: "text-warning", bg: "bg-warning", ring: "ring-warning/30" },
  online: { text: "text-online", bg: "bg-online", ring: "ring-online/30" },
  info: { text: "text-info", bg: "bg-info", ring: "ring-info/30" },
  violet: { text: "text-violet", bg: "bg-violet", ring: "ring-violet/30" },
} as const;

export type AuraEvent = {
  id: string;
  type: DisasterType;
  title: string;
  location: string;
  district: string;
  time: string;
  ago: string;
  metric: string;
  metricLabel: string;
  source: string;
  status: "Active" | "Monitoring" | "Resolved" | "Pending";
  severity: number; // 0-100
  x: number; // map position %
  y: number;
  summary: string;
};

export const events: AuraEvent[] = [
  {
    id: "EQ-8842",
    type: "earthquake",
    title: "M 4.6 Earthquake",
    location: "Marmara Sea",
    district: "Silivri Offshore",
    time: "10:12",
    ago: "3m",
    metric: "4.6",
    metricLabel: "Magnitude",
    source: "Kandilli",
    status: "Active",
    severity: 78,
    x: 26,
    y: 62,
    summary:
      "Shallow offshore rupture recorded 14 km south-west of Silivri. Depth 7.2 km. No structural damage reports received from district coordination yet.",
  },
  {
    id: "FL-2213",
    type: "flood",
    title: "Urban Flash Flood",
    location: "Istanbul",
    district: "Başakşehir",
    time: "09:54",
    ago: "21m",
    metric: "62 mm/h",
    metricLabel: "Rainfall",
    source: "Meteorology",
    status: "Active",
    severity: 64,
    x: 44,
    y: 40,
    summary:
      "Storm drain saturation across three neighbourhoods. Two underpasses closed by municipal teams.",
  },
  {
    id: "WF-0912",
    type: "wildfire",
    title: "Forest Fire",
    location: "Kocaeli",
    district: "Kartepe Ridge",
    time: "09:31",
    ago: "44m",
    metric: "18 ha",
    metricLabel: "Burn area",
    source: "AFAD",
    status: "Active",
    severity: 88,
    x: 78,
    y: 47,
    summary:
      "Wind-driven crown fire moving north-east at 6 km/h. Four aerial units and eleven ground crews assigned.",
  },
  {
    id: "LS-0331",
    type: "landslide",
    title: "Slope Failure",
    location: "Istanbul",
    district: "Beykoz",
    time: "08:58",
    ago: "1h 17m",
    metric: "Moderate",
    metricLabel: "Displacement",
    source: "AFAD",
    status: "Monitoring",
    severity: 41,
    x: 63,
    y: 28,
    summary:
      "Saturated embankment movement detected along the coastal access road. Sensor drift 4.1 cm over 6 hours.",
  },
  {
    id: "MD-1180",
    type: "medical",
    title: "Mass Casualty Standby",
    location: "Istanbul",
    district: "Kadıköy",
    time: "08:40",
    ago: "1h 35m",
    metric: "Level 2",
    metricLabel: "Triage",
    source: "112 Command",
    status: "Monitoring",
    severity: 33,
    x: 57,
    y: 63,
    summary: "Two hospitals placed on standby capacity following transit incident.",
  },
  {
    id: "UR-4402",
    type: "report",
    title: "Citizen Report — Gas Odour",
    location: "Istanbul",
    district: "Şişli",
    time: "08:22",
    ago: "1h 53m",
    metric: "7 reports",
    metricLabel: "Corroboration",
    source: "Mobile App",
    status: "Pending",
    severity: 22,
    x: 49,
    y: 52,
    summary: "Seven independent citizen submissions within a 400 m radius. Awaiting field verification.",
  },
  {
    id: "EQ-8839",
    type: "earthquake",
    title: "M 2.8 Earthquake",
    location: "Tekirdağ",
    district: "Marmara Ereğlisi",
    time: "07:58",
    ago: "2h 17m",
    metric: "2.8",
    metricLabel: "Magnitude",
    source: "Kandilli",
    status: "Resolved",
    severity: 18,
    x: 14,
    y: 70,
    summary: "Micro-seismic event, not felt at surface level.",
  },
  {
    id: "FL-2208",
    type: "flood",
    title: "River Level Warning",
    location: "Sakarya",
    district: "Adapazarı",
    time: "07:05",
    ago: "3h 10m",
    metric: "+1.4 m",
    metricLabel: "Level rise",
    source: "Meteorology",
    status: "Monitoring",
    severity: 52,
    x: 89,
    y: 34,
    summary: "Sustained upstream discharge pushing river gauge toward the first warning threshold.",
  },
];

export const services = [
  { name: "AFAD API", latency: "42 ms" },
  { name: "Kandilli API", latency: "61 ms" },
  { name: "Meteorology API", latency: "88 ms" },
  { name: "SignalR", latency: "12 ms" },
  { name: "Background Worker", latency: "queue 0" },
];

export const layers = [
  { key: "heatmap", label: "Heatmap" },
  { key: "risk", label: "Risk Areas" },
  { key: "earthquake", label: "Earthquakes" },
  { key: "flood", label: "Floods" },
  { key: "wildfire", label: "Wildfires" },
  { key: "report", label: "User Reports" },
  { key: "traffic", label: "Traffic Layer" },
] as const;

export const reports = [
  { id: "R-10241", type: "flood", title: "Basement flooding, 3 buildings", district: "Bağcılar", reporter: "M. Aydın", time: "10:04", status: "Pending" },
  { id: "R-10240", type: "wildfire", title: "Smoke column over ridge line", district: "Kartepe", reporter: "Field Unit 7", time: "09:47", status: "Verified" },
  { id: "R-10239", type: "earthquake", title: "Cracks on load-bearing wall", district: "Avcılar", reporter: "S. Demir", time: "09:31", status: "Pending" },
  { id: "R-10238", type: "report", title: "Gas odour in residential block", district: "Şişli", reporter: "Anonymous", time: "09:12", status: "Rejected" },
  { id: "R-10237", type: "landslide", title: "Road shoulder collapse", district: "Beykoz", reporter: "Traffic Control", time: "08:55", status: "Verified" },
  { id: "R-10236", type: "medical", title: "Ambulance access blocked", district: "Kadıköy", reporter: "112 Dispatch", time: "08:39", status: "Verified" },
  { id: "R-10235", type: "flood", title: "Underpass water level rising", district: "Başakşehir", reporter: "Municipal Team", time: "08:20", status: "Pending" },
  { id: "R-10234", type: "earthquake", title: "Felt report cluster", district: "Silivri", reporter: "Aggregated", time: "07:58", status: "Rejected" },
] as { id: string; type: DisasterType; title: string; district: string; reporter: string; time: string; status: "Pending" | "Verified" | "Rejected" }[];
