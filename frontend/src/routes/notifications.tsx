import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCheck, Filter, AlertTriangle, Info, CheckCircle2, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import {
  useUserNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/queries/useNotificationsQuery";
import { isAuthenticated } from "@/lib/api-client";
import type { NotificationType } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "Notification Center — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Realtime emergency notification center: review system alerts, critical disaster dispatches and field report status changes.",
      },
      { property: "og:title", content: "Notification Center — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Track emergency alerts and notifications in real time.",
      },
    ],
  }),
  component: NotificationCenter,
});

type FilterTab = "All" | "Unread" | "Critical" | "System";

const filterTabs: FilterTab[] = ["All", "Unread", "Critical", "System"];

const typeToneMap: Record<NotificationType, { label: string; tone: "critical" | "warning" | "info" | "online"; icon: any }> = {
  CriticalEvent: { label: "Kritik Afet", tone: "critical", icon: AlertTriangle },
  ReportStatusChanged: { label: "İhbar Güncelleme", tone: "online", icon: CheckCircle2 },
  EmergencyDispatch: { label: "Acil Görev", tone: "warning", icon: ShieldAlert },
  SystemAlert: { label: "Sistem İkazı", tone: "info", icon: Info },
};

function NotificationCenter() {
  const [tab, setTab] = useState<FilterTab>("All");
  const { data: notifications = [], refetch } = useUserNotifications(50);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (tab === "Unread") return !n.isRead;
      if (tab === "Critical") return n.type === "CriticalEvent" || n.type === "EmergencyDispatch";
      if (tab === "System") return n.type === "SystemAlert";
      return true;
    });
  }, [tab, notifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return (
    <AppShell
      title="Bildirim Yönetim Merkezi"
      description="Sistem ve saha bildirimlerinin anlık takibi, filtrelenmesi ve geçmiş kaydı."
      actions={
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              className="flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-[13px] font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
            >
              <CheckCheck className="h-4 w-4" /> Tümünü Okundu Yap ({unreadCount})
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            Yenile
          </button>
        </div>
      }
    >
      <PanelCard className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {filterTabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[12px] transition-colors duration-200",
                  tab === t
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
                <span className="num ml-1.5 text-[11px] text-muted-foreground">
                  {t === "All"
                    ? notifications.length
                    : t === "Unread"
                      ? unreadCount
                      : notifications.filter((n) =>
                          t === "Critical"
                            ? n.type === "CriticalEvent" || n.type === "EmergencyDispatch"
                            : n.type === "SystemAlert"
                        ).length}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="label-xs flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Toplam {filtered.length} bildirim gösteriliyor
            </span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-muted-foreground">
              Seçilen filtreye ait bildirim bulunmamaktadır.
            </div>
          ) : (
            filtered.map((n) => {
              const meta = typeToneMap[n.type] ?? typeToneMap.SystemAlert;
              const IconComp = meta.icon;

              return (
                <article
                  key={n.id}
                  onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                  className={cn(
                    "flex items-start gap-4 px-6 py-4 transition-colors duration-200 cursor-pointer hover:bg-secondary/40",
                    !n.isRead && "bg-foreground/[0.03]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/25 bg-background/50"
                    )}
                  >
                    <IconComp className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <AuraBadge tone={meta.tone}>{meta.label}</AuraBadge>
                      <span className="num text-[11px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
                      </span>
                      {!n.isRead && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Yeni
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 text-[14px] font-semibold tracking-tight">{n.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{n.message}</p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markReadMutation.mutate(n.id);
                      }}
                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      Okundu İşaretle
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </PanelCard>
    </AppShell>
  );
}
