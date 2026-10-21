import Foundation

/// Pair ranking ported from apps/mobile/src/lib/localArchive.ts.
/// ios/Scripts/interaction_model.py checks the same cases against the catalogue.
enum Interaction {
    private static let rank = ["unknown": 0, "low": 1, "moderate": 2, "dangerous": 3, "deadly": 4]
    private static let sedative: Set<String> = ["opioid", "depressant", "benzodiazepine", "anaesthetic", "dissociative", "antipsychotic"]
    private static let falseReversal: Set<String> = ["opioid", "benzodiazepine", "depressant", "dissociative", "stimulant"]
    private static let action = [
        "opioid": "slows breathing",
        "benzodiazepine": "deepens sedation and weakens protective reflexes",
        "depressant": "sedates and can stop breathing",
        "stimulant": "raises heart rate, blood pressure, and temperature",
        "psychedelic": "changes perception and can bring panic or a racing heart",
        "dissociative": "detaches awareness and can lose airway protection",
        "cannabinoid": "changes attention and adds sedation",
        "antidepressant": "changes serotonin signalling and can stay active for days",
        "antipsychotic": "sedates and can drop blood pressure",
        "anaesthetic": "can remove consciousness and breathing",
        "inhalant": "can trigger a sudden heart rhythm",
        "plant_fungi": "carries a species-specific poison that is not standardised",
        "research_chemical": "imitates another class at a strength this file cannot measure",
        "prescription": "can change bleeding, sedation, heart rhythm, hormones, or the level of another drug",
        "otc": "can injure the liver, sedate, or add bleeding",
        "withdrawn": "was removed from markets because it injures an organ",
        "historical": "contains an old poison whose strength the bottle does not state",
        "other": "can change sedation, heart rhythm, bleeding, or the level of another drug",
    ]
    private static let groupLabel = [
        "maoi": "any MAOI",
        "ssri": "any SSRI",
        "snri": "any SNRI",
        "tca": "any tricyclic antidepressant",
        "serotonin": "any serotonergic substance in this group",
        "triptan": "any triptan",
        "disulfiram-like": "any disulfiram-like medicine",
        "nitrite": "any alkyl nitrite",
        "nitrate": "any nitrate",
        "pde5": "any PDE5 inhibitor",
        "nsaid": "any NSAID",
        "qt": "any QT-prolonging drug in this group",
        "diuretic": "any diuretic",
        "penicillin": "any penicillin",
        "beta-agonist": "any beta agonist",
        "acei": "any ACE inhibitor",
        "fluoroquinolone": "any fluoroquinolone",
        "sedating-antihistamine": "any sedating antihistamine",
        "arb": "any ARB",
        "dihydropyridine": "any dihydropyridine calcium-channel blocker",
        "azole": "any azole antifungal",
        "sulfonamide": "any sulfonamide",
        "contraceptive-hormone": "any hormonal contraceptive",
        "corticosteroid": "any corticosteroid",
        "combined-contraceptive": "any combined contraceptive",
        "xanthine": "any xanthine",
        "sulfonylurea": "any sulfonylurea",
        "statin": "any statin",
        "cardiac-glycoside": "any cardiac glycoside",
        "doac": "any direct oral anticoagulant",
        "heparin": "any heparin",
        "vka": "any vitamin K antagonist",
        "alpha-blocker": "any alpha blocker",
        "potassium-sparing": "any potassium-sparing diuretic",
        "potassium-supplement": "any potassium supplement",
        "pethidine-product": "any pethidine product",
        "xanthine-oxidase": "any xanthine-oxidase inhibitor",
        "bleed-herb": "any bleeding-associated plant in this group",
        "statin-like": "any statin-like lipid drug",
        "beta-blocker": "any beta blocker",
    ]
    private static let notReversal = try! NSRegularExpression(pattern: "vitamin k antagonist|\\bnmda\\b", options: [.caseInsensitive])
    private static let yesReversal = try! NSRegularExpression(
        pattern: "opioid antagonist|benzodiazepine antagonist|antagonist medicine|opioid blocker|reversal agent|reverses heparin|wear off before|wears off before|before the opioid",
        options: [.caseInsensitive]
    )

