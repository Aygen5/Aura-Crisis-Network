import type { DisasterType } from "@/types";

export const disasterMeta: Record<DisasterType, { label: string; icon: string; color: string; badgeClass: string }> = {
  Earthquake: { label: "Deprem", icon: "Activity", color: "#ef4444", badgeClass: "bg-red-500/10 text-red-400 border-red-500/20" },
  Flood: { label: "Sel / Taşkın", icon: "Waves", color: "#0ea5e9", badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  Wildfire: { label: "Orman Yangını", icon: "Flame", color: "#f97316", badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  Landslide: { label: "Heyelan", icon: "Mountain", color: "#eab308", badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Medical: { label: "Tıbbi Tahliye", icon: "Cross", color: "#ec4899", badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  Report: { label: "Saha İhbarı", icon: "Radio", color: "#a855f7", badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
};
