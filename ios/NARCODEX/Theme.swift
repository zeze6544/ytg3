import SwiftUI

enum Theme {
    static let bg = Color(red: 7 / 255, green: 20 / 255, blue: 12 / 255)
    static let panel = Color(red: 16 / 255, green: 33 / 255, blue: 23 / 255)
    static let panel2 = Color(red: 22 / 255, green: 48 / 255, blue: 31 / 255)
    static let line = Color(red: 47 / 255, green: 90 / 255, blue: 56 / 255)
    static let phosphor = Color(red: 198 / 255, green: 255 / 255, blue: 74 / 255)
    static let cyan = Color(red: 94 / 255, green: 226 / 255, blue: 255 / 255)
    static let amber = Color(red: 255 / 255, green: 193 / 255, blue: 74 / 255)
    static let red = Color(red: 255 / 255, green: 92 / 255, blue: 74 / 255)
    static let purple = Color(red: 213 / 255, green: 139 / 255, blue: 255 / 255)
    static let text = Color(red: 231 / 255, green: 255 / 255, blue: 196 / 255)
    static let muted = Color(red: 142 / 255, green: 174 / 255, blue: 134 / 255)

    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }

    static func tone(_ name: String) -> Color {
        switch name {
        case "phosphor": return phosphor
        case "cyan": return cyan
        case "amber": return amber
        case "red": return red
        case "purple": return purple
        default: return phosphor
        }
    }

    static func categoryTone(_ category: String) -> Color {
        switch category {
        case "opioid", "inhalant", "research_chemical", "withdrawn": return red
        case "stimulant", "anaesthetic", "otc", "historical": return amber
        case "depressant", "benzodiazepine", "antidepressant", "antipsychotic", "prescription": return cyan
        case "psychedelic", "dissociative": return purple
        default: return phosphor
        }
    }

    static func evidenceTone(_ evidence: String) -> Color {
        switch evidence {
        case "established": return phosphor
        case "limited": return cyan
        case "anecdotal": return amber
        case "disputed": return purple
        default: return red
        }
    }

    static func strainTone(_ type: String) -> Color {
        switch type {
        case "indica": return purple
        case "sativa": return amber
        case "ruderalis": return phosphor
        default: return cyan
        }
    }

    static func severityTone(_ severity: String) -> Color {
        switch severity {
        case "low": return phosphor
        case "moderate": return amber
        case "dangerous", "deadly": return red
        default: return cyan
        }
    }
}

enum Copy {
    static let categories: [(id: String, label: String)] = [
        ("all", "All"),
        ("opioid", "Opioid"),
        ("stimulant", "Stimulant"),
        ("depressant", "Depressant"),
        ("benzodiazepine", "Benzodiazepine"),
        ("psychedelic", "Psychedelic"),
        ("dissociative", "Dissociative"),
        ("cannabinoid", "Cannabinoid"),
        ("antidepressant", "Antidepressant"),
        ("antipsychotic", "Antipsychotic"),
        ("anaesthetic", "Anaesthetic"),
        ("inhalant", "Inhalant"),
        ("plant_fungi", "Plant / Fungi"),
        ("research_chemical", "Research Chemical"),
        ("prescription", "Prescription"),
        ("otc", "OTC"),
        ("withdrawn", "Withdrawn"),
        ("historical", "Historical"),
        ("other", "Other"),
    ]

    static func categoryLabel(_ id: String) -> String {
        categories.first { $0.id == id }?.label ?? id
    }

    static let popularSlugs = [
        "alcohol-ethanol", "nicotine", "caffeine", "thc", "cocaine", "heroin", "methamphetamine", "mdma",
    ]

    static let commonSlugs = [
        "alcohol-ethanol", "nicotine", "caffeine", "cannabis", "thc", "cocaine", "heroin", "fentanyl",
        "morphine", "oxycodone", "codeine", "tramadol", "methadone", "buprenorphine", "xylazine",
        "isotonitazene", "methamphetamine", "amphetamine", "mdma", "ketamine", "lsd", "psilocybin",
        "liberty-cap", "diazepam", "alprazolam", "clonazepam", "etizolam", "ghb", "gbl", "nitrous-oxide",
        "kratom", "kava", "dxm", "diphenhydramine", "ibuprofen", "paracetamol", "naloxone", "naltrexone",
        "pregabalin", "gabapentin", "sertraline", "fluoxetine", "quetiapine", "lithium", "warfarin",
        "sildenafil", "nitroglycerin", "amyl-nitrite", "prazosin",
    ]

    static let safetyLines = [
        "Never mix opioids with benzodiazepines or alcohol.",
        "Test a batch. A reagent colour is not a dose and not a clearance.",
        "Fentanyl and nitazenes still show up in supplies that were not sold as opioids.",
        "If you are not sure what it is, do not take it.",
        "This archive does not tell anyone to use drugs.",
    ]

    static let finePrint = "Not medical advice. Not a dose, a source, or a reason to use a substance."
}
