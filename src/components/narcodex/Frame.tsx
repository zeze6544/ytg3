import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Tone } from "@/lib/types";

export function Frame({
  title, code, status, children, className, accent = "phosphor",
}: {
  title?: string; code?: string; status?: string; children: ReactNode;
  className?: string; accent?: Tone;
}) {
  const accentColor: Record<Tone, string> = {
    phosphor: "text-phosphor", cyan: "text-cyan", amber: "text-amber",
    red: "text-red", purple: "text-purple",
  };
  return (
    <section className={cn("panel rounded-sm", className)}>
      {(title || code || status) && (
        <header className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-[11px] uppercase tracking-widest gap-2">
          <div className={cn("flex items-center gap-2 font-display text-sm min-w-0", accentColor[accent])}>
            <span className="opacity-70">◈</span>
            <span className="truncate">{title}</span>
            {code && <span className="text-muted-foreground shrink-0">/ {code}</span>}
          </div>
          {status && <span className="text-muted-foreground shrink-0">{status}</span>}
        </header>
      )}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function Field({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-2 py-1.5 border-b border-border/40 last:border-b-0 items-start">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground pt-0.5">{label}</div>
      <div className="text-sm text-foreground/90 font-mono break-words">
        {value ?? <span className="text-muted-foreground">· unknown ·</span>}
      </div>
    </div>
  );
}

export function Tag({ children, tone = "phosphor" }: { children: ReactNode; tone?: Tone }) {
  const toneClass: Record<Tone, string> = {
    phosphor: "border-phosphor/40 text-phosphor",
    cyan: "border-cyan/40 text-cyan",
    amber: "border-amber/40 text-amber",
    red: "border-red/50 text-red",
    purple: "border-purple/40 text-purple",
  };
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-widest bg-panel-2/40", toneClass[tone])}>
      {children}
    </span>
  );
}
