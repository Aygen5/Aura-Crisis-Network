import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  FileWarning,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ServerCog,
  X,
} from "lucide-react";
import { MapCanvas } from "@/components/aura/MapCanvas";
import { DisasterIcon } from "@/components/aura/DisasterIcon";
import { TopNav } from "@/components/aura/AppShell";
import { AuraBadge, StatCard, StatusDot, toneText, type Tone } from "@/components/aura/primitives";
import { disasterMeta, events, layers, services } from "@/lib/aura-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Realtime crisis command center for emergency response teams: live disaster feed, risk layers, system health and chronological replay over Istanbul and Türkiye.",
      },
      { property: "og:title", content: "Command Center — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Realtime disaster monitoring and coordination for emergency response centers.",
      },
    ],
  }),
  component: CommandCenter,
});

const windows = ["24 Hours", "72 Hours", "7 Days"];
const speeds = ["1x", "2x", "5x"];

type Note = { id: number; tone: Tone; title: string; body: string };

const seedNotifications: Note[] = [
  { id: 1, tone: "critical", title: "Aerial support dispatched", body: "Kartepe wildfire · 2 units" },
  { id: 2, tone: "info", title: "Kandilli feed resynced", body: "Latency normalised to 61 ms" },
];

function CommandCenter() {
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({
    heatmap: true,
    risk: true,
    earthquake: true,
    flood: true,
    wildfire: true,
    report: true,
    traffic: false,
  });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(64);
  const [win, setWin] = useState("24 Hours");
  const [speed, setSpeed] = useState("1x");
  const [notes, setNotes] = useState(seedNotifications);

  useEffect(() => {
    if (!playing) return;
    const step = speed === "1x" ? 0.4 : speed === "2x" ? 0.9 : 2.2;
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + step)), 60);
    return () => clearInterval(t);
  }, [playing, speed]);

  useEffect(() => {
    const t = setTimeout(
      () =>
        setNotes((n) => [
          {
            id: Date.now(),
            tone: "warning",
            title: "New citizen report cluster",
            body: "Başakşehir · 4 submissions in 90s",
          },
          ...n,
        ]),
      3200,
    );
    return () => clearTimeout(t);
  }, []);

  const selectedEvent = events.find((e) => e.id === selected) ?? null;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      <MapCanvas
        events={events}
        active={active}
        selectedId={selected}
        onSelect={(e) => setSelected(e.id)}
        className="absolute inset-0 h-full w-full"
      />

      <TopNav floating />

      <div className="pointer-events-none absolute left-[392px] right-[332px] top-[76px] z-30 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard className="pointer-events-auto" label="Today's Events" value="38" delta="+6 vs yesterday" icon={<Activity className="h-3.5 w-3.5" />} />
        <StatCard className="pointer-events-auto" label="Active Risks" value="7" tone="critical" delta="3 critical" icon={<AlertTriangle className="h-3.5 w-3.5" />} />
        <StatCard className="pointer-events-auto" label="Pending Reports" value="12" tone="warning" delta="avg 4m" icon={<FileWarning className="h-3.5 w-3.5" />} />
        <StatCard className="pointer-events-auto" label="Online Services" value="5/5" tone="online" delta="100% uptime" icon={<ServerCog className="h-3.5 w-3.5" />} />
      </div>

  
      <aside className="absolute bottom-28 left-6 top-[76px] z-30 flex w-[352px] flex-col overflow-hidden rounded-xl glass animate-fade-in">
        <header className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <StatusDot tone="online" />
            <h2 className="text-[13px] font-semibold">Live Event Feed</h2>
          </div>
          <span className="num text-[11px] text-muted-foreground">{events.length} active</span>
        </header>

        <div className="scroll-slim flex-1 overflow-y-auto p-2">
          {events.map((e) => {
            const tone = disasterMeta[e.type].tone;
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                className={cn(
                  "group mb-1 flex w-full gap-3 rounded-lg border border-transparent p-3 text-left transition-all duration-200 hover:border-border hover:bg-foreground/[0.04]",
                  selected === e.id && "border-border bg-foreground/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-current/25",
                    toneText[tone],
                  )}
                >
                  <span className="h-4 w-4">
                    <DisasterIcon type={e.type} />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium">{e.title}</span>
                    <span className="num shrink-0 text-[11px] text-muted-foreground">{e.ago}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                    {e.district}, {e.location}
                  </span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className={cn("num text-[12px] font-semibold", toneText[tone])}>
                      {e.metric}
                    </span>
                    <span className="text-[11px] text-muted-foreground">· {e.source}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

   
      <div className="absolute bottom-28 right-6 top-[76px] z-30 flex w-[300px] flex-col gap-3">
        {/* System status */}
        <section className="glass rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">System Status</h2>
            <AuraBadge tone="online">All operational</AuraBadge>
          </div>
          <ul className="mt-3 space-y-2">
            {services.map((s) => (
              <li key={s.name} className="flex items-center gap-2 text-[12px]">
                <StatusDot tone="online" pulse={false} />
                <span className="flex-1 text-foreground/90">{s.name}</span>
                <span className="num text-[11px] text-muted-foreground">{s.latency}</span>
              </li>
            ))}
          </ul>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-critical px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-critical/90 hover:shadow-[0_0_0_4px_color-mix(in_oklab,var(--critical)_18%,transparent)]">
            <Plus className="h-4 w-4" />
            Create Emergency Report
          </button>
        </section>

        <section className="glass flex min-h-0 flex-1 flex-col rounded-xl">
          <header className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <h2 className="text-[13px] font-semibold">Notification Center</h2>
            <span className="label-xs">SignalR</span>
          </header>
          <div className="scroll-slim flex-1 space-y-2 overflow-y-auto p-3">
            {notes.map((n) => (
              <article
                key={n.id}
                className="animate-slide-in rounded-lg border border-white/8 bg-foreground/[0.03] p-3"
              >
                <div className="flex items-start gap-2">
                  <StatusDot tone={n.tone} className="mt-1.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium">{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

   
        <section className="glass rounded-xl p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="label-xs">Map Layers</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {layers.map((l) => {
              const on = active[l.key];
              return (
                <button
                  key={l.key}
                  onClick={() => setActive((a) => ({ ...a, [l.key]: !a[l.key] }))}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-all duration-200",
                    on
                      ? "border-foreground/20 bg-foreground/8 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-foreground/5",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      on ? "bg-online" : "bg-muted-foreground/40",
                    )}
                  />
                  {l.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="absolute bottom-6 left-[392px] right-[332px] z-30">
        <div className="glass flex items-center gap-4 rounded-xl px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-200 hover:scale-105"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={() => {
                setProgress(0);
                setPlaying(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition-colors duration-200 hover:bg-foreground/8 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="num">Replay · {win}</span>
              <span className="num">{Math.round(progress)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="mt-1.5 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-foreground [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
              style={{
                background: `linear-gradient(to right, var(--foreground) ${progress}%, var(--border) ${progress}%)`,
              }}
            />
          </div>

          <Segmented options={windows} value={win} onChange={setWin} />
          <Segmented options={speeds} value={speed} onChange={setSpeed} />
        </div>
      </div>

   
      <div className="glass absolute bottom-7 left-6 z-30 hidden rounded-xl p-3 2xl:block">
        <span className="label-xs">Legend</span>
        <ul className="mt-2 space-y-1.5">
          {(Object.keys(disasterMeta) as (keyof typeof disasterMeta)[]).map((k) => (
            <li key={k} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className={cn("h-3 w-3", toneText[disasterMeta[k].tone])}>
                <DisasterIcon type={k} animated={false} />
              </span>
              {disasterMeta[k].label}
            </li>
          ))}
        </ul>
      </div>

      {selectedEvent && (
        <div className="glass absolute bottom-28 left-1/2 z-40 w-[420px] -translate-x-1/2 rounded-xl p-5 animate-scale-in">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border border-current/25",
                toneText[disasterMeta[selectedEvent.type].tone],
              )}
            >
              <span className="h-5 w-5">
                <DisasterIcon type={selectedEvent.type} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold">{selectedEvent.title}</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {selectedEvent.district}, {selectedEvent.location} · {selectedEvent.time}
              </p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            {selectedEvent.summary}
          </p>
          <Link
            to="/event/$id"
            params={{ id: selectedEvent.id }}
            className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-white/12 bg-foreground/5 py-2 text-[13px] font-medium transition-colors duration-200 hover:bg-foreground/10"
          >
            Open Event Details <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="hidden items-center gap-0.5 rounded-lg border border-white/10 p-0.5 lg:flex">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] transition-colors duration-200",
            value === o
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
