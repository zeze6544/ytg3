import SwiftUI

struct MixView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var route: AppRoute
    @State private var substanceA: DrugRow?
    @State private var substanceB: DrugRow?
    @State private var slot: MixSlot?
    @State private var result: PairResult?
    @State private var facts: [DrugFile] = []
    @State private var loading = false

    private let ranks = ["low", "moderate", "dangerous", "deadly"]
    private let known = [("Alcohol", "Heroin"), ("Naloxone", "Heroin"), ("Prazosin", "Sildenafil")]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                BannerText(text: "Select two substances. The result names what each one does and what they do together. This is not medical advice and not a dosing tool.")
                picker("SUBSTANCE A", substanceA?.name) { slot = .a }
                picker("SUBSTANCE B", substanceB?.name) { slot = .b }
                HStack(spacing: 18) {
                    Button("SWAP") {
                        let next = substanceB
                        substanceB = substanceA
                        substanceA = next
                    }
                    .font(Theme.mono(13, weight: .medium))
                    .foregroundStyle(Theme.purple)
                    .frame(minHeight: 44)
                    Button("CLEAR") {
                        substanceA = nil
                        substanceB = nil
                        result = nil
                        facts = []
                    }
                    .font(Theme.mono(13, weight: .medium))
                    .foregroundStyle(Theme.cyan)
                    .frame(minHeight: 44)
                }
                .buttonStyle(.plain)
                ChipRow {
                    ForEach(known, id: \.0) { pair in
                        Button("\(pair.0) + \(pair.1)") { Task { await openKnown(pair.0, pair.1) } }
                            .buttonStyle(.plain)
                            .font(Theme.mono(12))
                            .foregroundStyle(Theme.amber)
                            .frame(minHeight: 36)
                    }
                }
                Panel(title: "RESULT", code: "OUT", tone: result.map { Theme.severityTone($0.severity) } ?? Theme.phosphor) {
                    if substanceA == nil || substanceB == nil {
                        Text("Awaiting two substances.")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                    } else if substanceA?.slug == substanceB?.slug {
                        Text("Same substance selected.")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                    } else if loading {
                        Text("Querying the matrix…")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.cyan)
                    } else if let result {
                        let meta = gloss(result.severity)
                        HStack(spacing: 4) {
                            ForEach(ranks, id: \.self) { rank in
                                VStack(alignment: .leading, spacing: 4) {
                                    Rectangle()
                                        .fill(result.severity == rank ? Theme.severityTone(rank) : Theme.line)
                                        .frame(height: 8)
                                    Text(rank.uppercased())
                                        .font(Theme.mono(9))
                                        .foregroundStyle(result.severity == rank ? Theme.severityTone(rank) : Theme.muted)
                                        .lineLimit(1)
                                }
                            }
                        }
                        Text(meta.label)
                            .font(Theme.mono(56))
                            .foregroundStyle(Theme.severityTone(result.severity))
                            .lineLimit(1)
                            .minimumScaleFactor(0.5)
                        Text(meta.gloss)
                            .font(Theme.mono(16, weight: .medium))
                            .foregroundStyle(Theme.severityTone(result.severity))
                            .fixedSize(horizontal: false, vertical: true)
                        Text(result.note)
                            .font(Theme.mono(14))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        Text("The checker could not build a pair note for these two names. Treat both substances as acting in the same hour. This file has no dose.")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                ForEach(facts) { fact in
                    Panel(title: fact.name.uppercased(), code: "FILE", tone: Theme.categoryTone(fact.category)) {
                        FieldLine(label: "Summary", value: fact.summary)
                        FieldLine(label: "Mechanism", value: fact.mechanism)
                        FieldLine(label: "Overdose signs", value: fact.overdoseSigns)
                        NavigationLink(value: ArchiveLink.drug(fact.slug)) {
                            Text("Open file")
                                .font(Theme.mono(13))
                                .foregroundStyle(Theme.cyan)
                                .frame(minHeight: 36, alignment: .leading)
                        }
                        .buttonStyle(.plain)
                    }
                }
                Text("Low, moderate, dangerous, and deadly describe the pair. The note says what each substance does. None of those words means the mix is safe.")
                    .font(Theme.mono(12))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                Text(Copy.finePrint)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("MIX CHECK")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $slot) { current in
            DrugSearchSheet { row in
                if current == .a { substanceA = row } else { substanceB = row }
                slot = nil
            }
        }
        .task(id: route.mixToken) {
            guard route.mixToken > 0, let slug = route.mixSlug, let name = route.mixName else { return }
            substanceA = DrugRow(slug: slug, name: name, category: "", evidence: "", summary: "")
        }
        .task(id: pairKey) { await refresh() }
    }

    private var pairKey: String {
        "\(substanceA?.slug ?? "")|\(substanceB?.slug ?? "")"
    }

    private func picker(_ label: String, _ value: String?, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(Theme.mono(10))
                    .foregroundStyle(Theme.muted)
                Text(value ?? "Select a substance")
                    .font(Theme.mono(16))
                    .foregroundStyle(value == nil ? Theme.muted : Theme.phosphor)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, minHeight: 56, alignment: .leading)
            .padding(.horizontal, 12)
            .background(Theme.panel)
            .overlay(Rectangle().stroke(Theme.line, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func gloss(_ severity: String) -> (label: String, gloss: String) {
        switch severity {
        case "low": return ("LOW", "Mildest stored rank. This is not a clearance.")
        case "moderate": return ("MODERATE", "Both substances still act. This is not permission to combine them.")
        case "dangerous": return ("DANGEROUS", "This pair can injure.")
        case "deadly": return ("DEADLY", "This pair can kill.")
        default: return ("UNKNOWN", "The checker has no rank for this pair.")
        }
    }

    private func openKnown(_ left: String, _ right: String) async {
        substanceA = await archive.drug(named: left)
        substanceB = await archive.drug(named: right)
    }

    private func refresh() async {
        guard let a = substanceA, let b = substanceB, a.slug != b.slug else {
            result = nil
            facts = []
            loading = false
            return
        }
        loading = true
        result = await archive.pair(a.slug, b.slug)
        facts = await archive.facts(a.slug, b.slug)
        loading = false
    }
}

private enum MixSlot: String, Identifiable {
    case a, b
    var id: String { rawValue }
}

private struct DrugSearchSheet: View {
    @EnvironmentObject private var archive: ArchiveStore
    @Environment(\.dismiss) private var dismiss
    var choose: (DrugRow) -> Void
    @State private var search = ""
    @State private var rows: [DrugRow] = []

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 4) {
                    if search.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 {
                        Text("Type at least two letters.")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                            .padding(.bottom, 8)
                    }
                    ForEach(rows) { row in
                        Button { choose(row) } label: {
                            FileRow(title: row.name, subtitle: row.summary, tag: Copy.categoryLabel(row.category), tone: Theme.categoryTone(row.category))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
            }
            .archiveScreen()
            .navigationTitle("SELECT")
            .navigationBarTitleDisplayMode(.inline)
            .searchable(text: $search, prompt: "Name or alias")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Theme.cyan)
                }
            }
            .task(id: search) {
                try? await Task.sleep(nanoseconds: 140_000_000)
                let term = search.trimmingCharacters(in: .whitespacesAndNewlines)
                guard term.count >= 2 else {
                    rows = []
                    return
                }
                rows = await archive.files(term: term, category: "all", shelf: "all", limit: 40).rows
            }
        }
        .preferredColorScheme(.dark)
    }
}
