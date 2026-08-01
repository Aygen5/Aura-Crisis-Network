import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react";
import { AppShell } from "@/components/aura/AppShell";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { AuraBadge, PanelCard, StatusDot, toneText } from "@/components/aura/primitives";
import { disasterMeta, events, type AuraEvent } from "@/lib/aura-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/event/$id")({
  loader: ({ params }): { event: AuraEvent } => {
    const event = events.find((e) => e.id === params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Event unavailable — Aura Crisis Network" },
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

const timeline = [
  { time: "10:12", label: "Event detected", detail: "Automatic ingest from source feed" },
  { time: "10:13", label: "Severity classified", detail: "Model confidence 0.94" },
  { time: "10:15", label: "District teams notified", detail: "6 units acknowledged" },
  { time: "10:22", label: "Field verification started", detail: "Two ground crews en route" },
];

function EventDetail() {
  const { event } = Route.useLoaderData() as { event: AuraEvent };
  const tone = disasterMeta[event.type].tone;
  const nearby = events.filter((e) => e.id !== event.id).slice(0, 4);

  return (
    <AppShell
      title={event.title}
      description={`${event.district}, ${event.location} · ${event.source} · ${event.time}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Command Center
          </Link>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-[13px] font-medium text-background transition-opacity duration-200 hover:opacity-90">
            Escalate
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PanelCard className="overflow-hidden">
            <div className="flex items-start gap-4 p-6">
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-xl border border-current/25",
                  toneText[tone],
                )}
              >
                <span className="h-7 w-7">
                  <DisasterIcon type={event.type} />
                </span>
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AuraBadge tone={tone}>{disasterMeta[event.type].label}</AuraBadge>
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
                <div className={cn("num mt-1 text-3xl font-semibold", toneText[tone])}>
                  {event.metric}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
              {[
                ["Severity index", `${event.severity}/100`],
                ["Source", event.source],
                ["First detected", event.time],
                ["Last update", `${event.ago} ago`],
              ].map(([k, v]) => (
                <div key={k} className="bg-card px-6 py-4">
                  <div className="label-xs">{k}</div>
                  <div className="num mt-1 text-[15px] font-medium">{v}</div>
                </div>
              ))}
            </div>
          </PanelCard>

          <PanelCard
            title="Map Preview"
            action={
              <Link
                to="/"
                className="flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Open in map <ExternalLink className="h-3 w-3" />
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

          <PanelCard title="Timeline">
            <ol className="p-6">
              {timeline.map((t, i) => (
                <li key={t.time} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 && (
                    <span className="absolute left-[7px] top-4 h-full w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background",
                      i === 0 ? "bg-critical" : "bg-border",
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium">{t.label}</span>
                      <span className="num text-[11px] text-muted-foreground">{t.time}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">{t.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </PanelCard>
        </div>

        <div className="space-y-6">
          <PanelCard title="Disaster Information">
            <dl className="divide-y divide-border">
              {[
                ["Coordinates", "41.0743° N, 28.2196° E"],
                ["Depth", "7.2 km"],
                ["Affected radius", "18 km"],
                ["Population exposure", "412,000"],
                ["Assigned units", "11"],
                ["Verification", "Dual-source"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-6 py-3">
                  <dt className="text-[12px] text-muted-foreground">{k}</dt>
                  <dd className="num text-[12px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </PanelCard>

          <PanelCard title="Nearby Events">
            <ul className="p-2">
              {nearby.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/event/$id"
                    params={{ id: e.id }}
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors duration-200 hover:bg-secondary"
                  >
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0",
                        toneText[disasterMeta[e.type].tone],
                      )}
                    >
                      <DisasterIcon type={e.type} animated={false} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium">{e.title}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" /> {e.district}
                      </span>
                    </span>
                    <span className="num text-[11px] text-muted-foreground">{e.ago}</span>
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
