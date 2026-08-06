import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { LogOut, Search, ShieldAlert, MapPin } from "lucide-react";
import { NAVIGATION_CONFIG } from "@/config";
import { hasAnyRole, clearStoredAuth, getStoredAuth, isAuthenticated, type AuthResponseDto } from "@/lib/api-client";
import { SEARCHABLE_LOCATIONS, type SearchableLocation } from "@/lib/geo-turkey";
import { NotificationPopover } from "./NotificationPopover";
import { cn } from "@/lib/utils";
import { StatusDot } from "./primitives";

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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [currentUser, setCurrentUser] = useState<AuthResponseDto | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentUser(getStoredAuth());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    clearStoredAuth();
    navigate({ to: "/login" });
  }

  function handleSelectLocation(loc: SearchableLocation) {
    setSearchQuery(loc.name);
    setSearchOpen(false);
    navigate({
      to: "/risk",
      search: { lat: loc.lat, lng: loc.lng } as any,
    });
  }

  const matchingLocations = searchQuery.trim()
    ? SEARCHABLE_LOCATIONS.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const headerItems = NAVIGATION_CONFIG.filter(
    (item) => item.showInHeader && hasAnyRole(item.requiredRoles)
  );

  const userInitials = currentUser?.fullName
    ? currentUser.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "US";

  return (
    <header
      className={cn(
        "z-40 flex h-14 items-center gap-6 px-6",
        floating
          ? "glass absolute inset-x-0 top-0 rounded-none border-x-0 border-t-0"
          : "sticky top-0 border-b border-border bg-background/85 backdrop-blur-xl"
      )}
    >
      <AuraLogo />

      <nav className="hidden items-center gap-1 lg:flex">
        {headerItems.map((item) => {
          const active = item.route === "/" ? pathname === "/" : pathname.startsWith(item.route);
          return (
            <Link
              key={item.id}
              to={item.route}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] transition-colors duration-200",
                active
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block" ref={searchRef}>
          <label className="group flex h-9 w-80 items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 transition-colors duration-200 focus-within:border-ring">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="İl, ilçe (Kadıköy, Silivri...) ara..."
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </label>

          {searchOpen && matchingLocations.length > 0 && (
            <div className="absolute left-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card p-2 shadow-2xl backdrop-blur-xl animate-scale-in">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Arama Sonuçları ({matchingLocations.length})
              </div>
              <div className="mt-1 space-y-1">
                {matchingLocations.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectLocation(loc)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {loc.name}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {loc.type === "District" ? "İlçe" : "İl"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <NotificationPopover />

        <div className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-primary">
            {userInitials}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[12px] font-medium">{currentUser?.fullName || "Oturum Açıldı"}</span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <StatusDot pulse={false} className="h-1.5 w-1.5" />
              {currentUser?.roles?.[0] || "Citizen"}
            </span>
          </span>
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className="ml-2 p-1 text-muted-foreground hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

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
