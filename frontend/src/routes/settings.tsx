import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/aura/AppShell";
import { AuraBadge, PanelCard } from "@/components/aura/primitives";
import { getStoredAuth, isAuthenticated, type AuthResponseDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
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
  const [user, setUser] = useState<AuthResponseDto | null>(null);

  useEffect(() => {
    setUser(getStoredAuth());
  }, []);

  const [flags, setFlags] = useState<Record<string, boolean>>({
    critical: true,
    digest: false,
    sound: true,
    labels: true,
    terrain: false,
    cluster: true,
  });
  const set = (k: string) => (v: boolean) => setFlags((f) => ({ ...f, [k]: v }));

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "OP";

  return (
    <AppShell title="Ayarlar & Profil" description="Sistem tercihleriniz ve aktif operatör oturum detayları.">
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
            <PanelCard title="Operatör Profili (JWT Canlı Oturum)">
              <div className="flex items-center gap-4 border-b border-border px-6 py-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-[15px] font-semibold text-primary">
                  {initials}
                </span>
                <div>
                  <div className="text-[14px] font-medium">{user?.fullName || "Bilinmeyen Kullanıcı"}</div>
                  <div className="text-[12px] text-muted-foreground">
                    Rol: {user?.roles?.join(", ") || "Citizen"} · Aura Network ID: {user?.userId || "N/A"}
                  </div>
                </div>
                <AuraBadge tone="online" className="ml-auto">
                  Aktif Oturum
                </AuraBadge>
              </div>
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                {[
                  ["Ad Soyad", user?.fullName || ""],
                  ["Kullanıcı ID", user?.userId || ""],
                  ["E-Posta", user?.email || ""],
                  ["Rol Yetkisi", user?.roles?.join(", ") || "Citizen"],
                ].map(([l, v]) => (
                  <label key={l} className="block">
                    <span className="mb-2 block text-[12px] font-medium">{l}</span>
                    <input
                      readOnly
                      value={v}
                      onChange={() => {}}
                      className="h-10 w-full rounded-lg border border-border bg-background/50 px-3 text-[13px] outline-none transition-colors duration-200 focus:border-ring cursor-default"
                    />
                  </label>
                ))}
              </div>
            </PanelCard>
          )}

          {tab === "Appearance" && (
            <PanelCard title="Görünüm ve Tema">
              <div className="grid gap-3 p-6 sm:grid-cols-3">
                {["Koyu Tema (Saha Mode)", "Kontrast Koyu", "Sistem"].map((t, i) => (
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
              <Row title="Animasyonları Azalt" desc="Harita marker ve panel animasyonlarını devre dışı bırakır.">
                <Toggle on={false} onChange={() => {}} />
              </Row>
              <Row title="Kompakt Liste" desc="Tablo satır yüksekliklerini sıkılaştırır.">
                <Toggle on={flags.cluster} onChange={set("cluster")} />
              </Row>
            </PanelCard>
          )}

          {tab === "Notifications" && (
            <PanelCard title="Canlı Bildirim Ayarları">
              <Row title="Kritik Afet Uyanları" desc="Deprem (>=4.0 ML), orman yangını ve tıbbi tahliye uyarıları.">
                <Toggle on={flags.critical} onChange={set("critical")} />
              </Row>
              <Row title="Günlük Özet" desc="Her sabah 08:00'de tamamlanan ihbar bülteni.">
                <Toggle on={flags.digest} onChange={set("digest")} />
              </Row>
              <Row title="Sesli İkaz Cihazı" desc="Yeni kriz uyarısı geldiğinde ses tonu çalar.">
                <Toggle on={flags.sound} onChange={set("sound")} />
              </Row>
            </PanelCard>
          )}

          {tab === "Map Preferences" && (
            <PanelCard title="Harita Tercihleri">
              <Row title="İlçe Sınırları ve Etiketler" desc="PostGIS ilçe sınırlarını ve isimlerini göster.">
                <Toggle on={flags.labels} onChange={set("labels")} />
              </Row>
              <Row title="Arazi Gölgelendirme" desc="Yükseklik rölyef tabakasını aktif et.">
                <Toggle on={flags.terrain} onChange={set("terrain")} />
              </Row>
              <Row title="Marker Kümeleme (Clustering)" desc="Yoğun markerları uzaklaştırınca grupla.">
                <Toggle on={flags.cluster} onChange={set("cluster")} />
              </Row>
              <Row title="Varsayılan Merkez" desc="Oturum açılışında harita merkezi.">
                <select className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-ring">
                  <option>İstanbul, Türkiye</option>
                  <option>Marmara Bölgesi</option>
                  <option>Türkiye Geneli</option>
                </select>
              </Row>
            </PanelCard>
          )}

          {tab === "Account" && (
            <PanelCard title="Hesap ve Güvenlik">
              <Row title="İki Faktörlü Doğrulama (2FA)" desc="Identity JWT + Refresh Token Güvenlik Protokolü.">
                <AuraBadge tone="online">Etkin (JWT)</AuraBadge>
              </Row>
              <Row title="Refresh Token Bitiş Tarihi" desc={user?.refreshTokenExpiresAt ? new Date(user.refreshTokenExpiresAt).toLocaleString() : "Aktif"}>
                <button className="h-9 rounded-lg border border-border px-3 text-[12px] text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground">
                  Yenile
                </button>
              </Row>
            </PanelCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
