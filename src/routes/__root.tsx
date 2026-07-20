import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import appCss from "../styles.css?url";
import { reportRuntimeError } from "../lib/runtime-error-reporting";
import { useSession } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel rounded-sm p-8 max-w-md text-center">
        <div className="font-display text-6xl text-red red-glow">404</div>
        <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">FILE NOT FOUND IN ARCHIVE</div>
        <Link to="/" className="mt-6 inline-block px-4 py-2 border border-phosphor/40 text-phosphor phosphor-glow rounded-sm text-sm uppercase tracking-widest hover:bg-phosphor/10">Return to console</Link>
      </div>
    </main>
  );
}
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportRuntimeError(error, { boundary: "root" }); }, [error]);
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel p-8 max-w-md text-center">
        <div className="font-display text-3xl text-red red-glow">SYSTEM FAULT</div>
        <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 px-4 py-2 border border-phosphor/40 text-phosphor text-sm uppercase tracking-widest hover:bg-phosphor/10">Retry</button>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NARCØDEX" },
      { name: "description", content: "A plain spoken library of drugs, cannabis strains, interactions and history. Built for people who want honest information and harm reduction, not scare stories." },
      { property: "og:title", content: "NARCØDEX" },
      { property: "og:description", content: "A plain spoken library of drugs, cannabis strains, interactions and history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "NARCØDEX" },
      { name: "twitter:description", content: "A plain spoken library of drugs, cannabis strains, interactions and history." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c531afeb-6b03-462e-aa01-dda17f3daddc" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c531afeb-6b03-462e-aa01-dda17f3daddc" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="dark scanlines vignette"><div className="crt-flicker">{children}</div><Scripts /></body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "HOME" },
  { to: "/database", label: "DATABASE" },
  { to: "/strains", label: "STRAINS" },
  { to: "/interactions", label: "INTERACT" },
  { to: "/reagents", label: "REAGENTS" },
  { to: "/classes", label: "CLASSES" },
  { to: "/timeline", label: "TIMELINE" },
  { to: "/saved", label: "SAVED" },
] as const;

function Header() {
  const { user, isAdmin } = useSession();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const unsub = router.subscribe("onResolved", () => setOpen(false));
    return () => unsub();
  }, [router]);

  const linkBase = "shrink-0 px-2 py-1 border border-transparent hover:border-phosphor/40 hover:bg-phosphor/10 text-phosphor/80 hover:text-phosphor uppercase tracking-widest rounded-sm";
  const linkActive = "shrink-0 px-2 py-1 border border-phosphor/60 bg-phosphor/10 text-phosphor phosphor-glow uppercase tracking-widest rounded-sm";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-sm bg-background/85">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 flex items-center gap-3">
        <Link to="/" className="font-display text-xl sm:text-2xl text-phosphor phosphor-glow tracking-widest shrink-0">
          NARC<span className="text-cyan cyan-glow">Ø</span>DEX
        </Link>
        <span className="hidden xl:inline text-[10px] text-muted-foreground uppercase tracking-widest">v1.99 // ARCHIVE ONLINE</span>

        {/* Desktop nav */}
        <nav className="ml-auto hidden lg:flex items-center gap-1 text-[11px]">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkBase}
              activeProps={{ className: linkActive }}
              activeOptions={{ exact: n.to === "/" }}
            >{n.label}</Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="shrink-0 px-2 py-1 border border-amber/60 text-amber amber-glow uppercase tracking-widest rounded-sm hover:bg-amber/10">ADMIN</Link>
          )}
          {user ? (
            <button onClick={() => supabase.auth.signOut()} className="shrink-0 px-2 py-1 border border-red/60 text-red uppercase tracking-widest rounded-sm hover:bg-red/10">LOGOUT</button>
          ) : (
            <Link to="/auth" className="shrink-0 px-2 py-1 border border-cyan/60 text-cyan cyan-glow uppercase tracking-widest rounded-sm hover:bg-cyan/10">LOGIN</Link>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="ml-auto lg:hidden inline-flex items-center gap-2 px-3 py-2 border border-phosphor/50 text-phosphor phosphor-glow rounded-sm uppercase tracking-widest text-xs hover:bg-phosphor/10"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>MENU</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-phosphor/30 bg-background/95 backdrop-blur-sm">
          <nav className="mx-auto max-w-7xl px-3 py-3 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to}
                className="px-3 py-3 border border-phosphor/30 text-phosphor/90 uppercase tracking-widest rounded-sm hover:bg-phosphor/10 text-center"
                activeProps={{ className: "px-3 py-3 border border-phosphor/70 bg-phosphor/15 text-phosphor phosphor-glow uppercase tracking-widest rounded-sm text-center" }}
                activeOptions={{ exact: n.to === "/" }}
              >{n.label}</Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className="px-3 py-3 border border-amber/60 text-amber amber-glow uppercase tracking-widest rounded-sm hover:bg-amber/10 text-center">ADMIN</Link>
            )}
            {user ? (
              <button onClick={() => { supabase.auth.signOut(); setOpen(false); }} className="px-3 py-3 border border-red/60 text-red uppercase tracking-widest rounded-sm hover:bg-red/10 col-span-2">LOGOUT</button>
            ) : (
              <Link to="/auth" className="px-3 py-3 border border-cyan/60 text-cyan cyan-glow uppercase tracking-widest rounded-sm hover:bg-cyan/10 text-center col-span-2">LOGIN</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 py-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-2 text-phosphor/70">// built for education · not medical advice · harm reduction first</div>
        <div>© NARCØDEX · scanlines on · {new Date().getFullYear()}</div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" theme="dark" toastOptions={{ style: { background: "var(--panel)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "var(--font-mono)" } }} />
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6"><Outlet /></main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
