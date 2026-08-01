import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldAlert, TriangleAlert } from "lucide-react";
import { StatusDot } from "@/components/aura/primitives";
import { AuthShell, AuthField } from "@/components/aura/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Secure operator sign-in for the Aura Crisis Network emergency coordination platform.",
      },
      { property: "og:title", content: "Sign in — Aura Crisis Network" },
      { property: "og:description", content: "Secure operator access to the crisis command center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  return (
    <AuthShell>
      <div className="glass rounded-xl p-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-critical/25 bg-critical/10 text-critical">
            <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <div className="label-xs">Aura Crisis Network</div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight">Sign in to your account</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Access restricted to authorized personnel only
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <AuthField label="Email Address" placeholder="officer@afad.gov.tr" type="email" />
          <AuthField label="Password" placeholder="••••••••••••" type="password" />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-border bg-transparent accent-foreground"
              />
              Keep me signed in
            </label>
            <button type="button" className="text-[12px] text-muted-foreground hover:text-foreground">
              Forgot password
            </button>
          </div>

          <Link
            to="/"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[13px] font-medium text-background transition-all duration-200 hover:opacity-90"
          >
            Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </form>

        <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/[0.07] px-3.5 py-3">
          <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={1.8} />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            <span className="font-medium text-warning">DEMO ACCESS:</span> Use any email and password
            to enter the platform.
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Hardware key required for privileged operations
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-medium text-foreground hover:underline">
          Request access (Sign up)
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <StatusDot tone="online" pulse={false} />
        All coordination services operational
      </div>
    </AuthShell>
  );
}
