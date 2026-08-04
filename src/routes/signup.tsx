import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/aura/AuthShell";
import { loginUser, registerUser } from "@/lib/api-client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Kayıt Ol — Aura Crisis Network" },
      {
        name: "description",
        content: "Aura Crisis Network kriz yönetim platformu kullanıcı kaydı.",
      },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Citizen");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerUser(email, password, fullName, role);
      await loginUser(email, password);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Kayıt işlemi başarısız. Lütfen tekrar deneyiniz.");
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
            <h1 className="mt-1.5 text-lg font-semibold tracking-tight">Yeni Hesap Oluşturun</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Vatandaş veya Nöbetçi Operatör hesabı ile sisteme kaydolun.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-foreground">
              Ad Soyad
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ahmet Yılmaz"
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-foreground">
              E-Posta Adresi
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ahmet@example.com"
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-foreground">
              Şifre (Min 6 karakter)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-foreground">
              Hesap Rolü
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-background/50 px-3.5 py-2 text-[13px] outline-none focus:border-ring"
            >
              <option value="Citizen">Vatandaş (Citizen)</option>
              <option value="Operator">Nöbetçi Operatör (Operator)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[13px] font-medium text-background transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Hesap Oluşturuluyor..." : "Kayıt Ol ve Giriş Yap"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          Kaydınız anında .NET 10 Identity veritabanında güvenle oluşturulur.
        </div>
      </div>

      <p className="mt-6 text-center text-[12px] text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link to="/login" className="font-medium text-foreground hover:underline">
          Giriş Yapın (Sign in)
        </Link>
      </p>
    </AuthShell>
  );
}
