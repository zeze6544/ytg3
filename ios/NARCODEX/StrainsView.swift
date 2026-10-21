import SwiftUI

struct StrainsView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @State private var search = ""
    @State private var term = ""
    @State private var type = "all"
    @State private var shown = 40
    @State private var rows: [StrainRecord] = []
    @State private var total = 0

    private let types = ["all", "indica", "sativa", "hybrid", "ruderalis"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ChipRow {
                    ForEach(types, id: \.self) { item in
                        let on = type == item
                        Button {
                            type = item
                            shown = 40
                        } label: {
                            TagChip(text: item == "all" ? "All" : item.capitalized, tone: on ? Theme.strainTone(item) : Theme.muted, filled: on)
                        }
                        .buttonStyle(.plain)
                    }
                }
                if rows.isEmpty {
                    Text(term.isEmpty ? "No strains on this shelf." : "No strains match that search.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.muted)
                }
                ForEach(rows) { row in
                    NavigationLink(value: ArchiveLink.strain(row.slug)) {
                        FileRow(title: row.name, subtitle: row.lineage, tag: row.type.uppercased(), tone: Theme.strainTone(row.type))
                    }
                    .buttonStyle(.plain)
                }
                if rows.count < total {
                    ActionButton(title: "Load more", tone: Theme.cyan) { shown += 40 }
                }
                Text("Showing \(rows.count) of \(formatCount(total)).")
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                Text("A cultivar name is not an assay. Percentages appear only when the catalogue stored them.")
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("STRAINS")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $search, prompt: "Strain or lineage")
        .task(id: search) {
            try? await Task.sleep(nanoseconds: 140_000_000)
            let next = search.trimmingCharacters(in: .whitespacesAndNewlines)
            if next != term {
                term = next
                shown = 40
            }
        }
        .task(id: "\(term)|\(type)|\(shown)") {
            let listed = await archive.strains(term: term.lowercased(), type: type, limit: shown)
            rows = listed.rows
            total = listed.total
        }
    }
}

struct StrainDetailView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var library: Library
    var slug: String
    @State private var strain: StrainRecord?
    @State private var missing = false

    var body: some View {
        Group {
            if let strain {
                detail(strain)
            } else if missing {
                Text("Strain file not found.")
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.muted)
                    .padding(16)
                    .archiveScreen()
            } else {
                Text("Loading strain…")
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.cyan)
                    .padding(16)
                    .archiveScreen()
            }
        }
        .task(id: slug) {
            guard let strain = await archive.strain(slug: slug) else {
                missing = true
                return
            }
            self.strain = strain
            library.remember(Bookmark(kind: "strain", slug: strain.slug, name: strain.name))
        }
    }

    private func detail(_ strain: StrainRecord) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(strain.name)
                    .font(Theme.mono(32))
                    .foregroundStyle(Theme.phosphor)
                    .fixedSize(horizontal: false, vertical: true)
                TagChip(text: strain.type.uppercased(), tone: Theme.strainTone(strain.type))
                NugMark(slug: strain.slug, type: strain.type)
                Text("A generated mark from the name. It is not a photograph and not a measure of the flower.")
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                BannerText(text: "Not a recommendation to use cannabis. A name on a jar is not an assay.", tone: Theme.amber)
                let bookmark = Bookmark(kind: "strain", slug: strain.slug, name: strain.name)
                ActionButton(title: library.contains(bookmark) ? "Saved on this device" : "Save on this device") {
                    library.toggle(bookmark)
                }
                Panel(title: "FILE", code: "CAN", tone: Theme.strainTone(strain.type)) {
                    FieldLine(label: "Lineage", value: strain.lineage)
                    FieldLine(label: "Confidence", value: strain.confidence)
                    Text(strain.summary)
                        .font(Theme.mono(14))
                        .foregroundStyle(Theme.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Panel(title: "CANNABINOIDS", code: "%", tone: Theme.phosphor) {
                    Text(assay(strain.thcLow, strain.thcHigh, "THC"))
                        .font(Theme.mono(16))
                        .foregroundStyle(Theme.phosphor)
                    Text(assay(strain.cbdLow, strain.cbdHigh, "CBD"))
                        .font(Theme.mono(16))
                        .foregroundStyle(Theme.cyan)
                    Text("These figures are copied from the catalogue. An empty figure means the file has no number, not that the number is zero.")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Panel(title: "TERPENES", code: "TERP", tone: Theme.amber) {
                    if strain.terpenes.isEmpty {
                        Text("No terpene list is stored on this file, and no percentage is stored.")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    } else {
                        ForEach(strain.terpenes, id: \.self) { terpene in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(terpene)
                                    .font(Theme.mono(14))
                                    .foregroundStyle(Theme.text)
                                if let note = TerpeneNotes.note(for: terpene) {
                                    Text(note)
                                        .font(Theme.mono(12))
                                        .foregroundStyle(Theme.muted)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                        Text("No percentage is stored beside these names.")
                            .font(Theme.mono(12))
                            .foregroundStyle(Theme.muted)
                    }
                }
                Panel(title: "REPORTED", code: "EFF") {
                    ChipRow {
                        ForEach(strain.effects, id: \.self) { effect in
                            TagChip(text: effect, tone: Theme.phosphor)
                        }
                    }
                    ChipRow {
                        ForEach(strain.adverse, id: \.self) { effect in
                            TagChip(text: effect, tone: Theme.red)
                        }
                    }
                }
                Panel(title: "MEDICAL NAMES", code: "RX", tone: Theme.cyan) {
                    Text("No medical seller list is stored on this file. A cultivar name is not a prescription product, and this archive does not list shops.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text(Copy.finePrint)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle(strain.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func assay(_ low: Double?, _ high: Double?, _ name: String) -> String {
        switch (low, high) {
        case (nil, nil):
            return "\(name): not on file"
        case let (low?, nil):
            return "\(name): \(figure(low))%"
        case let (nil, high?):
            return "\(name): \(figure(high))%"
        case let (low?, high?) where abs(low - high) < 0.05:
            return "\(name): \(figure(low))%"
        case let (low?, high?):
            return "\(name): \(figure(low))–\(figure(high))%"
        }
    }

    private func figure(_ value: Double) -> String {
        abs(value.rounded() - value) < 0.05 ? String(format: "%.0f", value) : String(format: "%.1f", value)
    }
}

enum TerpeneNotes {
    static func note(for name: String) -> String? {
        switch name.lowercased() {
        case "myrcene": return "Earthy, musky, mango. Often the most common cannabis terpene on a lab sheet."
        case "limonene": return "Citrus peel. Often described as bright."
        case "caryophyllene": return "Black pepper, clove, wood. Also binds the CB2 receptor."
        case "pinene": return "Pine and rosemary."
        case "linalool": return "Lavender and floral."
        case "humulene": return "Hops and wood, often beside caryophyllene."
        case "terpinolene": return "Herbs, apple, citrus. Common in some haze lines."
        case "ocimene": return "Sweet herbs and basil."
        default: return nil
        }
    }
}
