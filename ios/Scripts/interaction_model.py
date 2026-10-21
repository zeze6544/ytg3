"""Pair notes for the native app.

This is the same ranking as apps/mobile/src/lib/localArchive.ts.
The Swift file ios/NARCODEX/Interaction.swift follows this file.
"""

from __future__ import annotations

import re

RANK = {"unknown": 0, "low": 1, "moderate": 2, "dangerous": 3, "deadly": 4}
SEDATIVE = {"opioid", "depressant", "benzodiazepine", "anaesthetic", "dissociative", "antipsychotic"}
FALSE_REVERSAL = {"opioid", "benzodiazepine", "depressant", "dissociative", "stimulant"}
ACTION = {
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
}
NOT_REVERSAL = re.compile(r"vitamin k antagonist|\bnmda\b", re.I)
YES_REVERSAL = re.compile(
    r"opioid antagonist|benzodiazepine antagonist|antagonist medicine|opioid blocker|reversal agent|reverses heparin|wear off before|wears off before|before the opioid",
    re.I,
)
GROUP_LABEL = {
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
}
CATEGORY_LABELS = {
    "opioid": "Opioid",
    "stimulant": "Stimulant",
    "depressant": "Depressant",
    "benzodiazepine": "Benzodiazepine",
    "psychedelic": "Psychedelic",
    "dissociative": "Dissociative",
    "cannabinoid": "Cannabinoid",
    "antidepressant": "Antidepressant",
    "antipsychotic": "Antipsychotic",
    "anaesthetic": "Anaesthetic",
    "inhalant": "Inhalant",
    "plant_fungi": "Plant / Fungi",
    "research_chemical": "Research Chemical",
    "prescription": "Prescription",
    "otc": "OTC",
    "withdrawn": "Withdrawn",
    "historical": "Historical",
    "other": "Other",
}


def tags_of(drug: dict) -> list[str]:
    tags = drug.get("risk_classes") or []
    return list(tags) if tags else [drug["category"]]


def matches(drug: dict, token: str, group_keys: set[str]) -> bool:
    if token.startswith("group:"):
        return token[6:] in group_keys
    if drug["slug"] == token:
        return True
    return token in tags_of(drug)


def side_matches(drug: dict, tokens: list[str], group_keys: set[str]) -> bool:
    return any(matches(drug, token, group_keys) for token in tokens)


