import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Search, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusDot } from "./primitives";

const nav = [
  { to: "/", label: "Command Center" },
  { to: "/reports", label: "Report Center" },
  { to: "/risk", label: "Risk Analysis" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
] as const;

export function AuraLogo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-critical/12 text-critical">
        <span className="absolute inset-0 rounded-lg border border-critical/30" />
        <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span className="text-[13px] font-semibold tracking-tight">
        Aura<span className="text-muted-foreground"> Crisis Network</span>
      </span>
    </Link>
  );
}

export function TopNav({ floating = false }: { floating?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className={cn(
        "z-40 flex h-14 items-center gap-6 px-6",
        floating
          ? "glass absolute inset-x-0 top-0 rounded-none border-x-0 border-t-0"
          : "sticky top-0 border-b border-border bg-background/85 backdrop-blur-xl",
      )}
    >
      <AuraLogo />

      <nav className="hidden items-center gap-1 lg:flex">
        {nav.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] transition-colors duration-200",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <label className="group hidden h-9 w-80 items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 transition-colors duration-200 focus-within:border-ring md:flex">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            placeholder="Search city, district or coordinates"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </label>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-critical" />
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-secondary">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold">
            EK
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[12px] font-medium">E. Karaca</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <StatusDot pulse={false} className="h-1.5 w-1.5" /> Duty Officer
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="mx-auto w-full max-w-[1440px] px-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1.5 text-[13px] text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
        <div className="mt-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
