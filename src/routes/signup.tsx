import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { AuthShell, AuthField } from "@/components/aura/AuthShell";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Register Operator — Aura Crisis Network" },
      {
        name: "description",
        content:
          "Request operator access to Aura Crisis Network. Submit your unit, badge number and credentials for central coordination approval.",
      },
      { property: "og:title", content: "Register Operator — Aura Crisis Network" },
      {
        property: "og:description",
        content: "Submit your credentials for central coordination approval.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  return (
    <AuthShell>
      <div className="glass rounded-xl p-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-critical/25 bg-critical/10 text-critical">
            <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <div className="label-xs">Aura Crisis Network</div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight">Register New Operator</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Submit your credentials for central coordination approval.
            </p>
          </div>
        </div>

        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <AuthField label="Full Name" placeholder="Elif Demir" />
            <AuthField label="Organization / Unit" placeholder="AFAD Istanbul" />
            <AuthField label="Operator ID / Badge Number" placeholder="AFD-24-08812" />
            <AuthField label="Email Address" placeholder="officer@afad.gov.tr" type="email" />
          </div>
          <AuthField label="Password" placeholder="••••••••••••" type="password" />

          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[13px] font-medium text-background transition-all duration-200 hover:opacity-90"
          >
            Create Account
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Requests are verified against national responder registries
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        Already authorized?{" "}
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Sign in instead.
        </Link>
      </p>
    </AuthShell>
  );
}
