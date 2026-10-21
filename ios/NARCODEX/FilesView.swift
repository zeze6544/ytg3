import SwiftUI

struct FilesView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var route: AppRoute
    @State private var search = ""
    @State private var term = ""
    @State private var category = "all"
    @State private var shelf = "common"
    @State private var shown = 40
    @State private var rows: [DrugRow] = []
    @State private var total = 0
    @State private var capped = false

    private let letters = ["common", "all"] + (65...90).map { String(UnicodeScalar($0)) } + ["#"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ChipRow {
                    ForEach(letters, id: \.self) { letter in
                        let on = shelf == letter && term.isEmpty
                        Button {
                            shelf = letter
                            search = ""
                            term = ""
                            shown = 40
                        } label: {
                            TagChip(text: letter == "common" ? "Common" : letter == "all" ? "All" : letter, tone: on ? Theme.amber : Theme.phosphor, filled: on)
                        }
                        .buttonStyle(.plain)
                    }
                }
                ChipRow {
                    ForEach(Copy.categories, id: \.id) { item in
                        let on = category == item.id
                        Button {
                            category = item.id
                            shown = 40
                        } label: {
                            TagChip(text: item.label, tone: on ? Theme.cyan : Theme.muted, filled: on)
                        }
                        .buttonStyle(.plain)
                    }
                }
                if rows.isEmpty {
                    Text(term.isEmpty ? "No files on this shelf." : "No files match that search.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.muted)
                }
                ForEach(rows) { row in
                    NavigationLink(value: ArchiveLink.drug(row.slug)) {
                        FileRow(title: row.name, subtitle: row.summary, tag: Copy.categoryLabel(row.category), tone: Theme.categoryTone(row.category))
                    }
                    .buttonStyle(.plain)
                }
                if canLoadMore {
                    ActionButton(title: "Load more", tone: Theme.cyan) { shown += 40 }
                }
                Text(capped ? "Showing \(rows.count). More matches exist." : "Showing \(rows.count) of \(formatCount(total)).")
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                Text(Copy.finePrint)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("FILES")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $search, prompt: "Name, alias, or street name")
        .task(id: search) {
            try? await Task.sleep(nanoseconds: 140_000_000)
            let next = search.trimmingCharacters(in: .whitespacesAndNewlines)
            if next != term {
                term = next
                shown = 40
            }
        }
        .task(id: "\(term)|\(category)|\(shelf)|\(shown)|\(route.fileJump)") {
            let listed = await archive.files(term: term, category: category, shelf: shelf, limit: shown)
            rows = listed.rows
            total = listed.total
            capped = listed.capped
        }
        .onChange(of: route.fileJump) { _, _ in
            category = route.fileCategory
            shelf = "all"
            search = ""
            term = ""
            shown = 40
        }
    }

    private var canLoadMore: Bool {
        if !term.isEmpty { return capped && shown < 400 }
        if shelf == "common" { return false }
        return rows.count < total
    }
}
