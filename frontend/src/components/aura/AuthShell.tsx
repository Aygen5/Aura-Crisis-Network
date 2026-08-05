import type { ReactNode } from "react";
import { BaseMap } from "./MapCanvas";


export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute inset-0 scale-110 opacity-60 blur-[14px]">
        <BaseMap labels={false} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-background/70" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-critical/10 blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-info/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[420px] animate-scale-in">{children}</div>
    </div>
  );
}

export function AuthField({
  label,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[12px] font-medium text-foreground/90">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-background/60 px-3 text-[13px] outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-ring"
      />
    </div>
  );
}
