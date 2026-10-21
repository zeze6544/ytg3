import SwiftUI

struct RootView: View {
    @EnvironmentObject private var archive: ArchiveStore
    @EnvironmentObject private var library: Library
    @EnvironmentObject private var route: AppRoute

    var body: some View {
        Group {
            if !library.accepted {
                GateView()
            } else {
                switch archive.phase {
                case .loading:
                    IndexingView()
                case .failed(let message):
                    FailureView(message: message)
                case .ready:
                    MainTabs()
                }
            }
        }
        .task { await archive.load() }
        .preferredColorScheme(.dark)
    }
}

private struct GateView: View {
    @EnvironmentObject private var library: Library

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Wordmark()
                Panel(title: "ADULT ARCHIVE", code: "18+", tone: Theme.amber) {
                    Text("NARCØDEX is a harm-reduction reference for adults. It describes substances, risks, interactions, and history. It is not medical advice, not a dosing tool, and not a place to buy, make, or hide anything. It does not tell anyone to use drugs.")
                        .font(Theme.mono(13))
                        .foregroundStyle(Theme.text)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("If someone is unresponsive, not breathing, or you think they have taken too much, contact local emergency services. Do not wait on this app.")
                        .font(Theme.mono(12))
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                ActionButton(title: "I am 18 or older. Enter the archive") {
                    library.accept()
                }
                Text("If you are under 18, close the app. The archive stays locked until an adult confirms.")
                    .font(Theme.mono(11))
                    .foregroundStyle(Theme.muted)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(16)
        }
        .archiveScreen()
    }
}

private struct IndexingView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Wordmark()
            Text("OPENING THE INDEX")
                .font(Theme.mono(14, weight: .medium))
                .foregroundStyle(Theme.cyan)
            Text("Reading the catalogue stored in this app.")
                .font(Theme.mono(13))
                .foregroundStyle(Theme.text)
        }
        .padding(16)
        .archiveScreen()
    }
}

private struct FailureView: View {
    @EnvironmentObject private var archive: ArchiveStore
    var message: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Wordmark()
                Text("INDEX OFFLINE")
                    .font(Theme.mono(14, weight: .medium))
                    .foregroundStyle(Theme.red)
                Text(message)
                    .font(Theme.mono(13))
                    .foregroundStyle(Theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                ActionButton(title: "Try again", tone: Theme.amber) {
                    Task { await archive.load() }
                }
            }
            .padding(16)
        }
        .archiveScreen()
    }
}

private struct MainTabs: View {
    @EnvironmentObject private var route: AppRoute

    var body: some View {
        TabView(selection: $route.tab) {
            NavigationStack(path: $route.homePath) {
                HomeView().archiveDestinations()
            }
            .tabItem { Label("Home", systemImage: "terminal") }
            .tag(AppTab.home)

            NavigationStack {
                FilesView().archiveDestinations()
            }
            .tabItem { Label("Files", systemImage: "doc.text") }
            .tag(AppTab.files)

            NavigationStack {
                MixView().archiveDestinations()
            }
            .tabItem { Label("Mix", systemImage: "exclamationmark.triangle") }
            .tag(AppTab.mix)

            NavigationStack {
                StrainsView().archiveDestinations()
            }
            .tabItem { Label("Strains", systemImage: "leaf") }
            .tag(AppTab.strains)

            NavigationStack(path: $route.morePath) {
                MoreView().archiveDestinations()
            }
            .tabItem { Label("More", systemImage: "square.grid.2x2") }
            .tag(AppTab.more)
        }
        .tint(Theme.phosphor)
        .toolbarBackground(Theme.panel, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .preferredColorScheme(.dark)
    }
}

