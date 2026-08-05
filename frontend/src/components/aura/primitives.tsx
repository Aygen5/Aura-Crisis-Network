import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Tone = "critical" | "warning" | "online" | "info" | "violet" | "neutral";

const toneText: Record<Tone, string> = {
  critical: "text-critical",
  warning: "text-warning",
  online: "text-online",
  info: "text-info",
  violet: "text-violet",
  neutral: "text-muted-foreground",
};

const toneBg: Record<Tone, string> = {
  critical: "bg-critical",
  warning: "bg-warning",
  online: "bg-online",
  info: "bg-info",
  violet: "bg-violet",
  neutral: "bg-muted-foreground",
};

const toneSoft: Record<Tone, string> = {
  critical: "bg-critical/10 text-critical border-critical/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  online: "bg-online/10 text-online border-online/25",
  info: "bg-info/10 text-info border-info/25",
  violet: "bg-violet/10 text-violet border-violet/25",
  neutral: "bg-secondary text-muted-foreground border-border",
};

export function AuraBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-tight",
        toneSoft[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  tone = "online",
  pulse = true,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative flex h-2 w-2 shrink-0", className)}>
      {pulse && (
        <span
          className={cn("absolute inset-0 rounded-full opacity-60 animate-ping-slow", toneBg[tone])}
        />
      )}
      <span className={cn("relative h-2 w-2 rounded-full", toneBg[tone])} />
    </span>
  );
}

export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass group rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-6">
        <span className="label-xs">{label}</span>
        {icon ? <span className={cn("h-3.5 w-3.5", toneText[tone])}>{icon}</span> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("num text-2xl font-semibold", toneText[tone])}>{value}</span>
        {delta && <span className="num text-[11px] text-muted-foreground">{delta}</span>}
      </div>
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("label-xs", className)}>{children}</div>;
}

export function PanelCard({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("panel rounded-xl", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export { toneText, toneBg, toneSoft };
