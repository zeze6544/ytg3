import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var library: Library
    @EnvironmentObject private var route: AppRoute
    @State private var popular: [DrugRow] = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Wordmark()
                Rectangle().fill(Theme.line).frame(width: 72, height: 1)
                Text("PUBLIC SUBSTANCE ARCHIVE")
                    .font(Theme.mono(12, weight: .medium))
                    .foregroundStyle(Theme.cyan)
                Panel(title: "ARCHIVE", code: "STAT", tone: Theme.cyan) {
                    stat("DRUGS", archive.snapshot.drugCount) { route.tab = .files }
                    stat("CANNABIS STRAINS", archive.snapshot.strainCount) { route.tab = .strains }
                    stat("CLASSES", archive.snapshot.classCount) {
                        route.morePath.append(ArchiveLink.classes)
                        route.tab = .more
                    }
                    Text(String(repeating: "█", count: 20))
                        .font(Theme.mono(14))
                        .foregroundStyle(Theme.phosphor)
                    Text("DATABASE STATUS: ON THIS DEVICE")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.text)
                    Text("LAST INDEX UPDATE: \(archive.snapshot.generatedAt.isEmpty ? "·" : archive.snapshot.generatedAt)")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.text)
                    Text("FILES AVAILABLE: \(formatCount(archive.snapshot.drugCount + archive.snapshot.strainCount))")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.phosphor)
                    ActionButton(title: "Browse files") { route.tab = .files }
                    ActionButton(title: "Check a mix", tone: Theme.red) { route.tab = .mix }
                    ActionButton(title: "Surprise file", tone: Theme.purple) {
                        Task {
                            if let row = await archive.randomDrug() {
                                route.homePath.append(ArchiveLink.drug(row.slug))
                            }
                        }
                    }
                    Text("Nothing here is dosing advice, a sale, or a green light.")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if !archive.snapshot.notice.isEmpty {
                    Text(archive.snapshot.notice)
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Panel(title: "READ FIRST", code: "HR", tone: Theme.red) {
                    ForEach(Copy.safetyLines, id: \.self) { line in
                        Text(line)
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                if !popular.isEmpty {
                    Text("OPEN FILES")
                        .font(Theme.mono(12, weight: .medium))
                        .foregroundStyle(Theme.cyan)
                    ForEach(popular) { row in
                        NavigationLink(value: ArchiveLink.drug(row.slug)) {
                            FileRow(title: row.name, subtitle: row.summary, tag: Copy.categoryLabel(row.category), tone: Theme.categoryTone(row.category))
                        }
                        .buttonStyle(.plain)
                    }
                }
                if !library.recent.isEmpty {
                    Text("RECENT")
                        .font(Theme.mono(12, weight: .medium))
                        .foregroundStyle(Theme.amber)
                    ForEach(library.recent) { item in
                        NavigationLink(value: item.kind == "strain" ? ArchiveLink.strain(item.slug) : ArchiveLink.drug(item.slug)) {
                            FileRow(title: item.name, subtitle: item.kind == "strain" ? "Strain" : "Substance", tag: item.kind.uppercased(), tone: Theme.cyan)
                        }
                        .buttonStyle(.plain)
                    }
                }
                Text(Copy.finePrint)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            .padding(16)
        }
        .archiveScreen()
        .toolbar(.hidden, for: .navigationBar)
        .task {
            popular = await archive.rows(slugs: Copy.popularSlugs)
        }
    }

    private func stat(_ label: String, _ value: Int, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 2) {
                Text(formatCount(value))
                    .font(Theme.mono(48))
                    .foregroundStyle(Theme.phosphor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.4)
                Text(label)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .buttonStyle(.plain)
    }
}
