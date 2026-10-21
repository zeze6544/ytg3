import SwiftUI

struct ReagentKit: Identifiable, Hashable {
    var slug: String
    var name: String
    var blurb: String
    var use: String
    var rows: [ReagentRow]
    var id: String { slug }
}

struct ReagentRow: Identifiable, Hashable {
    var substance: String
    var color: String
    var tone: String
    var note: String?
    var id: String { substance }
}

enum ReagentLibrary {
    static let readOrder = [
        "Marquis first for any powder or pressed pill.",
        "Follow with Mecke and Mandelin to cross-check the initial colour.",
        "Add Liebermann if a cathinone is possible, Ehrlich for anything sold as LSD.",
        "Simon's or Robadope to tell MDMA from MDA and methamphetamine from amphetamine.",
        "Scott for cocaine. Zimmermann for benzodiazepines. Morris for ketamine.",
        "Always follow with a fentanyl strip on opioids, powders and anything unexpected.",
    ]

    static let kits: [ReagentKit] = [
        ReagentKit(slug: "marquis", name: "Marquis", blurb: "The oldest and most useful first check. Reacts with a huge range of substances.", use: "Best for MDMA, amphetamines, opioids and 2C-x. First reagent in almost every workflow.", rows: [
            ReagentRow(substance: "MDMA / MDA / MDEA", color: "Purple to black", tone: "purple"),
            ReagentRow(substance: "Amphetamine / Methamphetamine", color: "Orange to brown", tone: "amber"),
            ReagentRow(substance: "2C-B", color: "Yellow to green", tone: "phosphor"),
            ReagentRow(substance: "Most 2C-x compounds", color: "Yellow, green, or no reaction", tone: "phosphor"),
            ReagentRow(substance: "DXM", color: "Grey to black (slow)", tone: "red", note: "A slow black is a common DXM signature."),
            ReagentRow(substance: "PMA / PMMA", color: "Very slow, faint black", tone: "red", note: "Slow or absent reaction where MDMA would go fast to black is a red flag."),
            ReagentRow(substance: "Opioids (heroin, morphine, codeine)", color: "Red to purple", tone: "red"),
            ReagentRow(substance: "Ketamine", color: "No reaction", tone: "cyan"),
            ReagentRow(substance: "Cocaine", color: "No reaction", tone: "cyan"),
        ]),
        ReagentKit(slug: "mecke", name: "Mecke", blurb: "Selenious acid in sulfuric acid. Sharpens the picture for opioids and MDx.", use: "Pair with Marquis to confirm MDMA versus a substituted amphetamine, and to catch DXM.", rows: [
            ReagentRow(substance: "MDMA / MDA", color: "Dark blue to black", tone: "purple"),
            ReagentRow(substance: "Opioids", color: "Dark green to blue-green", tone: "phosphor"),
            ReagentRow(substance: "DXM", color: "Dark green then black", tone: "red"),
            ReagentRow(substance: "2C-B", color: "Yellow to green", tone: "phosphor"),
            ReagentRow(substance: "Amphetamine", color: "No reaction", tone: "cyan"),
        ]),
        ReagentKit(slug: "mandelin", name: "Mandelin", blurb: "Ammonium metavanadate in sulfuric acid. Very colourful. Useful for ketamine.", use: "One of the few common reagents that reacts distinctively with ketamine.", rows: [
            ReagentRow(substance: "Ketamine", color: "Orange to brown", tone: "amber", note: "One of the clearer ketamine signals."),
            ReagentRow(substance: "MDMA", color: "Blue to purple to black", tone: "purple"),
            ReagentRow(substance: "Methamphetamine", color: "Green to blue-green", tone: "phosphor"),
            ReagentRow(substance: "2C-B", color: "Green", tone: "phosphor"),
            ReagentRow(substance: "Cocaine", color: "Orange", tone: "amber"),
            ReagentRow(substance: "DXM", color: "Yellow to grey to black", tone: "red"),
        ]),
        ReagentKit(slug: "liebermann", name: "Liebermann", blurb: "Sodium nitrite in sulfuric acid. Excellent for catching cathinones.", use: "Use when you suspect a substituted cathinone sold as MDMA or coke.", rows: [
            ReagentRow(substance: "MDMA / MDA", color: "Black", tone: "purple"),
            ReagentRow(substance: "Cathinones (mephedrone, methylone, etc.)", color: "Yellow", tone: "amber", note: "Yellow with Liebermann where black was expected is a strong cathinone signal."),
            ReagentRow(substance: "2C-B", color: "Bright yellow to green", tone: "phosphor"),
            ReagentRow(substance: "Amphetamine", color: "Orange to brown", tone: "amber"),
            ReagentRow(substance: "Cocaine", color: "Yellow", tone: "amber"),
        ]),
        ReagentKit(slug: "ehrlich", name: "Ehrlich", blurb: "Dimethylaminobenzaldehyde. The go-to test for indoles.", use: "Confirms LSD, psilocybin, DMT and other tryptamines. Distinguishes real LSD from NBOMe.", rows: [
            ReagentRow(substance: "LSD", color: "Purple to pink over 1 to 5 minutes", tone: "purple"),
            ReagentRow(substance: "Psilocybin / Psilocin", color: "Purple", tone: "purple"),
            ReagentRow(substance: "DMT / 5-MeO-DMT", color: "Purple", tone: "purple"),
            ReagentRow(substance: "NBOMe / DOx", color: "No reaction", tone: "red", note: "No reaction on blotter that should be LSD is the classic NBOMe warning."),
        ]),
        ReagentKit(slug: "froehde", name: "Froehde", blurb: "Molybdic acid in sulfuric acid. Useful confirmatory reagent.", use: "Cross-check MDMA, opioids and 2C-x results.", rows: [
            ReagentRow(substance: "MDMA", color: "Yellow to green to blue-black", tone: "purple"),
            ReagentRow(substance: "Heroin / Morphine", color: "Purple to green", tone: "red"),
            ReagentRow(substance: "2C-B", color: "Green to blue", tone: "phosphor"),
            ReagentRow(substance: "Mescaline", color: "Green to yellow", tone: "phosphor"),
        ]),
        ReagentKit(slug: "simons", name: "Simon's", blurb: "Two-part reagent. Detects secondary amines.", use: "Distinguishes MDMA (positive, deep blue) from MDA (negative). Also flags methamphetamine.", rows: [
            ReagentRow(substance: "MDMA", color: "Deep blue", tone: "cyan"),
            ReagentRow(substance: "MDA", color: "No reaction", tone: "phosphor", note: "Simon's negative + Marquis positive = MDA rather than MDMA."),
            ReagentRow(substance: "Methamphetamine", color: "Deep blue", tone: "cyan"),
            ReagentRow(substance: "Amphetamine", color: "No reaction", tone: "phosphor"),
        ]),
        ReagentKit(slug: "robadope", name: "Robadope", blurb: "Cinnamaldehyde in ethanol. The other secondary amine test.", use: "Same purpose as Simon's, sometimes faster on cold samples.", rows: [
            ReagentRow(substance: "MDMA / Methamphetamine", color: "Orange to red", tone: "amber"),
            ReagentRow(substance: "MDA / Amphetamine", color: "No reaction", tone: "phosphor"),
        ]),
        ReagentKit(slug: "zimmermann", name: "Zimmermann", blurb: "Dinitrobenzene in KOH. The benzodiazepine test.", use: "Screens pressed pills sold as Xanax, Valium, Ativan and their designer analogues.", rows: [
            ReagentRow(substance: "Most benzodiazepines", color: "Deep purple to violet", tone: "purple"),
            ReagentRow(substance: "Nitrazepam / Clonazepam group", color: "Very deep purple", tone: "purple"),
            ReagentRow(substance: "Etizolam", color: "Purple", tone: "purple"),
        ]),
        ReagentKit(slug: "morris", name: "Morris", blurb: "A two-part test used for ketamine and MXE style dissociatives.", use: "Confirms ketamine when Mandelin is inconclusive.", rows: [
            ReagentRow(substance: "Ketamine", color: "Green then blue", tone: "cyan"),
            ReagentRow(substance: "MXE / MXPr / DMXE", color: "Green to blue (slower)", tone: "cyan"),
        ]),
        ReagentKit(slug: "scott", name: "Scott", blurb: "Three-step reagent. The cocaine test.", use: "Distinguishes cocaine from lidocaine, benzocaine, procaine and other cutting agents.", rows: [
            ReagentRow(substance: "Cocaine", color: "Blue that survives all three steps", tone: "cyan"),
            ReagentRow(substance: "Local anaesthetic cuts (lidocaine, procaine)", color: "Blue that vanishes in step 2 or 3", tone: "red"),
        ]),
        ReagentKit(slug: "fentanyl", name: "Fentanyl strips", blurb: "Immunoassay strip. Not a colour reagent, and the most important field test for contamination right now.", use: "Dissolve a small amount in water. One line means fentanyl is present. Two lines means below the cutoff. Test powders and pressed pills.", rows: [
            ReagentRow(substance: "Fentanyl / most analogues", color: "One line = positive", tone: "red"),
            ReagentRow(substance: "Nitazenes", color: "Often missed by fentanyl strips", tone: "red", note: "Fentanyl strips do not reliably detect nitazenes. Treat a missed strip as a live opioid risk."),
        ]),
    ]