    static func evaluate(_ a: DrugFile, _ b: DrugFile, rules: [MixRule], membership: [String: Set<String>]) -> PairResult? {
        if a.id == b.id || a.slug == b.slug { return nil }
        let groupsA = membership[a.slug] ?? []
        let groupsB = membership[b.slug] ?? []
        var best: MixRule?
        var bestRank = -1
        for rule in rules {
            let hit = (side(a, rule.left, groupsA) && side(b, rule.right, groupsB)) || (side(b, rule.left, groupsB) && side(a, rule.right, groupsA))
            if !hit { continue }
            let value = rank[rule.severity] ?? 0
            if best == nil || value > bestRank {
                best = rule
                bestRank = value
            }
        }
        if let best {
            return PairResult(severity: best.severity, note: pairNote(a, b, best.note))
        }
        if isReversal(a) || isReversal(b) {
            return PairResult(severity: "moderate", note: reversalNote(a, b))
        }
        return PairResult(severity: pairFloor(a, b), note: pairNote(a, b, nil))
    }

    static func hits(_ drug: DrugFile, rules: [MixRule], groups: [String: [String]], membership: [String: Set<String>], names: [String: String]) -> [RuleHit] {
        let groupKeys = membership[drug.slug] ?? []
        var found: [RuleHit] = []
        for (index, rule) in rules.enumerated() {
            let onLeft = side(drug, rule.left, groupKeys)
            let onRight = side(drug, rule.right, groupKeys)
            if !onLeft && !onRight { continue }
            let otherTokens = onLeft ? rule.right : rule.left
            let packed = otherTokens.map { examples(for: $0, selfSlug: drug.slug, groups: groups, names: names) }
            var seen = Set<String>()
            var unique: [RuleExample] = []
            for block in packed {
                for item in block.shown where seen.insert(item.slug).inserted {
                    unique.append(item)
                }
            }
            let resolvedCategory = otherTokens.first { token in
                Copy.categories.contains { $0.id == token }
            }
            found.append(RuleHit(
                severity: rule.severity,
                note: rule.note,
                other: otherTokens.map { tokenLabel($0, names: names) }.joined(separator: " or "),
                examples: Array(unique.prefix(8)),
                more: packed.reduce(0) { $0 + $1.more } + max(0, unique.count - 8),
                category: resolvedCategory,
                index: index
            ))
        }
        return found.sorted { lhs, rhs in
            let left = rank[lhs.severity] ?? 0
            let right = rank[rhs.severity] ?? 0
            if left != right { return left > right }
            return lhs.index < rhs.index
        }
    }

    static func unnamedFloor(_ drug: DrugFile) -> String {
        let name = drug.name
        switch drug.category {
        case "inhalant":
            return "\(name) is an inhalant. A pair with no stored rule is still treated as dangerous, because a sudden heart rhythm can arrive while the other substance is acting."
        case "withdrawn":
            return "\(name) is filed as withdrawn or as a toxic contaminant. A pair with no stored rule is still treated as dangerous."
        case "research_chemical":
            return "\(name) is filed as a research chemical. The material is often a different substance from the name, and a pair with no stored rule is still treated as dangerous."
        case let category where sedative.contains(category):
            return "\(name) sedates. A second sedative with no stored rule is still treated as dangerous, because breathing and protective reflexes fail more easily. A stimulant beside it is also treated as dangerous, because the stimulant can hide that sedation."
        case "stimulant":
            return "\(name) raises heart rate, blood pressure, and temperature. A second stimulant is treated as dangerous. A sedative beside it is also treated as dangerous, because the stimulant can mask the sedation until breathing fails."
        default:
            return "\(name) has a moderate floor when no stored rule names the pair. Moderate describes the pair. It is not permission to combine them."
        }
    }

    private static func tags(_ drug: DrugFile) -> [String] {
        if let tags = drug.riskClasses, !tags.isEmpty { return tags }
        return [drug.category]
    }

