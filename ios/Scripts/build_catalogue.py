#!/usr/bin/env python3
"""Build the native app catalogue from the same JSON the website ships.

Reads, in the same order as the web archive loader:
  src/data/archive.json
  src/data/drugs-extra.json
  public/catalogue/manifest.json and its shards

The first slug wins. Later shards do not replace a curated file.
"""

from __future__ import annotations

import argparse
import gc
import json
import sqlite3
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
IOS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(IOS / "Scripts"))
from interaction_model import interact  # noqa: E402


def connect(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        path.unlink()
    db = sqlite3.connect(path)
    db.execute("PRAGMA journal_mode = OFF")
    db.execute("PRAGMA synchronous = OFF")
    db.execute("PRAGMA temp_store = MEMORY")
    db.execute("PRAGMA page_size = 8192")
    db.executescript(
        """
        CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE drug_chunks (
          id INTEGER PRIMARY KEY,
          raw_size INTEGER NOT NULL,
          payload BLOB NOT NULL
        );
        CREATE TABLE drugs (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          evidence TEXT NOT NULL,
          featured INTEGER NOT NULL,
          discovered_year INTEGER,
          summary TEXT NOT NULL,
          chunk_id INTEGER NOT NULL,
          chunk_index INTEGER NOT NULL
        );
        CREATE TABLE drug_names (
          slug TEXT NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE drug_tags (
          slug TEXT NOT NULL,
          tag TEXT NOT NULL,
          PRIMARY KEY (slug, tag)
        );
        CREATE TABLE strains (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          lineage TEXT,
          thc_low REAL,
          thc_high REAL,
          cbd_low REAL,
          cbd_high REAL,
          confidence TEXT,
          summary TEXT,
          terpenes TEXT,
          effects TEXT,
          adverse TEXT
        );
        CREATE TABLE classes (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          color TEXT
        );
        CREATE TABLE timeline (
          id TEXT PRIMARY KEY,
          year INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT
        );
        CREATE TABLE refs (
          id TEXT PRIMARY KEY,
          drug_id TEXT NOT NULL,
          label TEXT NOT NULL,
          url TEXT
        );
        CREATE TABLE rules (
          id INTEGER PRIMARY KEY,
          severity TEXT NOT NULL,
          note TEXT NOT NULL,
          left_json TEXT NOT NULL,
          right_json TEXT NOT NULL
        );
        CREATE TABLE group_members (
          group_key TEXT NOT NULL,
          slug TEXT NOT NULL,
          position INTEGER NOT NULL,
          PRIMARY KEY (group_key, slug)
        );
        CREATE TABLE chapters (
          key TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL
        );
        """
    )
    return db


BOILERPLATE = "listed under this catalogued name"
CHUNK = 64


class Catalogue:
    def __init__(self, db: sqlite3.Connection) -> None:
        self.db = db
        self.slugs: set[str] = set()
        self.ids: set[str] = set()
        self.strain_slugs: set[str] = set()
        self.strain_ids: set[str] = set()
        self.ref_ids: set[str] = set()
        self.pending: list[dict] = []
        self.tag_rows: list[tuple] = []
        self.name_rows: list[tuple] = []
        self.skipped_drugs = 0
        self.skipped_strains = 0

    def flush(self) -> None:
        if self.pending:
            raw = json.dumps(self.pending, ensure_ascii=False, separators=(",", ":")).encode()
            blob = zlib.compress(raw, 9)
            cursor = self.db.execute("INSERT INTO drug_chunks (raw_size, payload) VALUES (?, ?)", (len(raw), blob))
            chunk_id = cursor.lastrowid
            rows = []
            for index, drug in enumerate(self.pending):
                year = drug.get("discovered_year")
                if not isinstance(year, int):
                    year = None
                summary = drug.get("summary") or ""
                if len(summary) > 180:
                    summary = summary[:177].rsplit(" ", 1)[0] + "…"
                rows.append(
                    (
                        drug["id"],
                        drug["slug"],
                        drug["name"],
                        drug["category"],
                        drug["evidence_quality"],
                        1 if drug.get("featured") else 0,
                        year,
                        summary,
                        chunk_id,
                        index,
                    )
                )
            self.db.executemany(
                """
                INSERT INTO drugs (
                  id, slug, name, category, evidence, featured, discovered_year, summary, chunk_id, chunk_index
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                rows,
            )
            self.pending.clear()
        if self.tag_rows:
            self.db.executemany("INSERT OR IGNORE INTO drug_tags (slug, tag) VALUES (?, ?)", self.tag_rows)
            self.tag_rows.clear()
        if self.name_rows:
            self.db.executemany("INSERT INTO drug_names (slug, value) VALUES (?, ?)", self.name_rows)
            self.name_rows.clear()

    def add_name(self, slug: str, value: str) -> None:
        text = " ".join(str(value).lower().split())
        if len(text) < 2 or BOILERPLATE in text:
            return
        self.name_rows.append((slug, text))

    def add_drug(self, drug: dict) -> None:
        slug = str(drug.get("slug") or "").strip()
        name = str(drug.get("name") or "").strip()
        if not slug or not name or slug in self.slugs:
            self.skipped_drugs += 1
            return
        row = dict(drug)
        row["slug"] = slug
        row["name"] = name
        row.setdefault("category", "other")
        row.setdefault("evidence_quality", "unknown")
        row.setdefault("featured", False)
        drug_id = str(row.get("id") or f"d_{slug}")
        if drug_id in self.ids:
            drug_id = f"{drug_id}__{slug}"[:180]
        row["id"] = drug_id
        year = row.get("discovered_year")
        if isinstance(year, float):
            year = int(year)
        if not isinstance(year, int):
            row["discovered_year"] = None
        else:
            row["discovered_year"] = year
        self.ids.add(drug_id)
        self.slugs.add(slug)
        self.pending.append(row)
        self.add_name(slug, name)
        self.add_name(slug, slug.replace("-", " "))
        for key in ("aliases", "brand_names", "street_names"):
            for value in row.get(key) or []:
                if isinstance(value, str):
                    self.add_name(slug, value)
        for tag in row.get("risk_classes") or [row["category"]]:
            if tag:
                self.tag_rows.append((slug, str(tag)))
        if len(self.pending) >= CHUNK:
            self.flush()

    def add_strain(self, strain: dict) -> None:
        slug = str(strain.get("slug") or "").strip()
        name = str(strain.get("name") or "").strip()
        if not slug or not name or slug in self.strain_slugs:
            self.skipped_strains += 1
            return
        strain_id = str(strain.get("id") or f"s_{slug}")
        if strain_id in self.strain_ids:
            strain_id = f"{strain_id}__{slug}"[:180]
        self.strain_ids.add(strain_id)
        self.strain_slugs.add(slug)
        self.db.execute(
            """
            INSERT INTO strains (
              id, slug, name, type, lineage, thc_low, thc_high, cbd_low, cbd_high,
              confidence, summary, terpenes, effects, adverse
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                strain_id,
                slug,
                name,
                strain.get("type") or "hybrid",
                strain.get("lineage"),
                strain.get("thc_low"),
                strain.get("thc_high"),
                strain.get("cbd_low"),
                strain.get("cbd_high"),
                strain.get("confidence") or "unknown",
                strain.get("summary"),
                json.dumps(strain.get("terpenes") or [], ensure_ascii=False),
                json.dumps(strain.get("effects") or [], ensure_ascii=False),
                json.dumps(strain.get("adverse") or [], ensure_ascii=False),
            ),
        )

    def add_ref(self, ref: dict) -> None:
        ref_id = str(ref.get("id") or "")
        drug_id = str(ref.get("drug_id") or "")
        label = str(ref.get("label") or "").strip()
        if not ref_id or not drug_id or not label:
            return
        if ref_id in self.ref_ids:
            ref_id = f"{ref_id}__{len(self.ref_ids)}"
        self.ref_ids.add(ref_id)
        self.db.execute(
            "INSERT INTO refs (id, drug_id, label, url) VALUES (?, ?, ?, ?)",
            (ref_id, drug_id, label, ref.get("url")),
        )


def load_json(path: Path) -> dict:
    print(f"reading {path.relative_to(ROOT)}", flush=True)
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def add_drug_file(cat: Catalogue, path: Path, key: str = "drugs") -> None:
    data = load_json(path)
    rows = data.get(key) or []
    print(f"  {len(rows)} {key}", flush=True)
    for row in rows:
        cat.add_drug(row)
    cat.flush()
    for ref in data.get("refs") or []:
        cat.add_ref(ref)
    for strain in data.get("strains") or []:
        cat.add_strain(strain)
    del data
    gc.collect()


def add_core(cat: Catalogue, db: sqlite3.Connection, archive: dict) -> None:
    db.execute("INSERT INTO meta (key, value) VALUES (?, ?)", ("generated_at", str(archive.get("generated_at") or "")))
    db.execute("INSERT INTO meta (key, value) VALUES (?, ?)", ("notice", str(archive.get("notice") or "")))
    for item in archive.get("classes") or []:
        db.execute(
            "INSERT INTO classes (id, slug, name, description, color) VALUES (?, ?, ?, ?, ?)",
            (item["id"], item["slug"], item["name"], item.get("description"), item.get("color")),
        )
    for item in archive.get("timeline") or []:
        db.execute(
            "INSERT INTO timeline (id, year, title, description, category) VALUES (?, ?, ?, ?, ?)",
            (item["id"], int(item["year"]), item["title"], item.get("description"), item.get("category")),
        )
    for index, rule in enumerate(archive.get("rules") or []):
        db.execute(
            "INSERT INTO rules (id, severity, note, left_json, right_json) VALUES (?, ?, ?, ?, ?)",
            (index, rule["severity"], rule["note"], json.dumps(rule["left"]), json.dumps(rule["right"])),
        )
    for key, slugs in (archive.get("groups") or {}).items():
        for position, slug in enumerate(slugs):
            db.execute(
                "INSERT OR IGNORE INTO group_members (group_key, slug, position) VALUES (?, ?, ?)",
                (key, slug, position),
            )
    for strain in archive.get("strains") or []:
        cat.add_strain(strain)
    for ref in archive.get("refs") or []:
        cat.add_ref(ref)


def add_chapters(db: sqlite3.Connection) -> None:
    path = IOS / "Resources" / "Briefing.json"
    if not path.exists():
        print("no briefing json, chapters left empty", flush=True)
        return
    brief = json.loads(path.read_text(encoding="utf-8"))
    for kind in ("classes", "groups"):
        for key, chapter in (brief.get(kind) or {}).items():
            db.execute(
                "INSERT OR REPLACE INTO chapters (key, kind, title, body) VALUES (?, ?, ?, ?)",
                (key, kind, chapter["title"], json.dumps(chapter["paragraphs"], ensure_ascii=False)),
            )


def finish(db: sqlite3.Connection) -> None:
    print("indexing search", flush=True)
    db.executescript(
        """
        CREATE INDEX drugs_category_name ON drugs(category, name);
        CREATE INDEX drugs_name ON drugs(name);
        CREATE INDEX drug_tags_tag ON drug_tags(tag, slug);
        CREATE INDEX drug_names_value ON drug_names(value);
        CREATE INDEX strains_type_name ON strains(type, name);
        CREATE INDEX strains_name ON strains(name);
        CREATE INDEX refs_drug ON refs(drug_id);
        CREATE INDEX group_members_slug ON group_members(slug);
        """
    )
    counts = {
        "drug_count": db.execute("SELECT COUNT(*) FROM drugs").fetchone()[0],
        "strain_count": db.execute("SELECT COUNT(*) FROM strains").fetchone()[0],
        "class_count": db.execute("SELECT COUNT(*) FROM classes").fetchone()[0],
        "rule_count": db.execute("SELECT COUNT(*) FROM rules").fetchone()[0],
        "ref_count": db.execute("SELECT COUNT(*) FROM refs").fetchone()[0],
    }
    for key, value in counts.items():
        db.execute("INSERT INTO meta (key, value) VALUES (?, ?)", (key, str(value)))
    db.commit()
    print(" ".join(f"{key}={value}" for key, value in counts.items()), flush=True)


def load_drug(db: sqlite3.Connection, slug: str) -> dict:
    located = db.execute("SELECT chunk_id, chunk_index FROM drugs WHERE slug = ?", (slug,)).fetchone()
    if located is None:
        raise SystemExit(f"missing file {slug}")
    chunk = db.execute("SELECT raw_size, payload FROM drug_chunks WHERE id = ?", (located["chunk_id"],)).fetchone()
    raw = zlib.decompress(chunk["payload"])
    if len(raw) != chunk["raw_size"]:
        raise SystemExit(f"chunk size does not match for {slug}")
    drug = json.loads(raw)[located["chunk_index"]]
    if drug["slug"] != slug:
        raise SystemExit(f"chunk index did not point at {slug}")
    return drug


def check(path: Path) -> None:
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    drugs = db.execute("SELECT value FROM meta WHERE key = 'drug_count'").fetchone()[0]
    strains = db.execute("SELECT value FROM meta WHERE key = 'strain_count'").fetchone()[0]
    classes = db.execute("SELECT value FROM meta WHERE key = 'class_count'").fetchone()[0]
    rules_n = db.execute("SELECT value FROM meta WHERE key = 'rule_count'").fetchone()[0]
    if int(drugs) < 50000:
        raise SystemExit(f"expected at least 50000 drugs, found {drugs}")
    if int(strains) < 25000:
        raise SystemExit(f"expected at least 25000 strains, found {strains}")
    if int(classes) < 18:
        raise SystemExit(f"expected 18 classes, found {classes}")
    if int(rules_n) < 100:
        raise SystemExit(f"expected mix rules, found {rules_n}")
    morphine = load_drug(db, "morphine")
    diazepam = load_drug(db, "diazepam")
    heroin = load_drug(db, "heroin")
    alcohol = load_drug(db, "alcohol-ethanol")
    naloxone = load_drug(db, "naloxone")
    rules = []
    for row in db.execute("SELECT severity, note, left_json, right_json FROM rules ORDER BY id"):
        rules.append({"severity": row["severity"], "note": row["note"], "left": json.loads(row["left_json"]), "right": json.loads(row["right_json"])})
    membership: dict[str, set[str]] = {}
    for row in db.execute("SELECT group_key, slug FROM group_members"):
        membership.setdefault(row["slug"], set()).add(row["group_key"])
    pair = interact(morphine, diazepam, rules, membership)
    if not pair or pair["severity"] != "deadly":
        raise SystemExit(f"morphine + diazepam should be deadly, got {pair}")
    if "This file has no dose." not in pair["note"]:
        raise SystemExit("pair note lost the no-dose line")
    alcohol_pair = interact(alcohol, heroin, rules, membership)
    if not alcohol_pair or alcohol_pair["severity"] not in {"dangerous", "deadly"}:
        raise SystemExit(f"alcohol + heroin should be dangerous or deadly, got {alcohol_pair}")
    naloxone_pair = interact(naloxone, heroin, rules, membership)
    if not naloxone_pair:
        raise SystemExit("naloxone + heroin produced no note")
    same = interact(morphine, morphine, rules, membership)
    if same is not None:
        raise SystemExit("a substance paired with itself should not rank")
    found = db.execute("SELECT slug FROM drugs WHERE slug = 'morphine' AND instr(lower(name), 'morphine') > 0").fetchone()
    if not found:
        raise SystemExit("name search missed morphine")
    alias = db.execute("SELECT slug FROM drug_names WHERE value = 'morphine sulfate'").fetchone()
    if not alias or alias[0] != "morphine":
        raise SystemExit(f"alias search missed morphine sulfate: {alias}")
    located = db.execute("SELECT chunk_id, chunk_index FROM drugs WHERE slug = 'morphine'").fetchone()
    chunk = db.execute("SELECT raw_size, payload FROM drug_chunks WHERE id = ?", (located[0],)).fetchone()
    raw = zlib.decompress(chunk[1])
    if len(raw) != chunk[0]:
        raise SystemExit("chunk size does not match the stored length")
    packed = json.loads(raw)
    if packed[located[1]]["slug"] != "morphine":
        raise SystemExit("chunk index did not point at morphine")
    chapter = db.execute("SELECT title FROM chapters WHERE key = 'opioid'").fetchone()
    if not chapter:
        raise SystemExit("opioid chapter missing")
    blue = db.execute("SELECT name FROM strains WHERE slug = 'blue-dream'").fetchone()
    print("check ok", flush=True)
    print("morphine+diazepam", pair["severity"], flush=True)
    print("alcohol+heroin", alcohol_pair["severity"], flush=True)
    print("naloxone+heroin", naloxone_pair["severity"], flush=True)
    print("blue-dream", None if blue is None else blue["name"], flush=True)
    print("sqlite bytes", path.stat().st_size, flush=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    out = Path(args.out)
    db = connect(out)
    cat = Catalogue(db)
    archive_path = ROOT / "src" / "data" / "archive.json"
    archive = load_json(archive_path)
    print(f"  {len(archive.get('drugs') or [])} curated drugs", flush=True)
    for drug in archive.get("drugs") or []:
        cat.add_drug(drug)
    cat.flush()
    add_core(cat, db, archive)
    del archive
    gc.collect()
    add_drug_file(cat, ROOT / "src" / "data" / "drugs-extra.json")
    manifest = load_json(ROOT / "public" / "catalogue" / "manifest.json")
    for name in manifest.get("drugs") or []:
        add_drug_file(cat, ROOT / "public" / "catalogue" / name)
    for name in manifest.get("strains") or []:
        data = load_json(ROOT / "public" / "catalogue" / name)
        rows = data.get("strains") or []
        print(f"  {len(rows)} strains", flush=True)
        for strain in rows:
            cat.add_strain(strain)
        del data
        gc.collect()
    add_chapters(db)
    print(f"skipped duplicate drugs {cat.skipped_drugs} strains {cat.skipped_strains}", flush=True)
    finish(db)
    db.close()
    if args.check:
        check(out)


if __name__ == "__main__":
    main()
