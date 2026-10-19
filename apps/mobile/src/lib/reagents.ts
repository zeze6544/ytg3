import type { Tone } from "@/constants/theme";

export type ReagentRow = { substance: string; color: string; tone: Tone; note?: string };
export type ReagentKit = { name: string; slug: string; blurb: string; use: string; rows: ReagentRow[] };

export const KITS: ReagentKit[] = [
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
    blurb: "Immunoassay strip. Not a colour reagent, and the most important field test for contamination right now.",
    use: "Dissolve a small amount in water. One line means fentanyl is present. Two lines means below the cutoff. Test powders and pressed pills.",
    rows: [
      { substance: "Fentanyl / most analogues", color: "One line = positive", tone: "red" },
      { substance: "Nitazenes", color: "Often missed by fentanyl strips", tone: "red", note: "Fentanyl strips do not reliably detect nitazenes. Assume unknown risk." },
    ],
  },
];

export const READ_ORDER = [
  "Marquis first for any powder or pressed pill.",
  "Follow with Mecke and Mandelin to cross-check the initial colour.",
  "Add Liebermann if a cathinone is possible, Ehrlich for anything sold as LSD.",
  "Simon's or Robadope to tell MDMA from MDA and methamphetamine from amphetamine.",
  "Scott for cocaine. Zimmermann for benzodiazepines. Morris for ketamine.",
  "Always follow with a fentanyl strip on opioids, powders and anything unexpected.",
];

export const TERPENES: { key: string; aroma: string; note: string }[] = [
  { key: "myrcene", aroma: "earthy, musky, mango", note: "The most common cannabis terpene. Reported as sedating and body heavy at higher levels." },
  { key: "limonene", aroma: "citrus peel, lemon", note: "Bright and lifting. Common in cultivars people reach for during the day." },
  { key: "caryophyllene", aroma: "black pepper, clove, wood", note: "The only terpene that also binds the CB2 receptor. Often reported as calming." },
  { key: "pinene", aroma: "pine forest, rosemary", note: "Sharp and green. Sometimes reported to keep the head clearer." },
  { key: "linalool", aroma: "lavender, floral", note: "Soft, floral, and calming in most reports." },
  { key: "humulene", aroma: "hops, earthy", note: "Woody and dry. Shows up alongside caryophyllene in many kush lines." },
  { key: "terpinolene", aroma: "fresh herbs, apple, citrus", note: "Uplifting, complex nose. Common in Haze and Jack lineages." },
  { key: "ocimene", aroma: "sweet herbs, basil, mango", note: "Bright and slightly tropical." },
];