    private static func matches(_ drug: DrugFile, _ token: String, _ groupKeys: Set<String>) -> Bool {
        if token.hasPrefix("group:") { return groupKeys.contains(String(token.dropFirst(6))) }
        if drug.slug == token { return true }
        return tags(drug).contains(token)
    }

    private static func side(_ drug: DrugFile, _ tokens: [String], _ groupKeys: Set<String>) -> Bool {
        tokens.contains { matches(drug, $0, groupKeys) }
    }

    private static func collapse(_ text: String) -> String {
        text.split { $0.isWhitespace }.joined(separator: " ")
    }

    private static func present(_ value: String?) -> String {
        let text = value ?? ""
        return text.isEmpty ? "" : text
    }

    private static func firstFact(_ drug: DrugFile) -> String {
        let mechanism = present(drug.mechanism)
        let raw = collapse(mechanism.isEmpty ? present(drug.summary) : mechanism)
        let pattern = "^\(NSRegularExpression.escapedPattern(for: drug.name))[.:]\\s*"
        let stripped = raw.replacingOccurrences(of: pattern, with: "", options: [.regularExpression, .caseInsensitive])
        var fact = ""
        for sentence in sentences(stripped) {
            let piece = sentence.hasSuffix(".") ? sentence : "\(sentence)."
            let next = fact.isEmpty ? piece : "\(fact) \(piece)"
            if !fact.isEmpty && next.count > 180 { break }
            if next.count > 180 {
                var cut = String(next.prefix(170))
                if let range = cut.range(of: #"\s+\S*$"#, options: .regularExpression) {
                    cut = String(cut[..<range.lowerBound])
                }
                fact = cut + "."
            } else {
                fact = next
            }
            if fact.count > 120 { break }
        }
        if !fact.isEmpty { return fact }
        return action[drug.category] ?? "acts on the body as this file describes"
    }

    private static func sentences(_ text: String) -> [String] {
        guard let regex = try? NSRegularExpression(pattern: "(?<=\\.)\\s+") else { return text.isEmpty ? [] : [text] }
        let range = NSRange(text.startIndex..., in: text)
        var last = text.startIndex
        var parts: [String] = []
        regex.enumerateMatches(in: text, range: range) { match, _, _ in
            guard let match, let swiftRange = Range(match.range, in: text) else { return }
            let piece = text[last..<swiftRange.lowerBound].trimmingCharacters(in: .whitespacesAndNewlines)
            if !piece.isEmpty { parts.append(piece) }
            last = swiftRange.upperBound
        }
        let tail = text[last...].trimmingCharacters(in: .whitespacesAndNewlines)
        if !tail.isEmpty { parts.append(tail) }
        return parts
    }

    private static func actionOf(_ drug: DrugFile) -> String {
        action[drug.category] ?? "changes how the body handles the other substance"
    }

    private static func matchesRegex(_ regex: NSRegularExpression, _ text: String) -> Bool {
        let range = NSRange(text.startIndex..., in: text)
        return regex.firstMatch(in: text, range: range) != nil
    }

    private static func isReversal(_ drug: DrugFile) -> Bool {
        if falseReversal.contains(drug.category) { return false }
        let text = "\(present(drug.mechanism)) \(present(drug.summary))"
        if matchesRegex(notReversal, text) { return false }
        return matchesRegex(yesReversal, text)
    }

    private static func hot(_ drug: DrugFile) -> Bool {
        drug.category == "inhalant" || drug.category == "withdrawn" || drug.category == "research_chemical"
    }

    private static func isSedative(_ drug: DrugFile) -> Bool {
        sedative.contains(drug.category)
    }

    private static func pairFloor(_ a: DrugFile, _ b: DrugFile) -> String {
        if hot(a) || hot(b) { return "dangerous" }
        if isSedative(a) && isSedative(b) { return "dangerous" }
        if (a.category == "stimulant" && isSedative(b)) || (b.category == "stimulant" && isSedative(a)) { return "dangerous" }
        if a.category == "stimulant" && b.category == "stimulant" { return "dangerous" }
        return "moderate"
    }

