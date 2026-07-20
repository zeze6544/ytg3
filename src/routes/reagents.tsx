import { createFileRoute } from "@tanstack/react-router";
import { Frame, Tag } from "@/components/narcodex/Frame";
import type { Tone } from "@/lib/types";

export const Route = createFileRoute("/reagents")({
  head: () => ({
    meta: [
      { title: "Reagent Testing Guide · NARCØDEX" },
      { name: "description", content: "A field guide to the common reagent tests used to identify psychoactive substances. Colour reactions for Marquis, Mecke, Mandelin, Liebermann, Ehrlich, Froehde, Simon's, Robadope, Zimmermann, Morris and Scott." },
      { property: "og:title", content: "NARCØDEX Reagent Guide" },
      { property: "og:description", content: "Reagent kits and the colours they produce. Never a full identification, always a first check." },
    ],
  }),
  component: Reagents,
});

type Row = { substance: string; color: string; tone: Tone; note?: string };
type Kit = { name: string; slug: string; blurb: string; use: string; rows: Row[] };

const KITS: Kit[] = [
  {
    name: "Marquis",
    slug: "marquis",
    blurb: "The oldest and most useful first check. Reacts with a huge range of substances.",
    use: "Best for MDMA, amphetamines, opioids and 2C-x. First reagent in almost every workflow.",
    rows: [
      { substance: "MDMA / MDA / MDEA", color: "Purple to black", tone: "purple" },
      { substance: "Amphetamine / Methamphetamine", color: "Orange to brown", tone: "amber" },
      { substance: "2C-B", color: "Yellow to green", tone: "phosphor" },
      { substance: "Most 2C-x compounds", color: "Yellow, green, or no reaction", tone: "phosphor" },
      { substance: "DXM", color: "Grey to black (slow)", tone: "red", note: "A slow black is a common DXM signature." },
      { substance: "PMA / PMMA", color: "Very slow, faint black", tone: "red", note: "Slow or absent reaction where MDMA would go fast to black is a red flag." },
      { substance: "Opioids (heroin, morphine, codeine)", color: "Red to purple", tone: "red" },
      { substance: "Ketamine", color: "No reaction", tone: "cyan" },
      { substance: "Cocaine", color: "No reaction", tone: "cyan" },
    ],
  },
  {
    name: "Mecke",
    slug: "mecke",
    blurb: "Selenious acid in sulfuric acid. Sharpens the picture for opioids and MDx.",
    use: "Pair with Marquis to confirm MDMA versus a substituted amphetamine, and to catch DXM.",
    rows: [
      { substance: "MDMA / MDA", color: "Dark blue to black", tone: "purple" },
      { substance: "Opioids", color: "Dark green to blue-green", tone: "phosphor" },
      { substance: "DXM", color: "Dark green then black", tone: "red" },
      { substance: "2C-B", color: "Yellow to green", tone: "phosphor" },
      { substance: "Amphetamine", color: "No reaction", tone: "cyan" },
    ],
  },
  {
    name: "Mandelin",
    slug: "mandelin",
    blurb: "Ammonium metavanadate in sulfuric acid. Very colourful. Useful for ketamine.",
    use: "One of the few common reagents that reacts distinctively with ketamine.",
    rows: [
      { substance: "Ketamine", color: "Orange to brown", tone: "amber", note: "One of the clearer ketamine signals." },
      { substance: "MDMA", color: "Blue to purple to black", tone: "purple" },
      { substance: "Methamphetamine", color: "Green to blue-green", tone: "phosphor" },
      { substance: "2C-B", color: "Green", tone: "phosphor" },
      { substance: "Cocaine", color: "Orange", tone: "amber" },
      { substance: "DXM", color: "Yellow to grey to black", tone: "red" },
    ],
  },
  {
    name: "Liebermann",
    slug: "liebermann",
    blurb: "Sodium nitrite in sulfuric acid. Excellent for catching cathinones.",
    use: "Use when you suspect a substituted cathinone sold as MDMA or coke.",
    rows: [
      { substance: "MDMA / MDA", color: "Black", tone: "purple" },
      { substance: "Cathinones (mephedrone, methylone, etc.)", color: "Yellow", tone: "amber", note: "Yellow with Liebermann where black was expected is a strong cathinone signal." },
      { substance: "2C-B", color: "Bright yellow to green", tone: "phosphor" },
      { substance: "Amphetamine", color: "Orange to brown", tone: "amber" },
      { substance: "Cocaine", color: "Yellow", tone: "amber" },
    ],
  },
  {
    name: "Ehrlich",
    slug: "ehrlich",
    blurb: "Dimethylaminobenzaldehyde. The go-to test for indoles.",
    use: "Confirms LSD, psilocybin, DMT and other tryptamines. Distinguishes real LSD from NBOMe.",
    rows: [
      { substance: "LSD", color: "Purple to pink over 1 to 5 minutes", tone: "purple" },
      { substance: "Psilocybin / Psilocin", color: "Purple", tone: "purple" },
      { substance: "DMT / 5-MeO-DMT", color: "Purple", tone: "purple" },
      { substance: "NBOMe / DOx", color: "No reaction", tone: "red", note: "No reaction on blotter that should be LSD is the classic NBOMe warning." },
    ],
  },
  {
    name: "Froehde",
    slug: "froehde",
    blurb: "Molybdic acid in sulfuric acid. Useful confirmatory reagent.",
    use: "Cross-check MDMA, opioids and 2C-x results.",
    rows: [
      { substance: "MDMA", color: "Yellow to green to blue-black", tone: "purple" },
      { substance: "Heroin / Morphine", color: "Purple to green", tone: "red" },
      { substance: "2C-B", color: "Green to blue", tone: "phosphor" },
      { substance: "Mescaline", color: "Green to yellow", tone: "phosphor" },
    ],
  },
  {
    name: "Simon's",
    slug: "simons",
    blurb: "Two-part reagent. Detects secondary amines.",
    use: "Distinguishes MDMA (positive, deep blue) from MDA (negative). Also flags methamphetamine.",
    rows: [
      { substance: "MDMA", color: "Deep blue", tone: "cyan" },
      { substance: "MDA", color: "No reaction", tone: "phosphor", note: "Simon's negative + Marquis positive = MDA rather than MDMA." },
      { substance: "Methamphetamine", color: "Deep blue", tone: "cyan" },
      { substance: "Amphetamine", color: "No reaction", tone: "phosphor" },
    ],
  },
  {
    name: "Robadope",
    slug: "robadope",
    blurb: "Cinnamaldehyde in ethanol. The other secondary amine test.",
    use: "Same purpose as Simon's, sometimes faster on cold samples.",
    rows: [
      { substance: "MDMA / Methamphetamine", color: "Orange to red", tone: "amber" },
      { substance: "MDA / Amphetamine", color: "No reaction", tone: "phosphor" },
    ],
  },
  {
    name: "Zimmermann",
    slug: "zimmermann",
    blurb: "Dinitrobenzene in KOH. The benzodiazepine test.",
    use: "Screens pressed pills sold as Xanax, Valium, Ativan and their designer analogues.",
    rows: [
      { substance: "Most benzodiazepines", color: "Deep purple to violet", tone: "purple" },
      { substance: "Nitrazepam / Clonazepam group", color: "Very deep purple", tone: "purple" },
      { substance: "Etizolam", color: "Purple", tone: "purple" },
    ],
  },
  {
    name: "Morris",
    slug: "morris",
    blurb: "A two-part test used for ketamine and MXE style dissociatives.",
    use: "Confirms ketamine when Mandelin is inconclusive.",
    rows: [
      { substance: "Ketamine", color: "Green then blue", tone: "cyan" },
      { substance: "MXE / MXPr / DMXE", color: "Green to blue (slower)", tone: "cyan" },
    ],
  },
  {
    name: "Scott",
    slug: "scott",
    blurb: "Three-step reagent. The cocaine test.",
    use: "Distinguishes cocaine from lidocaine, benzocaine, procaine and other cutting agents.",
    rows: [
      { substance: "Cocaine", color: "Blue that survives all three steps", tone: "cyan" },
      { substance: "Local anaesthetic cuts (lidocaine, procaine)", color: "Blue that vanishes in step 2 or 3", tone: "red" },
    ],
  },
  {
    name: "Fentanyl strips",
    slug: "fentanyl",
    blurb: "Immunoassay strip. Not a colour reagent but the single most important field test right now.",
    use: "Dissolve a small amount of the substance in water. One line = fentanyl present. Two lines = below cutoff. Test everything, especially anything sold as heroin, oxy, xanax, coke or MDMA.",
    rows: [
      { substance: "Fentanyl / most analogues", color: "One line = positive", tone: "red" },
      { substance: "Nitazenes", color: "Often missed by fentanyl strips", tone: "red", note: "Fentanyl strips do not reliably detect nitazenes. Assume unknown risk." },
    ],
  },
];

