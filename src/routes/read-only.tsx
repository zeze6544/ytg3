import { createFileRoute, Link } from "@tanstack/react-router";
import { Frame } from "@/components/narcodex/Frame";

export const Route = createFileRoute("/read-only")({
  head: () => ({
    meta: [
      { title: "Read Only · NARCØDEX" },
      { name: "description", content: "A quiet room inside the archive. No editing, no accounts, just a note from the people who built this." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReadOnly,
});

function ReadOnly() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Frame title="READ ONLY" code="HIDDEN" status="UNLISTED" className="lg:col-span-2" accent="purple">
        <div className="font-display text-[clamp(2rem,7vw,4rem)] leading-none text-purple purple-glow">
          you found the quiet room<span className="cursor ml-2" />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-foreground/90">
          Hi. If you clicked the little "read only" tag on the home page, or somebody sent you this
          link, welcome. This page is not in the menu. It never will be.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          NARCØDEX is a personal project. Everything on it was written, checked, argued about, and
          rewritten by real people who love the messy history of drugs and the science that keeps
          humans a little safer around them. There is no ad tech, no tracking beacons, no data sale.
          You read, we write, that is the whole deal.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          The database is public. Only one account holds the keys, and that account can only edit,
          never delete history. If a page you read here changed your mind about a substance, told
          you something a friend needed, or saved somebody a hospital visit, that is why it exists.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">
          Please do not treat any of this as medical advice. Talk to a real doctor, a real
          pharmacist, a real harm reduction service. This archive is a starting point, not a
          prescription pad.
        </p>
        <div className="mt-8 text-[10px] uppercase tracking-widest text-muted-foreground">
          &gt; thanks for reading · stay curious · stay alive
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/" className="px-3 py-2 border border-phosphor/60 text-phosphor phosphor-glow rounded-sm text-xs uppercase tracking-widest hover:bg-phosphor/10">Back to the front page</Link>
          <Link to="/database" className="px-3 py-2 border border-cyan/60 text-cyan cyan-glow rounded-sm text-xs uppercase tracking-widest hover:bg-cyan/10">Open the database</Link>
        </div>
      </Frame>

      <Frame title="HOUSE RULES" code="RULES" accent="amber">
        <ul className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <li>&gt; we do not tell you how to make anything</li>
          <li>&gt; we do not tell you where to buy anything</li>
          <li>&gt; we do not judge you for asking</li>
          <li>&gt; we cite sources when we can find them</li>
          <li>&gt; we say "we do not know" when that is the honest answer</li>
        </ul>
        <div className="mt-6 text-[10px] uppercase tracking-widest text-muted-foreground">
          if you spot something wrong, tell the operator on the admin page.
        </div>
      </Frame>
    </div>
  );
}
