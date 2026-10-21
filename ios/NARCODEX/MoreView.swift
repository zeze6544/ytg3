import SwiftUI

struct MoreView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                moreLink(.classes, "Classes", "The 18 stored classes")
                moreLink(.timeline, "Timeline", "Years from the catalogue")
                moreLink(.reagents, "Reagents", "Colour checks, not a clearance")
                moreLink(.saved, "Saved", "Files kept on this device")
                moreLink(.about, "About", "What this app is, and what it is not")
                Text(Copy.finePrint)
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                    .padding(.top, 12)
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("MORE")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func moreLink(_ link: ArchiveLink, _ title: String, _ note: String) -> some View {
        NavigationLink(value: link) {
            FileRow(title: title, subtitle: note, tag: "OPEN", tone: Theme.cyan)
        }
        .buttonStyle(.plain)
    }
}

struct ClassListView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var route: AppRoute

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ForEach(archive.classes) { item in
                    Panel(title: item.name.uppercased(), code: item.slug.uppercased(), tone: Theme.categoryTone(item.slug)) {
                        Text(item.description.isEmpty ? "No class note is stored." : item.description)
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        ActionButton(title: "Open \(item.name) files", tone: Theme.cyan) {
                            route.openCategory(item.slug)
                        }
                    }
                }
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("CLASSES")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct TimelineListView: View {
    @EnvironmentObject private var archive: ArchiveStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                ForEach(archive.timeline) { event in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(String(event.year))
                            .font(Theme.mono(22))
                            .foregroundStyle(Theme.phosphor)
                        Text(event.title)
                            .font(Theme.mono(15, weight: .medium))
                            .foregroundStyle(Theme.text)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(event.detail)
                            .font(Theme.mono(13))
                            .foregroundStyle(Theme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .overlay(alignment: .bottom) { Rectangle().fill(Theme.line).frame(height: 1) }
                    .padding(.bottom, 8)
                }
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("TIMELINE")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct SavedListView: View {
    @EnvironmentObject private var library: Library

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 8) {
                Text("Saved files stay on this iPhone. They are not the website account.")
                    .font(Theme.mono(12))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                if library.saved.isEmpty {
                    Text("No saved files.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.muted)
                        .padding(.top, 8)
                }
                ForEach(library.saved) { item in
                    NavigationLink(value: item.kind == "strain" ? ArchiveLink.strain(item.slug) : ArchiveLink.drug(item.slug)) {
                        FileRow(title: item.name, subtitle: item.kind == "strain" ? "Strain" : "Substance", tag: "SAVED", tone: Theme.phosphor)
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button("Remove", role: .destructive) { library.removeSaved(item) }
                    }
                }
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("SAVED")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AboutView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var library: Library
    @Environment(\.openURL) private var openURL

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Wordmark()
                Text("Native iOS app. SwiftUI screens, its own icon, and the catalogue stored in the app. It does not load the website in a web view.")
                    .font(Theme.mono(13))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                Panel(title: "THIS COPY", code: "VER", tone: Theme.cyan) {
                    Text("Version \(version) (\(build))")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.text)
                    Text("Index date: \(archive.snapshot.generatedAt.isEmpty ? "·" : archive.snapshot.generatedAt)")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.text)
                    Text("\(formatCount(archive.snapshot.drugCount)) substances, \(formatCount(archive.snapshot.strainCount)) strains, \(archive.snapshot.classCount) classes.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.phosphor)
                }
                Panel(title: "SIGNING", code: "ID", tone: Theme.amber) {
                    Text("Install it from Xcode with your own Apple Account. A free Personal Team profile expires after 7 days. When the app stops opening, connect the iPhone and press Run again. The repository did not sign or install this copy.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.text)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text(archive.snapshot.notice)
                    .font(Theme.mono(12))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
                Text("Not medical advice. Not a dose, a source, a synthesis guide, or a place to buy anything. If someone is unresponsive or not breathing, contact local emergency services.")
                    .font(Theme.mono(13))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                Button("Open the public website") {
                    if let url = URL(string: "https://narcodex.surge.sh") {
                        openURL(url)
                    }
                }
                .font(Theme.mono(13))
                .foregroundStyle(Theme.cyan)
                .frame(minHeight: 44, alignment: .leading)
                ActionButton(title: "Lock the archive", tone: Theme.amber) {
                    library.lock()
                }
            }
            .padding(16)
        }
        .archiveScreen()
        .navigationTitle("ABOUT")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var version: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0.0"
    }

    private var build: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
    }
}