const READ_ORDER = [
  "Marquis first for any powder or pressed pill.",
  "Follow with Mecke and Mandelin to cross-check the initial colour.",
  "Add Liebermann if a cathinone is possible, Ehrlich for anything sold as LSD.",
  "Simon's or Robadope to tell MDMA from MDA and methamphetamine from amphetamine.",
  "Scott for cocaine. Zimmermann for benzodiazepines. Morris for ketamine.",
  "Always follow with a fentanyl strip on opioids, powders and anything unexpected.",
];

function Reagents() {
  return (
    <div className="space-y-4">
      <Frame title="REAGENT TESTING GUIDE" code="DEX-RGT" status={`${KITS.length} kits`} accent="phosphor">
        <p className="text-sm leading-relaxed text-foreground/90">
          Reagents are colour reactions. They never fully identify a substance, but they can rule
          out many of the worst adulterants in seconds. A drop of reagent on a tiny scraping of
          the sample produces a colour that either matches what the substance should do, or does
          not. This guide lists the common kits, the colours they produce, and what those colours
          usually mean. Nothing here is dosing advice. Nothing here is a green light.
        </p>
        <ol className="mt-3 grid gap-1 text-[11px] text-foreground/85 leading-snug">
          {READ_ORDER.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-phosphor phosphor-glow shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      </Frame>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {KITS.map((kit) => (
          <Frame key={kit.slug} title={kit.name.toUpperCase()} code={kit.slug.slice(0, 4).toUpperCase()} accent="cyan">
            <p className="text-[12px] text-foreground/90 leading-snug">{kit.blurb}</p>
            <p className="mt-1 text-[11px] text-muted-foreground uppercase tracking-widest">use · {kit.use}</p>
            <div className="mt-3 divide-y divide-border/50">
              {kit.rows.map((r) => (
                <div key={r.substance} className="py-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-start">
                  <div className="min-w-0">
                    <div className="text-[12px] text-phosphor truncate">{r.substance}</div>
                    {r.note && <div className="text-[11px] text-muted-foreground leading-snug">{r.note}</div>}
                  </div>
                  <Tag tone={r.tone}>{r.color}</Tag>
                </div>
              ))}
            </div>
          </Frame>
        ))}
      </div>

      <Frame title="RULES OF THE ROAD" code="RTFM" accent="red">
        <ul className="text-[12px] text-foreground/85 leading-relaxed space-y-1">
          <li>&gt; Colours vary with light, temperature, sample size and how old your reagent is. Fresh reagents in daylight give the truest read.</li>
          <li>&gt; A positive reaction does not tell you the dose. Fentanyl-contaminated MDMA can still test as MDMA on Marquis.</li>
          <li>&gt; No reagent detects everything. A "clean" set of reactions does not mean the substance is safe.</li>
          <li>&gt; Colour charts are a starting point. Cross-reference with DanceSafe, EcstasyData and TripSit before you commit to an identification.</li>
        </ul>
      </Frame>
    </div>
  );
}
