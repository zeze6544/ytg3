import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// Email and password only for now. Social sign in configured server side.
import { Frame } from "@/components/narcodex/Frame";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Access · NARCØDEX" }] }),
  component: Auth,
});

function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        toast("Access granted");
        nav({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast("Check your email to confirm");
      }
    } catch (err: any) { toast(err.message ?? "Error"); }
    finally { setBusy(false); }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) toast(error.message);
  }

  return (
    <div className="max-w-md mx-auto">
      <Frame title="ACCESS TERMINAL" code="AUTH" accent="cyan">
        <div className="flex gap-2 mb-4 text-[11px] uppercase tracking-widest">
          <button onClick={() => setMode("login")} className={`px-3 py-1 border rounded-sm ${mode === "login" ? "border-phosphor text-phosphor phosphor-glow" : "border-border/60 text-muted-foreground"}`}>Login</button>
          <button onClick={() => setMode("register")} className={`px-3 py-1 border rounded-sm ${mode === "register" ? "border-phosphor text-phosphor phosphor-glow" : "border-border/60 text-muted-foreground"}`}>Register</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-panel-2/40 border border-phosphor/40 px-2 py-2 rounded-sm text-sm text-phosphor outline-none" />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Passphrase</span>
            <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)}
              className="w-full bg-panel-2/40 border border-phosphor/40 px-2 py-2 rounded-sm text-sm text-phosphor outline-none" />
          </label>
          <button disabled={busy} className="w-full px-3 py-2 border border-phosphor/60 text-phosphor uppercase text-[11px] tracking-widest rounded-sm hover:bg-phosphor/10 disabled:opacity-50">
            {busy ? "…" : mode === "login" ? "▶ Sign in" : "▶ Create account"}
          </button>
        </form>
        <div className="my-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest">· or ·</div>
        <button onClick={google} className="w-full px-3 py-2 border border-cyan/60 text-cyan uppercase text-[11px] tracking-widest rounded-sm hover:bg-cyan/10">
          ◇ Continue with Google
        </button>
      </Frame>
    </div>
  );
}