def collapse(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def first_fact(drug: dict) -> str:
    raw = collapse((drug.get("mechanism") or "") or (drug.get("summary") or ""))
    stripped = re.sub(rf"^{re.escape(drug['name'])}[.:]\s*", "", raw, count=1, flags=re.I)
    sentences = [part.strip() for part in re.split(r"(?<=\.)\s+", stripped) if part.strip()]
    fact = ""
    for sentence in sentences:
        piece = sentence if sentence.endswith(".") else f"{sentence}."
        nxt = f"{fact} {piece}" if fact else piece
        if fact and len(nxt) > 180:
            break
        if len(nxt) > 180:
            cut = re.sub(r"\s+\S*$", "", nxt[:170], count=1)
            fact = f"{cut}."
        else:
            fact = nxt
        if len(fact) > 120:
            break
    return fact or ACTION.get(drug["category"]) or "acts on the body as this file describes"


def action_of(drug: dict) -> str:
    return ACTION.get(drug["category"], "changes how the body handles the other substance")


def is_reversal(drug: dict) -> bool:
    if drug["category"] in FALSE_REVERSAL:
        return False
    text = f"{drug.get('mechanism') or ''} {drug.get('summary') or ''}"
    if NOT_REVERSAL.search(text):
        return False
    return YES_REVERSAL.search(text) is not None


def pair_floor(a: dict, b: dict) -> str:
    def hot(drug: dict) -> bool:
        return drug["category"] in {"inhalant", "withdrawn", "research_chemical"}

    if hot(a) or hot(b):
        return "dangerous"

    def sed(drug: dict) -> bool:
        return drug["category"] in SEDATIVE

    if sed(a) and sed(b):
        return "dangerous"
    if (a["category"] == "stimulant" and sed(b)) or (b["category"] == "stimulant" and sed(a)):
        return "dangerous"
    if a["category"] == "stimulant" and b["category"] == "stimulant":
        return "dangerous"
    return "moderate"


def together(a: dict, b: dict) -> str:
    def sed(drug: dict) -> bool:
        return drug["category"] in SEDATIVE

    if sed(a) and sed(b):
        return f"{a['name']} and {b['name']} both deepen sedation, so breathing and protective reflexes fail more easily."
    if (a["category"] == "stimulant" and sed(b)) or (b["category"] == "stimulant" and sed(a)):
        stimulant = a if a["category"] == "stimulant" else b
        other = b if stimulant is a else a
        return f"{stimulant['name']} can hide the sedation from {other['name']}, and breathing can fail after that masking wears thin."
    if a["category"] == "stimulant" and b["category"] == "stimulant":
        return f"{a['name']} and {b['name']} both push heart rate, blood pressure, and temperature higher."
    if a["category"] == "inhalant" or b["category"] == "inhalant":
        inhalant = a if a["category"] == "inhalant" else b
        other = b if inhalant is a else a
        return f"{inhalant['name']} can trigger a sudden heart rhythm while {other['name']} is still acting."
    if a["category"] == "psychedelic" and b["category"] == "psychedelic":
        return f"{a['name']} and {b['name']} both change perception, so confusion, panic, and a racing heart can arrive together."
    if a["category"] == "plant_fungi" or b["category"] == "plant_fungi":
        plant = a if a["category"] == "plant_fungi" else b
        other = b if plant is a else a
        return f"{plant['name']} adds a species-specific poison on top of what {other['name']} already does."
    if a["category"] == "cannabinoid" or b["category"] == "cannabinoid":
        cannabis = a if a["category"] == "cannabinoid" else b
        other = b if cannabis is a else a
        return f"{cannabis['name']} changes attention and adds sedation while {other['name']} {action_of(other)}."
    return f"{a['name']} {action_of(a)}, while {b['name']} {action_of(b)}, so both reactions happen in the same hour."


def pair_note(a: dict, b: dict, rule_note: str | None = None) -> str:
    body = f"{rule_note} {together(a, b)}" if rule_note else together(a, b)
    return f"{a['name']} with {b['name']}. {body} {a['name']}: {first_fact(a)} {b['name']}: {first_fact(b)} This file has no dose."


def reversal_note(a: dict, b: dict) -> str:
    if is_reversal(a) and is_reversal(b):
        return (
            f"{a['name']} with {b['name']}. Both can block part of another drug, and each can wear off on its own clock. "
            f"Together they do not cancel into a safe state. {a['name']}: {first_fact(a)} {b['name']}: {first_fact(b)} This file has no dose."
        )
    blocker = a if is_reversal(a) else b
    other = b if blocker is a else a
    return (
        f"{blocker['name']} with {other['name']}. {blocker['name']} can block or reverse only part of {other['name']}, "
        f"and only while {blocker['name']} is still acting. It can wear off first, and then {other['name']} can return. "
        f"{blocker['name']} does not make {other['name']} safe. {blocker['name']}: {first_fact(blocker)} {other['name']}: {first_fact(other)} This file has no dose."
    )


def interact(a: dict | None, b: dict | None, rules: list[dict], membership: dict[str, set[str]]) -> dict | None:
    if not a or not b or a.get("id") == b.get("id") or a.get("slug") == b.get("slug"):
        return None
    groups_a = membership.get(a["slug"], set())
    groups_b = membership.get(b["slug"], set())
    best = None
    best_rank = -1
    for rule in rules:
        hit = (side_matches(a, rule["left"], groups_a) and side_matches(b, rule["right"], groups_b)) or (
            side_matches(b, rule["left"], groups_b) and side_matches(a, rule["right"], groups_a)
        )
        if not hit:
            continue
        rank = RANK.get(rule["severity"], 0)
        if best is None or rank > best_rank:
            best = rule
            best_rank = rank
    if best:
        return {"severity": best["severity"], "note": pair_note(a, b, best["note"])}
    if is_reversal(a) or is_reversal(b):
        return {"severity": "moderate", "note": reversal_note(a, b)}
    return {"severity": pair_floor(a, b), "note": pair_note(a, b)}


def token_label(token: str, names: dict[str, str]) -> str:
    if token.startswith("group:"):
        key = token[6:]
        return GROUP_LABEL.get(key, f"the {key} group")
    if token in CATEGORY_LABELS:
        return f"any {CATEGORY_LABELS[token].lower()}"
    return names.get(token, token)


def examples_for(token: str, self_slug: str, groups: dict[str, list[str]], names: dict[str, str]) -> dict:
    if token.startswith("group:"):
        slugs = [slug for slug in groups.get(token[6:], []) if slug != self_slug]
    elif token in names and token != self_slug:
        slugs = [token]
    else:
        slugs = []
    rows = [{"slug": slug, "name": names[slug]} for slug in slugs if slug in names]
    return {"shown": rows[:8], "more": max(0, len(rows) - 8)}


def rule_hits(drug: dict, rules: list[dict], groups: dict[str, list[str]], membership: dict[str, set[str]], names: dict[str, str]) -> list[dict]:
    hits = []
    group_keys = membership.get(drug["slug"], set())
    for index, rule in enumerate(rules):
        on_left = side_matches(drug, rule["left"], group_keys)
        on_right = side_matches(drug, rule["right"], group_keys)
        if not on_left and not on_right:
            continue
        other_tokens = rule["right"] if on_left else rule["left"]
        category = next((token for token in other_tokens if token in CATEGORY_LABELS), None)
        packed = [examples_for(token, drug["slug"], groups, names) for token in other_tokens]
        examples = [item for block in packed for item in block["shown"]]
        seen: set[str] = set()
        unique = []
        for item in examples:
            if item["slug"] in seen:
                continue
            seen.add(item["slug"])
            unique.append(item)
        hits.append(
            {
                "severity": rule["severity"],
                "note": rule["note"],
                "other": " or ".join(token_label(token, names) for token in other_tokens),
                "examples": unique[:8],
                "more": sum(block["more"] for block in packed) + max(0, len(unique) - 8),
                "category": category,
                "index": index,
            }
        )
    hits.sort(key=lambda hit: (-RANK.get(hit["severity"], 0), hit["index"]))
    for hit in hits:
        hit.pop("index", None)
    return hits


def unnamed_floor(drug: dict) -> str:
    name = drug["name"]
    category = drug["category"]
    if category == "inhalant":
        return f"{name} is an inhalant. A pair with no stored rule is still treated as dangerous, because a sudden heart rhythm can arrive while the other substance is acting."
    if category == "withdrawn":
        return f"{name} is filed as withdrawn or as a toxic contaminant. A pair with no stored rule is still treated as dangerous."
    if category == "research_chemical":
        return f"{name} is filed as a research chemical. The material is often a different substance from the name, and a pair with no stored rule is still treated as dangerous."
    if category in SEDATIVE:
        return f"{name} sedates. A second sedative with no stored rule is still treated as dangerous, because breathing and protective reflexes fail more easily. A stimulant beside it is also treated as dangerous, because the stimulant can hide that sedation."
    if category == "stimulant":
        return f"{name} raises heart rate, blood pressure, and temperature. A second stimulant is treated as dangerous. A sedative beside it is also treated as dangerous, because the stimulant can mask the sedation until breathing fails."
    return f"{name} has a moderate floor when no stored rule names the pair. Moderate describes the pair. It is not permission to combine them."