    static func kit(_ slug: String) -> ReagentKit? {
        kits.first { $0.slug == slug }
    }
}

struct ReagentListView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Panel(title: "READ ORDER", code: "1ST", tone: Theme.amber) {
                    ForEach(ReagentLibrary.readOrder, id: \.self) { line in
                        Text(line)
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    Text("A colour is not an identity and not a dose. More than one substance can share a colour.")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                ForEach(ReagentLibrary.kits) { kit in
                    NavigationLink(value: ArchiveLink.reagent(kit.slug)) {
                        FileRow(title: kit.name, subtitle: kit.blurb, tag: "KIT", tone: Theme.cyan)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("REAGENTS")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ReagentDetailView: View {
    var slug: String

    var body: some View {
        Group {
            if let kit = ReagentLibrary.kit(slug) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(kit.name)
                            .font(Theme.mono(32))
                            .foregroundStyle(Theme.phosphor)
                        Text(kit.blurb)
                            .font(Theme.mono(14))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(kit.use)
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.cyan)
                            .fixedSize(horizontal: false, vertical: true)
                        ForEach(kit.rows) { row in
                            Panel(title: row.substance.uppercased(), code: "COL", tone: Theme.tone(row.tone)) {
                                Text(row.color)
                                    .font(Theme.mono(16))
                                    .foregroundStyle(Theme.tone(row.tone))
                                if let note = row.note {
                                    Text(note)
                                        .font(Theme.mono(12))
                                        .foregroundStyle(Theme.muted)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                        Text("This chart does not say a sample is safe, pure, or a single substance.")
                            .font(Theme.mono(12))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(16)
                }
                .archiveScreen()
                .navigationTitle(kit.name)
                .navigationBarTitleDisplayMode(.inline)
            } else {
                Text("Reagent not found.")
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.muted)
                    .padding(16)
                    .archiveScreen()
            }
        }
    }
}
