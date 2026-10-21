import SwiftUI

@main
struct NARCODEXApp: App {
    @StateObject private var archive = ArchiveStore()
    @StateObject private var library = Library()
    @StateObject private var route = AppRoute()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(archive)
                .environmentObject(library)
                .environmentObject(route)
                .preferredColorScheme(.dark)
        }
    }
}
