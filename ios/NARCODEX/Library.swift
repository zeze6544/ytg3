import Foundation
import SwiftUI

struct Bookmark: Codable, Identifiable, Hashable {
    var kind: String
    var slug: String
    var name: String
    var id: String { "\(kind):\(slug)" }
}

@MainActor
final class Library: ObservableObject {
    @Published var accepted: Bool
    @Published private(set) var saved: [Bookmark]
    @Published private(set) var recent: [Bookmark]

    init() {
        let defaults = UserDefaults.standard
        accepted = defaults.bool(forKey: Keys.gate)
        saved = Self.read(Keys.saved)
        recent = Self.read(Keys.recent)
    }

    func accept() {
        accepted = true
        UserDefaults.standard.set(true, forKey: Keys.gate)
    }

    func lock() {
        accepted = false
        UserDefaults.standard.set(false, forKey: Keys.gate)
    }

    func contains(_ item: Bookmark) -> Bool {
        saved.contains { $0.id == item.id }
    }

    func toggle(_ item: Bookmark) {
        if let index = saved.firstIndex(where: { $0.id == item.id }) {
            saved.remove(at: index)
        } else {
            saved.insert(item, at: 0)
        }
        Self.write(saved, key: Keys.saved)
    }

    func remember(_ item: Bookmark) {
        recent.removeAll { $0.id == item.id }
        recent.insert(item, at: 0)
        if recent.count > 12 {
            recent = Array(recent.prefix(12))
        }
        Self.write(recent, key: Keys.recent)
    }

    func removeSaved(_ item: Bookmark) {
        saved.removeAll { $0.id == item.id }
        Self.write(saved, key: Keys.saved)
    }

    private enum Keys {
        static let gate = "narcodex.gate"
        static let saved = "narcodex.saved"
        static let recent = "narcodex.recent"
    }

    private static func read(_ key: String) -> [Bookmark] {
        guard let data = UserDefaults.standard.data(forKey: key) else { return [] }
        return (try? JSONDecoder().decode([Bookmark].self, from: data)) ?? []
    }

    private static func write(_ items: [Bookmark], key: String) {
        let data = try? JSONEncoder().encode(items)
        UserDefaults.standard.set(data, forKey: key)
    }
}

@MainActor
final class AppRoute: ObservableObject {
    @Published var tab: AppTab = .home
    @Published var mixSlug: String?
    @Published var mixName: String?
    @Published var mixToken = 0
    @Published var fileCategory = "all"
    @Published var fileJump = 0
    @Published var homePath = NavigationPath()
    @Published var morePath = NavigationPath()

    func checkMix(slug: String, name: String) {
        mixSlug = slug
        mixName = name
        mixToken += 1
        tab = .mix
    }

    func openCategory(_ category: String) {
        fileCategory = category
        fileJump += 1
        tab = .files
    }
}