    private static func together(_ a: DrugFile, _ b: DrugFile) -> String {
        if isSedative(a) && isSedative(b) {
            return "\(a.name) and \(b.name) both deepen sedation, so breathing and protective reflexes fail more easily."
        }
        if (a.category == "stimulant" && isSedative(b)) || (b.category == "stimulant" && isSedative(a)) {
            let stimulant = a.category == "stimulant" ? a : b
            let other = stimulant.slug == a.slug ? b : a
            return "\(stimulant.name) can hide the sedation from \(other.name), and breathing can fail after that masking wears thin."
        }
        if a.category == "stimulant" && b.category == "stimulant" {
            return "\(a.name) and \(b.name) both push heart rate, blood pressure, and temperature higher."
        }
        if a.category == "inhalant" || b.category == "inhalant" {
            let inhalant = a.category == "inhalant" ? a : b
            let other = inhalant.slug == a.slug ? b : a
            return "\(inhalant.name) can trigger a sudden heart rhythm while \(other.name) is still acting."
        }
        if a.category == "psychedelic" && b.category == "psychedelic" {
            return "\(a.name) and \(b.name) both change perception, so confusion, panic, and a racing heart can arrive together."
        }
        if a.category == "plant_fungi" || b.category == "plant_fungi" {
            let plant = a.category == "plant_fungi" ? a : b
            let other = plant.slug == a.slug ? b : a
            return "\(plant.name) adds a species-specific poison on top of what \(other.name) already does."
        }
        if a.category == "cannabinoid" || b.category == "cannabinoid" {
            let cannabis = a.category == "cannabinoid" ? a : b
            let other = cannabis.slug == a.slug ? b : a
            return "\(cannabis.name) changes attention and adds sedation while \(other.name) \(actionOf(other))."
        }
        return "\(a.name) \(actionOf(a)), while \(b.name) \(actionOf(b)), so both reactions happen in the same hour."
    }

    private static func pairNote(_ a: DrugFile, _ b: DrugFile, _ ruleNote: String?) -> String {
        let body = ruleNote.map { "\($0) \(together(a, b))" } ?? together(a, b)
        return "\(a.name) with \(b.name). \(body) \(a.name): \(firstFact(a)) \(b.name): \(firstFact(b)) This file has no dose."
    }

    private static func reversalNote(_ a: DrugFile, _ b: DrugFile) -> String {
        if isReversal(a) && isReversal(b) {
            return "\(a.name) with \(b.name). Both can block part of another drug, and each can wear off on its own clock. Together they do not cancel into a safe state. \(a.name): \(firstFact(a)) \(b.name): \(firstFact(b)) This file has no dose."
        }
        let blocker = isReversal(a) ? a : b
        let other = blocker.slug == a.slug ? b : a
        return "\(blocker.name) with \(other.name). \(blocker.name) can block or reverse only part of \(other.name), and only while \(blocker.name) is still acting. It can wear off first, and then \(other.name) can return. \(blocker.name) does not make \(other.name) safe. \(blocker.name): \(firstFact(blocker)) \(other.name): \(firstFact(other)) This file has no dose."
    }

    private static func tokenLabel(_ token: String, names: [String: String]) -> String {
        if token.hasPrefix("group:") {
            let key = String(token.dropFirst(6))
            return groupLabel[key] ?? "the \(key) group"
        }
        if Copy.categories.contains(where: { $0.id == token }) {
            return "any \(Copy.categoryLabel(token).lowercased())"
        }
        return names[token] ?? token
    }

    private static func examples(for token: String, selfSlug: String, groups: [String: [String]], names: [String: String]) -> (shown: [RuleExample], more: Int) {
        let slugs: [String]
        if token.hasPrefix("group:") {
            slugs = (groups[String(token.dropFirst(6))] ?? []).filter { $0 != selfSlug }
        } else if names[token] != nil && token != selfSlug {
            slugs = [token]
        } else {
            slugs = []
        }
        let rows = slugs.compactMap { slug -> RuleExample? in
            guard let name = names[slug] else { return nil }
            return RuleExample(slug: slug, name: name)
        }
        return (Array(rows.prefix(8)), max(0, rows.count - 8))
    }
}
