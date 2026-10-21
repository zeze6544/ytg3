import SwiftUI

struct DrugDetailView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var library: Library
    @EnvironmentObject private var route: AppRoute
    @Environment(\.openURL) private var openURL
    var slug: String
    @State private var drug: DrugFile?
    @State private var missing = false
    @State private var hits: [RuleHit] = []
    @State private var refs: [ReferenceItem] = []
    @State private var neighbors: [DrugRow] = []

    var body: some View {
        Group {
            if let drug {
                detail(drug)
            } else if missing {
                Text("File not found.")
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.muted)
                    .padding(16)
                    .archiveScreen()
            } else {
                Text("Loading file…")
                    .font(Theme.mono(14))
                    .foregroundStyle(Theme.cyan)
                    .padding(16)
                    .archiveScreen()
            }
        }
        .task(id: slug) { await load() }
    }

    private func detail(_ drug: DrugFile) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(drug.name)
                        .font(Theme.mono(drug.name.count > 24 ? 28 : 36))
                        .foregroundStyle(Theme.phosphor)
                        .fixedSize(horizontal: false, vertical: true)
                    ChipRow {
                        TagChip(text: Copy.categoryLabel(drug.category), tone: Theme.categoryTone(drug.category))
                        TagChip(text: "evidence: \(drug.evidenceQuality == "unknown" ? "class record" : drug.evidenceQuality)", tone: Theme.evidenceTone(drug.evidenceQuality))
                        if let year = drug.discoveredYear {
                            TagChip(text: "est. \(year)", tone: Theme.amber)
                        }
                    }
                    BannerText(text: "Not medical advice. Not a dose, a source, or a reason to use this substance.", tone: Theme.amber)
                    let bookmark = Bookmark(kind: "drug", slug: drug.slug, name: drug.name)
                    ActionButton(title: library.contains(bookmark) ? "Saved on this device" : "Save on this device") {
                        library.toggle(bookmark)
                    }
                    ActionButton(title: "Check a mix with this file", tone: Theme.red) {
                        route.checkMix(slug: drug.slug, name: drug.name)
                    }
                    ActionButton(title: "More \(Copy.categoryLabel(drug.category)) files", tone: Theme.cyan) {
                        route.openCategory(drug.category)
                    }

                    section("overview", "EFFECTS", "EFF") {
                        if let acute = drug.acuteRisks, !acute.isEmpty {
                            Text(acute)
                                .font(Theme.mono(14, weight: .medium))
                                .foregroundStyle(Theme.red)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        if let summary = drug.summary, !summary.isEmpty {
                            Text(summary)
                                .font(Theme.mono(14))
                                .foregroundStyle(Theme.text)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        tagBlock("REPORTED", drug.effects, tone: Theme.phosphor)
                        tagBlock("ADVERSE", drug.adverseEffects, tone: Theme.red)
                    }
                    Panel(title: "NAMES", code: "NAM", tone: Theme.cyan) {
                        FieldLine(label: "Aliases", value: joinedNames(drug.aliases))
                        FieldLine(label: "Brand names", value: joinedNames(drug.brandNames))
                        FieldLine(label: "Street names", value: joinedNames(drug.streetNames))
                        FieldLine(label: "Chemistry", value: drug.chemistry)
                    }

                    Panel(title: "PHARMACOLOGY", code: "MEC", tone: Theme.purple) {
                        FieldLine(label: "Mechanism", value: drug.mechanism)
                        FieldLine(label: "Onset", value: drug.onset)
                        FieldLine(label: "Duration", value: drug.duration)
                        FieldLine(label: "Half-life", value: drug.halfLife)
                        if [drug.mechanism, drug.onset, drug.duration, drug.halfLife].allSatisfy({ ($0 ?? "").isEmpty }) {
                            Text("Not on file.")
                                .font(Theme.mono(13))
                                .foregroundStyle(Theme.muted)
                        }
                    }
                    .id("pharm")

                    Panel(title: "RISKS", code: "RSK", tone: Theme.red) {
                        FieldLine(label: "Acute", value: drug.acuteRisks)
                        FieldLine(label: "Chronic", value: drug.chronicRisks)
                        FieldLine(label: "Overdose signs", value: drug.overdoseSigns)
                        FieldLine(label: "Contraindications", value: drug.contraindications)
                    }
                    .id("risk")
                    Panel(title: "DEPENDENCE", code: "DEP", tone: Theme.amber) {
                        FieldLine(label: "Dependence", value: drug.dependence)
                        FieldLine(label: "Tolerance", value: drug.tolerance)
                        FieldLine(label: "Withdrawal", value: drug.withdrawal)
                    }
                    Panel(title: "HARM REDUCTION", code: "HR", tone: Theme.cyan) {
                        FieldLine(label: "Testing", value: drug.testing)
                        FieldLine(label: "Safer context", value: drug.harmReduction)
                        Text("NARCØDEX does not provide dosing, sourcing, synthesis, or test-evasion instructions.")
                            .font(Theme.mono(11))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(archive.chapters(for: drug)) { chapter in
                        Panel(title: chapter.title.uppercased(), code: "READ", tone: Theme.cyan) {
                            ForEach(chapter.paragraphs, id: \.self) { paragraph in
                                Text(paragraph)
                                    .font(Theme.mono(14))
                                    .foregroundStyle(Theme.text)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }

                    Panel(title: "KNOWN MIXES", code: "MIX", tone: Theme.red) {
                        Text(hits.isEmpty
                             ? "No stored rule names \(drug.name) directly. The mix checker still describes a pair. That description is not a clearance."
                             : "\(hits.count) stored rules name \(drug.name). \(hits.filter { $0.severity == "deadly" }.count) deadly, \(hits.filter { $0.severity == "dangerous" }.count) dangerous. A pair with no stored rule is still described below, and it is not a clearance.")
                            .font(Theme.mono(14))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(archive.floor(for: drug))
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                        ForEach(hits) { hit in
                            VStack(alignment: .leading, spacing: 6) {
                                HStack(alignment: .firstTextBaseline) {
                                    TagChip(text: hit.severity, tone: Theme.severityTone(hit.severity))
                                    Text(hit.other)
                                        .font(Theme.mono(13, weight: .medium))
                                        .foregroundStyle(Theme.phosphor)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                                Text(hit.note)
                                    .font(Theme.mono(14))
                                    .foregroundStyle(Theme.text)
                                    .fixedSize(horizontal: false, vertical: true)
                                ForEach(hit.examples) { example in
                                    NavigationLink(value: ArchiveLink.drug(example.slug)) {
                                        Text(example.name)
                                            .font(Theme.mono(13))
                                            .foregroundStyle(Theme.cyan)
                                            .frame(minHeight: 32, alignment: .leading)
                                    }
                                    .buttonStyle(.plain)
                                }
                                if hit.more > 0 {
                                    Text("and \(hit.more) more")
                                        .font(Theme.mono(12))
                                        .foregroundStyle(Theme.muted)
                                }
                                if let category = hit.category {
                                    Button("Open every \(Copy.categoryLabel(category)) file") {
                                        route.openCategory(category)
                                    }
                                    .font(Theme.mono(12))
                                    .foregroundStyle(Theme.amber)
                                    .frame(minHeight: 32, alignment: .leading)
                                }
                            }
                            .padding(.top, 8)
                            .overlay(alignment: .top) { Rectangle().fill(Theme.line).frame(height: 1) }
                        }
                    }
                    .id("mixes")

                    Panel(title: "HISTORY", code: "HIS", tone: Theme.purple) {
                        Text(drug.history ?? "· see the class record ·")
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .id("history")
                    let events = archive.timeline(mentioning: drug.name)
                    if !events.isEmpty {
                        Panel(title: "IN THE TIMELINE", code: "YEAR", tone: Theme.amber) {
                            Text("Events whose text names \(drug.name). The year is context, not a recipe.")
                                .font(Theme.mono(12))
                                .foregroundStyle(Theme.muted)
                            ForEach(events) { event in
                                Text(String(event.year))
                                    .font(Theme.mono(22))
                                    .foregroundStyle(Theme.phosphor)
                                Text(event.title)
                                    .font(Theme.mono(14, weight: .medium))
                                    .foregroundStyle(Theme.text)
                                Text(event.detail)
                                    .font(Theme.mono(13))
                                    .foregroundStyle(Theme.text)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                    Panel(title: "STATUS", code: "LEG", tone: Theme.amber) {
                        FieldLine(label: "Legal", value: drug.legalStatus)
                        FieldLine(label: "Medical", value: drug.medicalStatus)
                        FieldLine(label: "Medical uses", value: drug.medicalUses)
                    }
                    Panel(title: "REFERENCES", code: "REF") {
                        if refs.isEmpty {
                            Text("No references catalogued.")
                                .font(Theme.mono(13))
                                .foregroundStyle(Theme.muted)
                        }
                        ForEach(refs) { ref in
                            Button {
                                if let url = ref.url.flatMap(URL.init(string:)) {
                                    openURL(url)
                                }
                            } label: {
                                Text(ref.label)
                                    .font(Theme.mono(14))
                                    .foregroundStyle(ref.url == nil ? Theme.text : Theme.cyan)
                                    .frame(maxWidth: .infinity, minHeight: 32, alignment: .leading)
                            }
                            .buttonStyle(.plain)
                            .disabled(ref.url == nil)
                        }
                    }
                    if !neighbors.isEmpty {
                        Panel(title: "NEAR THIS NAME", code: "NEAR", tone: Theme.amber) {
                            Text("Other \(Copy.categoryLabel(drug.category)) files beside this name. Nearness is alphabetical, not a statement that they are interchangeable.")
                                .font(Theme.mono(12))
                                .foregroundStyle(Theme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                            ForEach(neighbors) { item in
                                NavigationLink(value: ArchiveLink.drug(item.slug)) {
                                    Text(item.name)
                                        .font(Theme.mono(18))
                                        .foregroundStyle(Theme.phosphor)
                                        .frame(maxWidth: .infinity, minHeight: 36, alignment: .leading)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    Text(Copy.finePrint)
                        .font(Theme.mono(11))
                        .foregroundStyle(Theme.muted)
                }
                .padding(16)
            }
            .safeAreaInset(edge: .top, spacing: 0) {
                ChipRow {
                    jump("Overview", "overview", proxy, tone: Theme.cyan)
                    jump("Pharmacology", "pharm", proxy, tone: Theme.cyan)
                    jump("Risks", "risk", proxy, tone: Theme.red)
                    jump("Interactions", "mixes", proxy, tone: Theme.red)
                    jump("History", "history", proxy, tone: Theme.cyan)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Theme.bg)
            }
        }
        .archiveScreen()
        .navigationTitle(drug.name)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func section<Content: View>(_ id: String, _ title: String, _ code: String, @ViewBuilder content: () -> Content) -> some View {
        Panel(title: title, code: code) { content() }
            .id(id)
    }

    private func tagBlock(_ label: String, _ values: [String]?, tone: Color) -> some View {
        let items = (values ?? []).filter { !$0.isEmpty }
        return VStack(alignment: .leading, spacing: 6) {
            if !items.isEmpty {
                Text(label)
                    .font(Theme.mono(10))
                    .foregroundStyle(Theme.muted)
                ChipRow {
                    ForEach(items, id: \.self) { item in
                        TagChip(text: item, tone: tone)
                    }
                }
            }
        }
    }

    private func jump(_ title: String, _ id: String, _ proxy: ScrollViewProxy, tone: Color) -> some View {
        Button {
            withAnimation { proxy.scrollTo(id, anchor: .top) }
        } label: {
            TagChip(text: title, tone: tone)
        }
        .buttonStyle(.plain)
    }

    private func load() async {
        missing = false
        guard let drug = await archive.drug(slug: slug) else {
            missing = true
            return
        }
        self.drug = drug
        hits = archive.ruleHits(for: drug)
        refs = await archive.references(for: drug)
        neighbors = await archive.neighbors(of: drug)
        library.remember(Bookmark(kind: "drug", slug: drug.slug, name: drug.name))
    }
}
