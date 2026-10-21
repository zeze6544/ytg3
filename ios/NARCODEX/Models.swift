import Foundation

struct ArchiveSnapshot {
    var drugCount = 0
    var strainCount = 0
    var classCount = 0
    var generatedAt = ""
    var notice = ""
}

struct DrugRow: Identifiable, Hashable {
    var slug: String
    var name: String
    var category: String
    var evidence: String
    var summary: String
    var id: String { slug }
}

struct DrugFile: Codable, Identifiable {
    var id: String
    var slug: String
    var name: String
    var category: String
    var aliases: [String]?
    var brandNames: [String]?
    var streetNames: [String]?
    var summary: String?
    var history: String?
    var legalStatus: String?
    var medicalStatus: String?
    var chemistry: String?
    var mechanism: String?
    var onset: String?
    var duration: String?
    var halfLife: String?
    var effects: [String]?
    var adverseEffects: [String]?
    var acuteRisks: String?
    var chronicRisks: String?
    var overdoseSigns: String?
    var dependence: String?
    var tolerance: String?
    var withdrawal: String?
    var medicalUses: String?
    var contraindications: String?
    var testing: String?
    var harmReduction: String?
    var evidenceQuality: String
    var discoveredYear: Int?
    var featured: Bool
    var riskClasses: [String]?
}

struct StrainRecord: Identifiable, Hashable {
    var recordID: String
    var slug: String
    var name: String
    var type: String
    var lineage: String
    var thcLow: Double?
    var thcHigh: Double?
    var cbdLow: Double?
    var cbdHigh: Double?
    var confidence: String
    var summary: String
    var terpenes: [String]
    var effects: [String]
    var adverse: [String]
    var id: String { slug }
}

struct DrugClassInfo: Identifiable, Hashable {
    var id: String
    var slug: String
    var name: String
    var description: String
    var color: String
}

struct TimelineEvent: Identifiable, Hashable {
    var id: String
    var year: Int
    var title: String
    var detail: String
    var category: String
}

struct ReferenceItem: Identifiable, Hashable {
    var id: String
    var label: String
    var url: String?
}

struct Chapter: Identifiable, Hashable {
    var id: String
    var title: String
    var paragraphs: [String]
}

struct MixRule {
    var severity: String
    var note: String
    var left: [String]
    var right: [String]
}

struct RuleExample: Identifiable, Hashable {
    var slug: String
    var name: String
    var id: String { slug }
}

struct RuleHit: Identifiable {
    var severity: String
    var note: String
    var other: String
    var examples: [RuleExample]
    var more: Int
    var category: String?
    var index: Int
    var id: String { "\(index)-\(severity)-\(other)" }
}

struct PairResult {
    var severity: String
    var note: String
}

struct ListedDrugs {
    var rows: [DrugRow]
    var total: Int
    var capped: Bool
}

struct ArchiveCache {
    var snapshot = ArchiveSnapshot()
    var rules: [MixRule] = []
    var groups: [String: [String]] = [:]
    var membership: [String: Set<String>] = [:]
    var names: [String: String] = [:]
    var classChapters: [String: Chapter] = [:]
    var groupChapters: [String: Chapter] = [:]
    var classes: [DrugClassInfo] = []
    var timeline: [TimelineEvent] = []

    static let empty = ArchiveCache()
}

enum ArchiveLink: Hashable {
    case drug(String)
    case strain(String)
    case reagent(String)
    case classes
    case timeline
    case reagents
    case saved
    case about
}

enum AppTab: Hashable {
    case home
    case files
    case mix
    case strains
    case more
}

enum CatalogueError: LocalizedError {
    case missing
    case open(String)
    case sql(String)
    case decode(String)

    var errorDescription: String? {
        switch self {
        case .missing:
            return "The catalogue database is not in this app. Xcode runs ios/Scripts/build_catalogue.py during the build and copies Catalogue.sqlite into the app. This repository has not signed or installed a build."
        case .open(let detail):
            return "The catalogue could not be opened. \(detail)"
        case .sql(let detail):
            return "The catalogue query failed. \(detail)"
        case .decode(let detail):
            return "A catalogue record could not be read. \(detail)"
        }
    }
}
