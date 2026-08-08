import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, ExternalLink, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/queries/useNotificationsQuery";
import { useAuth } from "@/providers/AuthProvider";
import type { NotificationType } from "@/types";
import { cn } from "@/lib/utils";

const typeToneMap: Record<NotificationType, { color: string; icon: any }> = {
  CriticalEvent: { color: "text-red-400 bg-red-500/10 border-red-500/30", icon: AlertTriangle },
  ReportStatusChanged: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  EmergencyDispatch: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", icon: ShieldAlert },
  SystemAlert: { color: "text-sky-400 bg-sky-500/10 border-sky-500/30", icon: Info },
};

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { authenticated } = useAuth();

  const { data: notifications = [] } = useUserNotifications(20);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!authenticated) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Bildirimler"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-critical px-1 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-2xl backdrop-blur-2xl animate-scale-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold">Bildirim Merkezi</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {unreadCount} Okunmamış
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Tümünü Okundu Yap
              </button>
            )}
          </div>

          <div className="scroll-slim my-2 max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-muted-foreground">
                Henüz yeni bir bildirim yok.
              </div>
            ) : (
              notifications.map((n) => {
                const tone = typeToneMap[n.type] ?? typeToneMap.SystemAlert;
                const IconComponent = tone.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                    className={cn(
                      "group relative flex gap-3 rounded-lg border p-3 transition-all duration-200 cursor-pointer",
                      n.isRead
                        ? "border-transparent bg-foreground/[0.02] opacity-70 hover:bg-foreground/[0.05]"
                        : "border-border/80 bg-foreground/[0.06] hover:border-border"
                    )}
                  >
                    <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", tone.color)}>
                      <IconComponent className="h-4 w-4" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate text-[12px] font-medium group-hover:text-primary transition-colors">
                          {n.title}
                        </span>
                        <span className="num text-[10px] text-muted-foreground shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                    </div>

                    {!n.isRead && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border pt-2 text-center">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Tüm Bildirim Geçmişini Aç <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
