import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { AuraBadge, PanelCard, StatusDot } from "@/components/aura/primitives";
import { HasRole } from "@/components/aura/HasRole";
import { useEventById, useEscalateEvent, useActiveEvents } from "@/queries/useEventsQuery";
import { disasterMeta, fetchEventById, isAuthenticated, type EventDto } from "@/lib/api-client";

export const Route = createFileRoute("/event/$id")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ params }): Promise<{ event: EventDto }> => {
    try {
      const event = await fetchEventById(params.id);
      if (!event) throw notFound();
      return { event };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Olay Bulunamadı — Aura Crisis Network" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { event } = loaderData;
    const title = `${event.title} — ${event.district} | Aura Crisis Network`;
    return {
      meta: [
        { title },
        { name: "description", content: event.summary },
        { property: "og:title", content: title },
        { property: "og:description", content: event.summary },
      ],
    };
  },
  component: EventDetail,
});

function EventDetail() {
  const { event: initialEvent } = Route.useLoaderData() as { event: EventDto };
  const { data: event = initialEvent } = useEventById(initialEvent.id);
  const { data: allEvents = [] } = useActiveEvents();
  const escalateMutation = useEscalateEvent();

  const nearby = allEvents.filter((e) => e.id !== event.id).slice(0, 4);

  function handleEscalate() {
    escalateMutation.mutate(event.id);
  }

  const meta = disasterMeta[event.type] ?? disasterMeta.Earthquake;

  return (
    <AppShell
      title={event.title}
      description={`${event.district}, ${event.locationName} · ${event.source}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Komuta Merkezi
          </Link>
          <HasRole roles={["Operator", "Admin"]}>
            <button
              onClick={handleEscalate}
              disabled={escalateMutation.isPending}
              className="flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white transition-opacity duration-200 hover:bg-red-700 disabled:opacity-50"
            >
              {escalateMutation.isPending ? "Yükseltiliyor..." : "Seviyeyi Yükselt (Escalate)"}
            </button>
          </HasRole>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard className="overflow-hidden">
            <div className="flex items-start gap-4 p-6">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-current/25 bg-background/50"
                style={{ color: meta.color }}
              >
                <span className="h-7 w-7">
                  <DisasterIcon type={event.type} />
                </span>
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AuraBadge tone="info">{meta.label}</AuraBadge>
                  <AuraBadge tone={event.status === "Active" ? "critical" : "neutral"}>
                    <StatusDot tone={event.status === "Active" ? "critical" : "neutral"} pulse={false} />
                    {event.status}
                  </AuraBadge>
                  <span className="num text-[11px] text-muted-foreground">{event.id}</span>
                </div>
                <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
                  {event.summary}
                </p>
              </div>
              <div className="text-right">
                <div className="label-xs">{event.metricLabel}</div>
                <div className="num mt-1 text-3xl font-semibold text-primary">
                  {event.metric}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
              {[
                ["Şiddet İndeksi", `${event.severity}/100`],
                ["Kaynak", event.source],
                ["Tespit Zamanı", new Date(event.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
                ["Son Durum", event.status],
              ].map(([k, v]) => (
                <div key={k} className="bg-card px-6 py-4">
                  <div className="label-xs">{k}</div>
                  <div className="num mt-1 text-[15px] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard
            title="Harita Önizlemesi"
            action={
              <Link
                to="/"
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Haritada Aç <ExternalLink className="h-3 w-3" />
              </Link>
            }
          >
            <MapCanvas
              events={[event, ...nearby]}
              selectedId={event.id}
              className="h-[320px] w-full rounded-b-xl"
              compact
            />
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Afet Bilgileri">
            <dl className="divide-y divide-border">
              {[
                ["Koordinatlar", `${event.latitude.toFixed(4)}° N, ${event.longitude.toFixed(4)}° E`],
                ["İlçe", event.district],
                ["Konum", event.locationName],
                ["Doğrulama", "Gerçek Servis (Live API)"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-6 py-3">
                  <dt className="text-[12px] text-muted-foreground">{k}</dt>
                  <dd className="num text-[12px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelCard>

          <PanelCard title="Yakındaki Olaylar">
            <ul className="p-2">
              {nearby.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/event/$id"
                    params={{ id: e.id }}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors duration-200 hover:bg-secondary"
                  >
                    <span className="h-4 w-4 shrink-0" style={{ color: disasterMeta[e.type]?.color }}>
                      <DisasterIcon type={e.type} animated={false} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium">{e.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" /> {e.district}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </PanelCard>
        </div>
      </div>
    </AppShell>
  );
}
