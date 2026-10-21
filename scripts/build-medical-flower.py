#!/usr/bin/env python3
"""Build flower files from public registries.

Australia: TGA SAS/AP dried-herb rows for 1 Jan–30 Jun 2026. Those rows name
the sponsor and the cannabinoid label. They do not name a cultivar or a terpene.

Connecticut: Department of Consumer Protection product registry. Flower rows
keep the registered cannabinoid and terpene figures. A figure is one filing,
not a stable chemotype.
"""

from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TGA = Path("/home/ubuntu/.cursor/projects/workspace/agent-tools/ec91272c-8c93-47b0-a386-7b53d32bb229.txt")
CT = Path("/tmp/ct-cannabis.csv")
OUTS = [
    ROOT / "public" / "catalogue" / "medical-flower.json",
    ROOT / "apps" / "mobile" / "public" / "catalogue" / "medical-flower.json",
]

TERPENES = [
    ("A-PINENE", "pinene"),
    ("B-PINENE", "beta-pinene"),
    ("B-MYRCENE", "myrcene"),
    ("B-CARYOPHYLLENE", "caryophyllene"),
    ("LIMONENE", "limonene"),
    ("OCIMENE", "ocimene"),
    ("LINALOOL-LIN", "linalool"),
    ("HUMULENE-HUM", "humulene"),
    ("A-BISABOLOL", "bisabolol"),
    ("A-PHELLANDRENE", "phellandrene"),
    ("A-TERPINENE", "alpha-terpinene"),
    ("B-EUDESMOL", "eudesmol"),
    ("B-TERPINENE", "gamma-terpinene"),
    ("FENCHONE", "fenchone"),
    ("PULEGOL", "pulegol"),
    ("BORNEOL", "borneol"),
    ("ISOPULEGOL", "isopulegol"),
    ("CARENE", "carene"),
    ("CAMPHENE", "camphene"),
    ("CAMPHOR", "camphor"),
    ("CARYOPHYLLENE-OXIDE", "caryophyllene oxide"),
    ("CEDROL", "cedrol"),
    ("EUCALYPTOL", "eucalyptol"),
    ("GERANIOL", "geraniol"),
    ("GUAIOL", "guaiol"),
    ("GERANYL-ACETATE", "geranyl acetate"),
    ("ISOBORNEOL", "isoborneol"),
    ("MENTHOL", "menthol"),
    ("L-FENCHONE", "l-fenchone"),
    ("NEROL", "nerol"),
    ("SABINENE", "sabinene"),
    ("TERPINEOL", "terpineol"),
    ("TERPINOLENE", "terpinolene"),
    ("TRANS-B-FARNESENE", "farnesene"),
    ("VALENCENE", "valencene"),
    ("A-CEDRENE", "cedrene"),
    ("A-FARNESENE", "alpha-farnesene"),
    ("B-FARNESENE", "beta-farnesene"),
    ("CIS-NEROLIDOL", "cis-nerolidol"),
    ("FENCHOL", "fenchol"),
    ("TRANS-NEROLIDOL", "nerolidol"),
]
CANNABINOIDS = [
    ("TETRAHYDROCANNABINOL-ACID-THCA", "THCA"),
    ("CANNABIDIOL-ACID-CBDA", "CBDA"),
    ("CBG", "CBG"),
    ("CBG-A", "CBGA"),
    ("CANNABAVARIN-CBDV", "CBDV"),
    ("CANNABICHROMENE-CBC", "CBC"),
    ("CANNBINOL-CBN", "CBN"),
    ("TETRAHYDROCANNABIVARIN-THCV", "THCV"),
]
FLOWER = ("flower", "usable marijuana", "raw material")
ADVERSE = ["anxiety", "fast heart rate", "impaired attention"]


