import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, ShieldAlert } from "lucide-react";
import { StatusDot } from "@/components/aura/primitives";
import { AuthShell } from "@/components/aura/AuthShell";
import { isAuthenticated, loginUser } from "@/lib/api-client";

type LoginSearch = {
  registered?: boolean;
  email?: string;
};

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isAuthenticated()) {
      throw redirect({ to: "/", search: { lat: undefined, lng: undefined } });
    }
  },
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    const registered = search.registered === "true" || search.registered === true ? true : undefined;
    const email = search.email ? String(search.email) : undefined;
    return { registered, email };
  },
  head: () => ({
    meta: [
      { title: "Giriş Yap — Aura Crisis Network" },
      {
        name: "description",
        content: "Aura Crisis Network kriz yönetim platformu kullanıcı girişi.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(
    search.registered
      ? "Kayıt işleminiz başarıyla tamamlandı! Lütfen kayıt olduğunuz e-posta ve şifre ile giriş yapınız."
      : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: "/", search: { lat: undefined, lng: undefined } });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Lütfen e-posta ve şifre giriniz.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await loginUser(email, password);
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="glass rounded-xl p-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-critical/25 bg-critical/10 text-critical">
            <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <div className="label-xs">Aura Crisis Network</div>
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight">Hesabınıza Giriş Yapın</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Canlı afet komuta merkezine erişmek için bilgilerinizi giriniz.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px] text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">
              E-Posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@aura.com"
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none transition-colors focus:border-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none transition-colors focus:border-ring"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[13px] font-medium text-background transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h3 className="text-[12px] font-semibold text-foreground">Demo Test Hesapları</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-[11px]">
              <span className="font-medium text-red-400">Operatör</span>
              <span className="font-mono text-muted-foreground">operator@aura.com / Aura2026!</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-[11px]">
              <span className="font-medium text-emerald-400">Vatandaş</span>
              <span className="font-mono text-muted-foreground">citizen@aura.com / Aura2026!</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          JWT 256-Bit SSL Şifreli Güvenli Bağlant
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link to="/signup" className="font-medium text-foreground hover:underline">
          Hemen Kayıt Olun (Sign up)
        </Link>
      </p>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <StatusDot tone="online" pulse={false} />
        Canlı PostgreSQL & SignalR Sunucusu Aktif
      </div>
    </AuthShell>
  );
}