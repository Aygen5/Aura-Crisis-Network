import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/aura/AppShell";
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Configure operator profile, appearance, notification routing, map preferences and account security for Aura Crisis Network.",
      },
      { property: "og:title", content: "Settings — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Operator profile, notifications, map preferences and account security.",
      },
    ],
  }),
  component: Settings,
});

const sections = ["Profile", "Appearance", "Notifications", "Map Preferences", "Account"] as const;

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-200",
        on ? "border-online/40 bg-online/25" : "border-border bg-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-200",
          on ? "left-4.5 bg-online" : "left-0.5 bg-muted-foreground",
        )}
      />
    </button>
  );
}

function Row({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-8 border-b border-border px-6 py-4 last:border-0">
      <div>
        <div className="text-[13px] font-medium">{title}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Settings() {
  const [tab, setTab] = useState<(typeof sections)[number]>("Profile");
  const [flags, setFlags] = useState<Record<string, boolean>>({
    critical: true,
    digest: false,
    sound: true,
    labels: true,
    terrain: false,
    cluster: true,
  });
  const set = (k: string) => (v: boolean) => setFlags((f) => ({ ...f, [k]: v }));

  return (
    <AppShell title="Settings" description="Workspace and operator preferences.">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-200",
                tab === s
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </nav>

        <div className="max-w-3xl animate-fade-in space-y-6">
          {tab === "Profile" && (
            <PanelCard title="Profile">
              <div className="flex items-center gap-4 border-b border-border px-6 py-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-[15px] font-semibold">
                  EK
                </span>
                <div>
                  <div className="text-[14px] font-medium">Elif Karaca</div>
                  <div className="text-[12px] text-muted-foreground">
                    Duty Officer · Istanbul Coordination
                  </div>
                </div>
                <AuraBadge tone="online" className="ml-auto">
                  On shift
                </AuraBadge>
              </div>
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                {[
                  ["Full name", "Elif Karaca"],
                  ["Operator ID", "AFAD-34-2291"],
                  ["Email", "e.karaca@afad.gov.tr"],
                  ["Phone", "+90 5•• ••• 41 08"],
                ].map(([l, v]) => (
                  <label key={l} className="block">
                    <span className="mb-2 block text-[12px] font-medium">{l}</span>
                    <input
                      defaultValue={v}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none transition-colors duration-200 focus:border-ring"
                    />
                  </label>
                ))}
              </div>
            </PanelCard>
          )}

          {tab === "Appearance" && (
            <PanelCard title="Appearance">
              <div className="grid gap-3 p-6 sm:grid-cols-3">
                {["Command Dark", "Contrast Dark", "System"].map((t, i) => (
                  <button
                    key={t}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors duration-200",
                      i === 0 ? "border-foreground/30 bg-secondary" : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <span className="block h-14 rounded-md border border-border bg-background" />
                    <span className="mt-3 block text-[12px] font-medium">{t}</span>
                  </button>
                ))}
              </div>
              <Row title="Reduced motion" desc="Disable panel and marker animations.">
                <Toggle on={false} onChange={() => {}} />
              </Row>
              <Row title="Compact density" desc="Tighter row height across tables and feeds.">
                <Toggle on={flags.cluster} onChange={set("cluster")} />
              </Row>
            </PanelCard>
          )}

          {tab === "Notifications" && (
            <PanelCard title="Notifications">
              <Row title="Critical alerts" desc="Earthquake, wildfire and mass casualty events.">
                <Toggle on={flags.critical} onChange={set("critical")} />
              </Row>
              <Row title="Daily digest" desc="Summary of resolved events at 08:00.">
                <Toggle on={flags.digest} onChange={set("digest")} />
              </Row>
              <Row title="Audio cue" desc="Play a tone when a critical alert arrives.">
                <Toggle on={flags.sound} onChange={set("sound")} />
              </Row>
            </PanelCard>
          )}

          {tab === "Map Preferences" && (
            <PanelCard title="Map Preferences">
              <Row title="District labels" desc="Show administrative boundaries and names.">
                <Toggle on={flags.labels} onChange={set("labels")} />
              </Row>
              <Row title="Terrain shading" desc="Render elevation relief under the base layer.">
                <Toggle on={flags.terrain} onChange={set("terrain")} />
              </Row>
              <Row title="Marker clustering" desc="Group dense markers when zoomed out.">
                <Toggle on={flags.cluster} onChange={set("cluster")} />
              </Row>
              <Row title="Default location" desc="Map centre on session start.">
                <select className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring">
                  <option>Istanbul, Türkiye</option>
                  <option>Marmara Region</option>
                  <option>Türkiye (national)</option>
                </select>
              </Row>
            </PanelCard>
          )}

          {tab === "Account" && (
            <PanelCard title="Account">
              <Row title="Two-factor authentication" desc="Hardware key enrolled · YubiKey 5C.">
                <AuraBadge tone="online">Enabled</AuraBadge>
              </Row>
              <Row title="Active sessions" desc="2 devices signed in.">
                <button className="h-9 rounded-lg border border-border px-3 text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
                  Manage
                </button>
              </Row>
              <Row title="Revoke access" desc="Sign out of every device immediately.">
                <button className="h-9 rounded-lg border border-critical/30 bg-critical/10 px-3 text-[12px] font-medium text-critical transition-colors duration-200 hover:bg-critical/20">
                  Revoke all
                </button>
              </Row>
            </PanelCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