def slugify(text: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    digest = hashlib.sha1(text.encode()).hexdigest()[:6]
    base = base[:64].strip("-") or "flower"
    return f"{base}-{digest}"


def num(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip().replace("%", "")
    if not text or text in {"-", "n/a", "na"}:
        return None
    try:
        parsed = float(text)
    except ValueError:
        return None
    if parsed < 0:
        return None
    return round(parsed, 2)


def present(value: float | None) -> float | None:
    if value is None or value <= 0:
        return None
    return value


def strain_type(name: str) -> str:
    if re.search(r"\(I\)|\bindica\b", name, re.I):
        return "indica"
    if re.search(r"\(S\)|\bsativa\b", name, re.I):
        return "sativa"
    if re.search(r"\(H\)|\bhybrid\b", name, re.I):
        return "hybrid"
    return "unspecified"


def profile(row: dict, columns: list[tuple[str, str]]) -> list[dict]:
    found = []
    for key, label in columns:
        value = present(num(row.get(key)))
        if value is None:
            continue
        found.append({"name": label, "percent": value})
    found.sort(key=lambda item: (-item["percent"], item["name"]))
    return found


def ct_date(value: str) -> datetime:
    text = (value or "").strip()
    for fmt in ("%Y %b %d %I:%M:%S %p", "%Y %b %d"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return datetime.min


def span(values: list[float]) -> tuple[float | None, float | None]:
    if not values:
        return None, None
    low, high = min(values), max(values)
    return low, high


def connecticut() -> list[dict]:
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    with CT.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            form = (row.get("DOSAGE-FORM") or "").lower()
            if not any(hint in form for hint in FLOWER):
                continue
            brand = (row.get("BRANDING-ENTITY") or "").strip()
            name = (row.get("PRODUCT-NAME") or "").strip()
            if not brand or not name:
                continue
            groups[(brand, name)].append(row)
    strains = []
    for (brand, name), rows in groups.items():
        rows.sort(key=lambda row: ct_date(row.get("APPROVAL-DATE") or ""))
        latest = rows[-1]
        terpene_row = next((row for row in reversed(rows) if profile(row, TERPENES)), latest)
        terpenes = profile(terpene_row, TERPENES)
        cannabinoids = profile(latest, CANNABINOIDS)
        thc_values = [value for value in (num(row.get("TETRAHYDROCANNABINOL-THC")) for row in rows) if value is not None]
        cbd_values = [value for value in (num(row.get("CANNABIDIOLS-CBD")) for row in rows) if value is not None]
        thc_low, thc_high = span(thc_values)
        cbd_low, cbd_high = span(cbd_values)
        kind = strain_type(name)
        market = (latest.get("Market") or "Connecticut").strip()
        slug = slugify(f"ct {brand} {name}")
        assay = (
            f"Connecticut DCP registry. THC and CBD span {len(rows)} registration"
            f"{'' if len(rows) == 1 else 's'} of this product name. "
            "Terpene percents are the latest registration that reported a terpene above zero. "
            "A later batch can differ. This is not a photograph and not a dose."
        )
        strains.append(
            {
                "id": f"s_{slug}",
                "slug": slug,
                "name": name,
                "type": kind,
                "lineage": "No pedigree is printed on the Connecticut registration.",
                "thc_low": thc_low,
                "thc_high": thc_high,
                "cbd_low": cbd_low,
                "cbd_high": cbd_high,
                "terpenes": [item["name"] for item in terpenes],
                "terpene_profile": terpenes,
                "cannabinoids": cannabinoids,
                "effects": [],
                "adverse": ADVERSE,
                "confidence": "limited",
                "summary": f"{name} is flower filed by {brand} in the Connecticut cannabis product registry. {assay}",
                "assay_note": assay,
                "products": [
                    {
                        "region": "US",
                        "brand": brand,
                        "product": name,
                        "form": "Flower",
                        "thc_label": None if thc_high is None else f"{thc_low:g}–{thc_high:g}%" if thc_low != thc_high else f"{thc_high:g}%",
                        "cbd_label": None if cbd_high is None else f"{cbd_low:g}–{cbd_high:g}%" if cbd_low != cbd_high else f"{cbd_high:g}%",
                        "source": f"Connecticut Department of Consumer Protection cannabis product registry. Market: {market}.",
                        "source_url": "https://data.ct.gov/d/egd5-wb6r",
                    }
                ],
            }
        )
    return strains


def parse_percent(label: str, token: str) -> tuple[str | None, float | None]:
    match = re.search(rf"{token}\s*(<|>|≤|>=)?\s*(\d+(?:\.\d+)?)\s*%", label, re.I)
    if match:
        op, value = match.group(1), float(match.group(2))
        text = f"{op or ''}{value:g}%".replace(">=", "≥")
        return text, None if op else value
    match = re.search(rf"{token}\s*(\d+(?:\.\d+)?)\s*mg/g", label, re.I)
    if match:
        value = float(match.group(1)) / 10
        return f"{match.group(1)} mg/g ({value:g}%)", value
    return None, None


def parse_mass(label: str, qty: str, token: str) -> tuple[str | None, float | None]:
    match = re.search(rf"{token}\s*(\d+(?:\.\d+)?)\s*g\b", label, re.I)
    pack = re.search(r"(\d+(?:\.\d+)?)\s*g", qty, re.I)
    if not match or not pack:
        return None, None
    dose = float(match.group(1))
    pack_g = float(pack.group(1))
    if pack_g <= 0:
        return None, None
    percent = dose / pack_g * 100
    return f"{dose:g} g in {pack_g:g} g ({percent:.1f}%)", round(percent, 2)


def australia() -> list[dict]:
    if not TGA.exists():
        print("tga source missing")
        return []
    category = ""
    groups: dict[tuple[str, str], list[tuple[str, str]]] = defaultdict(list)
    for line in TGA.read_text(encoding="utf-8").splitlines():
        if line.startswith("## Category"):
            category = line.replace("## ", "").strip()
            continue
        if not line.startswith("| Herb, Dried"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 4 or cells[1] == "Active Ingredient(s)":
            continue
        active, qty, sponsor = cells[1], cells[2], cells[3]
        groups[(sponsor, active)].append((qty, category))
    strains = []
    for (sponsor, active), packs in groups.items():
        thc_label, thc = parse_percent(active, "THC")
        cbd_label, cbd = parse_percent(active, "CBD")
        if thc is None:
            mass_label, mass = parse_mass(active, packs[0][0], "THC")
            if mass is not None:
                thc_label, thc = mass_label, mass
        if cbd is None:
            mass_label, mass = parse_mass(active, packs[0][0], "CBD")
            if mass is not None:
                cbd_label, cbd = mass_label, mass
        slug = slugify(f"au {sponsor} {active}")
        pack_text = ", ".join(sorted({qty for qty, _ in packs}))
        categories = sorted({item for _, item in packs})
        note = (
            "TGA SAS/AP dried-herb report for supply from 1 January to 30 June 2026. "
            "The sponsor line names a cannabinoid label and a pack size. It does not name a cultivar, "
            "and it publishes no terpene percentage. A listing is not stock and not a dose."
        )
        strains.append(
            {
                "id": f"s_{slug}",
                "slug": slug,
                "name": f"{sponsor} dried herb, {active}",
                "type": "unspecified",
                "lineage": "No cultivar name on the TGA sponsor report.",
                "thc_low": thc,
                "thc_high": thc,
                "cbd_low": cbd,
                "cbd_high": cbd,
                "terpenes": [],
                "terpene_profile": [],
                "cannabinoids": [],
                "effects": [],
                "adverse": ADVERSE,
                "confidence": "limited",
                "summary": f"Dried flower reported by {sponsor}. Label: {active}. Pack sizes on the report: {pack_text}. {note}",
                "assay_note": note + " Category: " + "; ".join(categories),
                "products": [
                    {
                        "region": "AU",
                        "brand": sponsor,
                        "product": f"{active} ({qty})",
                        "form": "Herb, dried",
                        "thc_label": thc_label,
                        "cbd_label": cbd_label,
                        "source": "TGA medicinal cannabis product list, SAS/AP supply 1 Jan–30 Jun 2026. Sponsor-declared. The TGA does not guarantee the line.",
                        "source_url": "https://www.tga.gov.au/resources/explore-topic/medicinal-cannabis-hub/medicinal-cannabis-product-list",
                    }
                    for qty, _category in packs
                ],
            }
        )
    return strains


def main() -> None:
    rows = australia() + connecticut()
    seen: set[str] = set()
    unique = []
    for row in rows:
        if row["slug"] in seen:
            continue
        seen.add(row["slug"])
        unique.append(row)
    unique.sort(key=lambda row: row["name"].lower())
    payload = {"strains": unique}
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    for path in OUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(raw, encoding="utf-8")
    au = sum(1 for row in unique if row["products"][0]["region"] == "AU")
    us = len(unique) - au
    with_terp = sum(1 for row in unique if row["terpene_profile"])
    print(f"files {len(unique)} au {au} us {us} with_terpenes {with_terp} bytes {len(raw.encode())}")


if __name__ == "__main__":
    main()
