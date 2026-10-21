import Foundation

@MainActor
final class ArchiveStore: ObservableObject {
    enum Phase {
        case loading
        case ready
        case failed(String)
    }

    @Published private(set) var phase: Phase = .loading
    private let database = CatalogueDB()
    private var cache = ArchiveCache.empty

    var snapshot: ArchiveSnapshot { cache.snapshot }
    var classes: [DrugClassInfo] { cache.classes }
    var timeline: [TimelineEvent] { cache.timeline }

    func load() async {
        phase = .loading
        do {
            guard let url = Bundle.main.url(forResource: "Catalogue", withExtension: "sqlite") else {
                throw CatalogueError.missing
            }
            cache = try await database.load(url)
            phase = .ready
        } catch {
            phase = .failed(error.localizedDescription)
        }
    }

    func files(term: String, category: String, shelf: String, limit: Int) async -> ListedDrugs {
        await database.listDrugs(term: term, category: category, shelf: shelf, limit: limit)
    }

    func strains(term: String, type: String, limit: Int) async -> (rows: [StrainRecord], total: Int) {
        await database.listStrains(term: term, type: type, limit: limit)
    }

    func drug(slug: String) async -> DrugFile? {
        await database.drug(slug: slug)
    }

    func strain(slug: String) async -> StrainRecord? {
        await database.strain(slug: slug)
    }

    func rows(slugs: [String]) async -> [DrugRow] {
        await database.orderedDrugs(slugs: slugs)
    }

    func drug(named name: String) async -> DrugRow? {
        await database.drug(named: name)
    }

    func neighbors(of drug: DrugFile) async -> [DrugRow] {
        await database.neighbors(category: drug.category, name: drug.name, slug: drug.slug)
    }

    func references(for drug: DrugFile) async -> [ReferenceItem] {
        await database.references(drugID: drug.id)
    }

    func randomDrug() async -> DrugRow? {
        await database.randomDrug()
    }

    func pair(_ slugA: String, _ slugB: String) async -> PairResult? {
        let files = await database.drugs(slugs: [slugA, slugB])
        guard let a = files[slugA], let b = files[slugB] else { return nil }
        return Interaction.evaluate(a, b, rules: cache.rules, membership: cache.membership)
    }

    func facts(_ slugA: String, _ slugB: String) async -> [DrugFile] {
        let files = await database.drugs(slugs: [slugA, slugB])
        return [files[slugA], files[slugB]].compactMap { $0 }
    }

    func ruleHits(for drug: DrugFile) -> [RuleHit] {
        Interaction.hits(drug, rules: cache.rules, groups: cache.groups, membership: cache.membership, names: cache.names)
    }

    func floor(for drug: DrugFile) -> String {
        Interaction.unnamedFloor(drug)
    }

    func chapters(for drug: DrugFile) -> [Chapter] {
        var items: [Chapter] = []
        if let chapter = cache.classChapters[drug.category] {
            items.append(chapter)
        }
        for key in (cache.membership[drug.slug] ?? []).sorted() {
            if let chapter = cache.groupChapters[key] {
                items.append(chapter)
            }
        }
        return items
    }

    func timeline(mentioning name: String) -> [TimelineEvent] {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 3, let regex = try? NSRegularExpression(pattern: "\\b\(NSRegularExpression.escapedPattern(for: trimmed))\\b", options: [.caseInsensitive]) else {
            return []
        }
        return cache.timeline.filter { event in
            let text = "\(event.title)\n\(event.detail)"
            let range = NSRange(text.startIndex..., in: text)
            return regex.firstMatch(in: text, options: [], range: range) != nil
        }
    }
}
