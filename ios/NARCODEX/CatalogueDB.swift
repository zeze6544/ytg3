import Compression
import Foundation
import SQLite3

final class CatalogueDB: @unchecked Sendable {
    private var handle: OpaquePointer?
    private let queue = DispatchQueue(label: "app.narcodex.sqlite")
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }()
    private var cachedChunkID: Int?
    private var cachedFiles: [DrugFile] = []
    private let transient = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

    func load(_ url: URL) async throws -> ArchiveCache {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                do {
                    continuation.resume(returning: try self.openAndRead(url))
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }

    func listDrugs(term: String, category: String, shelf: String, limit: Int) async -> ListedDrugs {
        await withCheckedContinuation { continuation in
            queue.async {
                let listed = (try? self.listDrugsSync(term: term, category: category, shelf: shelf, limit: limit)) ?? ListedDrugs(rows: [], total: 0, capped: false)
                continuation.resume(returning: listed)
            }
        }
    }

    func listStrains(term: String, type: String, limit: Int) async -> (rows: [StrainRecord], total: Int) {
        await withCheckedContinuation { continuation in
            queue.async {
                let rows = (try? self.strainRows(term: term, type: type, limit: limit)) ?? []
                let total = (try? self.strainTotal(term: term, type: type)) ?? rows.count
                continuation.resume(returning: (rows, total))
            }
        }
    }

    func drug(slug: String) async -> DrugFile? {
        await withCheckedContinuation { continuation in
            queue.async {
                continuation.resume(returning: try? self.drugSync(slug: slug))
            }
        }
    }

    func drugs(slugs: [String]) async -> [String: DrugFile] {
        await withCheckedContinuation { continuation in
            queue.async {
                var found: [String: DrugFile] = [:]
                for slug in slugs {
                    if let drug = try? self.drugSync(slug: slug) {
                        found[slug] = drug
                    }
                }
                continuation.resume(returning: found)
            }
        }
    }

    func orderedDrugs(slugs: [String]) async -> [DrugRow] {
        await withCheckedContinuation { continuation in
            queue.async {
                let found = (try? self.drugs(slugs: slugs)) ?? [:]
                continuation.resume(returning: slugs.compactMap { found[$0] })
            }
        }
    }

    func drug(named name: String) async -> DrugRow? {
        await withCheckedContinuation { continuation in
            queue.async {
                let row = try? self.oneRow("SELECT slug, name, category, evidence, summary FROM drugs WHERE name = ? COLLATE NOCASE LIMIT 1", [.text(name)])
                continuation.resume(returning: row)
            }
        }
    }

    func strain(slug: String) async -> StrainRecord? {
        await withCheckedContinuation { continuation in
            queue.async {
                let rows = try? self.strainQuery("SELECT \(Self.strainColumns) FROM strains WHERE slug = ? LIMIT 1", [.text(slug)])
                continuation.resume(returning: rows?.first)
            }
        }
    }

    func neighbors(category: String, name: String, slug: String) async -> [DrugRow] {
        await withCheckedContinuation { continuation in
            queue.async {
                let after = (try? self.rows(
                    "SELECT slug, name, category, evidence, summary FROM drugs WHERE category = ? AND slug != ? AND name > ? ORDER BY name LIMIT 3",
                    [.text(category), .text(slug), .text(name)]
                )) ?? []
                let before = (try? self.rows(
                    "SELECT slug, name, category, evidence, summary FROM drugs WHERE category = ? AND slug != ? AND name < ? ORDER BY name DESC LIMIT 2",
                    [.text(category), .text(slug), .text(name)]
                )) ?? []
                continuation.resume(returning: before.reversed() + after)
            }
        }
    }

    func references(drugID: String) async -> [ReferenceItem] {
        await withCheckedContinuation { continuation in
            queue.async {
                var items: [ReferenceItem] = []
                try? self.query("SELECT id, label, url FROM refs WHERE drug_id = ? ORDER BY label", [.text(drugID)]) { statement in
                    let url = self.text(statement, 2)
                    items.append(ReferenceItem(id: self.text(statement, 0), label: self.text(statement, 1), url: url.isEmpty ? nil : url))
                }
                continuation.resume(returning: items)
            }
        }
    }

    func randomDrug() async -> DrugRow? {
        await withCheckedContinuation { continuation in
            queue.async {
                let row = try? self.oneRow(
                    """
                    SELECT slug, name, category, evidence, summary FROM drugs
                    WHERE rowid = (abs(random()) % (SELECT MAX(rowid) FROM drugs)) + 1
                    LIMIT 1
                    """,
                    []
                )
                continuation.resume(returning: row)
            }
        }
    }

    private func openAndRead(_ url: URL) throws -> ArchiveCache {
        if let handle {
            sqlite3_close(handle)
            self.handle = nil
        }
        cachedChunkID = nil
        cachedFiles = []
        var opened: OpaquePointer?
        let flags = SQLITE_OPEN_READONLY | SQLITE_OPEN_FULLMUTEX
        guard sqlite3_open_v2(url.path, &opened, flags, nil) == SQLITE_OK, let opened else {
            throw CatalogueError.open("SQLite could not open the file.")
        }
        handle = opened
        var cache = ArchiveCache()
        var meta: [String: String] = [:]
        try query("SELECT key, value FROM meta", []) { statement in
            meta[self.text(statement, 0)] = self.text(statement, 1)
        }
        cache.snapshot = ArchiveSnapshot(
            drugCount: Int(meta["drug_count"] ?? "") ?? 0,
            strainCount: Int(meta["strain_count"] ?? "") ?? 0,
            classCount: Int(meta["class_count"] ?? "") ?? 0,
            generatedAt: meta["generated_at"] ?? "",
            notice: meta["notice"] ?? ""
        )
        try query("SELECT severity, note, left_json, right_json FROM rules ORDER BY id", []) { statement in
            cache.rules.append(MixRule(
                severity: self.text(statement, 0),
                note: self.text(statement, 1),
                left: self.stringList(self.text(statement, 2)),
                right: self.stringList(self.text(statement, 3))
            ))
        }
        try query("SELECT group_key, slug FROM group_members ORDER BY group_key, position", []) { statement in
            let key = self.text(statement, 0)
            let slug = self.text(statement, 1)
            cache.groups[key, default: []].append(slug)
            cache.membership[slug, default: []].insert(key)
        }
        try query("SELECT key, kind, title, body FROM chapters", []) { statement in
            let chapter = Chapter(id: self.text(statement, 0), title: self.text(statement, 2), paragraphs: self.stringList(self.text(statement, 3)))
            if self.text(statement, 1) == "groups" {
                cache.groupChapters[chapter.id] = chapter
            } else {
                cache.classChapters[chapter.id] = chapter
            }
        }
        try query("SELECT id, slug, name, description, color FROM classes ORDER BY name", []) { statement in
            cache.classes.append(DrugClassInfo(
                id: self.text(statement, 0),
                slug: self.text(statement, 1),
                name: self.text(statement, 2),
                description: self.text(statement, 3),
                color: self.text(statement, 4)
            ))
        }
        try query("SELECT id, year, title, description, category FROM timeline ORDER BY year, title", []) { statement in
            cache.timeline.append(TimelineEvent(
                id: self.text(statement, 0),
                year: Int(sqlite3_column_int64(statement, 1)),
                title: self.text(statement, 2),
                detail: self.text(statement, 3),
                category: self.text(statement, 4)
            ))
        }
        try query("SELECT slug, name FROM drugs", []) { statement in
            cache.names[self.text(statement, 0)] = self.text(statement, 1)
        }
        return cache
    }

    private func listDrugsSync(term: String, category: String, shelf: String, limit: Int) throws -> ListedDrugs {
        let cleaned = term.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !cleaned.isEmpty {
            return try searchDrugs(cleaned, category: category, limit: max(limit, 40))
        }
        if shelf == "common" {
            let wanted = Copy.commonSlugs
            let found = try drugs(slugs: wanted)
            let rows = wanted.compactMap { found[$0] }.filter { category == "all" || $0.category == category }
            return ListedDrugs(rows: rows, total: rows.count, capped: false)
        }
        let rows = try browse(category: category, letter: shelf, limit: limit, offset: 0)
        let total = try browseCount(category: category, letter: shelf)
        return ListedDrugs(rows: rows, total: total, capped: false)
    }

    private func searchDrugs(_ term: String, category: String, limit: Int) throws -> ListedDrugs {
        let pattern = likePrefix(term)
        var sql = """
        SELECT slug, name, category, evidence, summary FROM drugs
        WHERE (instr(lower(name), ?) > 0 OR instr(lower(slug), ?) > 0 OR name LIKE ? ESCAPE '\\')
        """
        var binds: [SQLBind] = [.text(term), .text(term), .text(pattern)]
        if category != "all" {
            sql += " AND EXISTS (SELECT 1 FROM drug_tags t WHERE t.slug = drugs.slug AND t.tag = ?)"
            binds.append(.text(category))
        }
        sql += " ORDER BY CASE WHEN lower(name) = ? THEN 0 WHEN lower(name) LIKE ? ESCAPE '\\' THEN 1 WHEN instr(lower(name), ?) > 0 THEN 3 ELSE 6 END, name LIMIT ?"
        binds.append(.text(term))
        binds.append(.text(pattern))
        binds.append(.text(term))
        binds.append(.int(limit))
        var found = try rows(sql, binds)
        var seen = Set(found.map(\.slug))
        var aliasSQL = """
        SELECT d.slug, d.name, d.category, d.evidence, d.summary
        FROM drug_names n JOIN drugs d ON d.slug = n.slug
        WHERE instr(n.value, ?) > 0
        """
        var aliasBinds: [SQLBind] = [.text(term)]
        if category != "all" {
            aliasSQL += " AND EXISTS (SELECT 1 FROM drug_tags t WHERE t.slug = d.slug AND t.tag = ?)"
            aliasBinds.append(.text(category))
        }
        aliasSQL += " LIMIT ?"
        aliasBinds.append(.int(limit))
        let aliases = try rows(aliasSQL, aliasBinds)
        for row in aliases where seen.insert(row.slug).inserted {
            found.append(row)
        }
        let ranked = found.sorted { lhs, rhs in
            let left = searchRank(lhs, term: term)
            let right = searchRank(rhs, term: term)
            if left != right { return left < right }
            return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
        }
        let capped = ranked.count >= limit
        return ListedDrugs(rows: Array(ranked.prefix(limit)), total: ranked.count, capped: capped)
    }

    private func searchRank(_ row: DrugRow, term: String) -> Int {
        let name = row.name.lowercased()
        if name == term { return 0 }
        if name.hasPrefix(term) { return 1 }
        if name.contains(term) { return 3 }
        if row.slug.lowercased().contains(term) { return 6 }
        return 4
    }

    private func browse(category: String, letter: String, limit: Int, offset: Int) throws -> [DrugRow] {
        var sql = "SELECT slug, name, category, evidence, summary FROM drugs WHERE 1 = 1"
        var binds: [SQLBind] = []
        appendBrowseFilter(&sql, &binds, category: category, letter: letter)
        sql += " ORDER BY name LIMIT ? OFFSET ?"
        binds.append(.int(limit))
        binds.append(.int(offset))
        return try rows(sql, binds)
    }

    private func browseCount(category: String, letter: String) throws -> Int {
        var sql = "SELECT COUNT(*) FROM drugs WHERE 1 = 1"
        var binds: [SQLBind] = []
        appendBrowseFilter(&sql, &binds, category: category, letter: letter)
        return try intValue(sql, binds)
    }

    private func appendBrowseFilter(_ sql: inout String, _ binds: inout [SQLBind], category: String, letter: String) {
        if category != "all" {
            sql += " AND EXISTS (SELECT 1 FROM drug_tags t WHERE t.slug = drugs.slug AND t.tag = ?)"
            binds.append(.text(category))
        }
        if letter == "#" {
            sql += " AND substr(name, 1, 1) NOT GLOB '[A-Za-z]'"
        } else if letter.count == 1, letter != "all" {
            sql += " AND name LIKE ? ESCAPE '\\'"
            binds.append(.text(likePrefix(letter)))
        }
    }

    private func strainRows(term: String, type: String, limit: Int) throws -> [StrainRecord] {
        var sql = "SELECT \(Self.strainColumns) FROM strains WHERE 1 = 1"
        var binds: [SQLBind] = []
        appendStrainFilter(&sql, &binds, term: term, type: type)
        sql += " ORDER BY name LIMIT ?"
        binds.append(.int(limit))
        return try strainQuery(sql, binds)
    }

    private func strainTotal(term: String, type: String) throws -> Int {
        var sql = "SELECT COUNT(*) FROM strains WHERE 1 = 1"
        var binds: [SQLBind] = []
        appendStrainFilter(&sql, &binds, term: term, type: type)
        return try intValue(sql, binds)
    }

    private func appendStrainFilter(_ sql: inout String, _ binds: inout [SQLBind], term: String, type: String) {
        if type != "all" {
            sql += " AND type = ?"
            binds.append(.text(type))
        }
        if !term.isEmpty {
            sql += " AND (instr(lower(name), ?) > 0 OR instr(lower(coalesce(lineage, '')), ?) > 0)"
            binds.append(.text(term))
            binds.append(.text(term))
        }
    }

    private func drugSync(slug: String) throws -> DrugFile? {
        var chunkID = -1
        var index = -1
        try query("SELECT chunk_id, chunk_index FROM drugs WHERE slug = ? LIMIT 1", [.text(slug)]) { statement in
            chunkID = Int(sqlite3_column_int64(statement, 0))
            index = Int(sqlite3_column_int64(statement, 1))
        }
        guard chunkID > 0, index >= 0 else { return nil }
        let files = try files(in: chunkID)
        guard files.indices.contains(index) else { return nil }
        return files[index]
    }

    private func files(in chunkID: Int) throws -> [DrugFile] {
        if cachedChunkID == chunkID { return cachedFiles }
        var rawSize = 0
        var blob = Data()
        try query("SELECT raw_size, payload FROM drug_chunks WHERE id = ? LIMIT 1", [.int(chunkID)]) { statement in
            rawSize = Int(sqlite3_column_int64(statement, 0))
            blob = self.blob(statement, 1)
        }
        guard rawSize > 0, !blob.isEmpty else { throw CatalogueError.decode("Missing catalogue chunk \(chunkID).") }
        let inflated = try inflate(blob, rawSize: rawSize)
        let files = try decoder.decode([DrugFile].self, from: inflated)
        cachedChunkID = chunkID
        cachedFiles = files
        return files
    }

    private func inflate(_ data: Data, rawSize: Int) throws -> Data {
        let destination = UnsafeMutablePointer<UInt8>.allocate(capacity: rawSize)
        defer { destination.deallocate() }
        let written = data.withUnsafeBytes { source -> Int in
            guard let base = source.bindMemory(to: UInt8.self).baseAddress else { return 0 }
            return compression_decode_buffer(destination, rawSize, base, data.count, nil, COMPRESSION_ZLIB)
        }
        guard written > 0 else { throw CatalogueError.decode("The catalogue chunk could not be expanded.") }
        return Data(bytes: destination, count: min(written, rawSize))
    }

    private func drugs(slugs: [String]) throws -> [String: DrugRow] {
        guard !slugs.isEmpty else { return [:] }
        let marks = Array(repeating: "?", count: slugs.count).joined(separator: ",")
        let found = try rows("SELECT slug, name, category, evidence, summary FROM drugs WHERE slug IN (\(marks))", slugs.map { .text($0) })
        return Dictionary(uniqueKeysWithValues: found.map { ($0.slug, $0) })
    }

    private func rows(_ sql: String, _ binds: [SQLBind]) throws -> [DrugRow] {
        var items: [DrugRow] = []
        try query(sql, binds) { statement in
            items.append(DrugRow(
                slug: self.text(statement, 0),
                name: self.text(statement, 1),
                category: self.text(statement, 2),
                evidence: self.text(statement, 3),
                summary: self.text(statement, 4)
            ))
        }
        return items
    }

    private func oneRow(_ sql: String, _ binds: [SQLBind]) throws -> DrugRow? {
        try rows(sql, binds).first
    }

    private static let strainColumns = "id, slug, name, type, lineage, thc_low, thc_high, cbd_low, cbd_high, confidence, summary, terpenes, effects, adverse"

    private func strainQuery(_ sql: String, _ binds: [SQLBind]) throws -> [StrainRecord] {
        var items: [StrainRecord] = []
        try query(sql, binds) { statement in
            items.append(StrainRecord(
                recordID: self.text(statement, 0),
                slug: self.text(statement, 1),
                name: self.text(statement, 2),
                type: self.text(statement, 3),
                lineage: self.text(statement, 4),
                thcLow: self.double(statement, 5),
                thcHigh: self.double(statement, 6),
                cbdLow: self.double(statement, 7),
                cbdHigh: self.double(statement, 8),
                confidence: self.text(statement, 9),
                summary: self.text(statement, 10),
                terpenes: self.stringList(self.text(statement, 11)),
                effects: self.stringList(self.text(statement, 12)),
                adverse: self.stringList(self.text(statement, 13))
            ))
        }
        return items
    }

    private func intValue(_ sql: String, _ binds: [SQLBind]) throws -> Int {
        var value = 0
        try query(sql, binds) { statement in
            value = Int(sqlite3_column_int64(statement, 0))
        }
        return value
    }

    private func query(_ sql: String, _ binds: [SQLBind], _ body: (OpaquePointer) -> Void) throws {
        guard let handle else { throw CatalogueError.open("The catalogue is not open.") }
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(handle, sql, -1, &statement, nil) == SQLITE_OK, let statement else {
            throw CatalogueError.sql(String(cString: sqlite3_errmsg(handle)))
        }
        defer { sqlite3_finalize(statement) }
        for (offset, bind) in binds.enumerated() {
            let index = Int32(offset + 1)
            switch bind {
            case .text(let value):
                _ = value.withCString { pointer in
                    sqlite3_bind_text(statement, index, pointer, -1, transient)
                }
            case .int(let value):
                sqlite3_bind_int64(statement, index, sqlite3_int64(value))
            }
        }
        while true {
            let result = sqlite3_step(statement)
            if result == SQLITE_ROW {
                body(statement)
                continue
            }
            if result == SQLITE_DONE { return }
            throw CatalogueError.sql(String(cString: sqlite3_errmsg(handle)))
        }
    }

    private func text(_ statement: OpaquePointer, _ index: Int32) -> String {
        guard sqlite3_column_type(statement, index) != SQLITE_NULL, let raw = sqlite3_column_text(statement, index) else { return "" }
        let count = Int(sqlite3_column_bytes(statement, index))
        let bytes = UnsafeRawPointer(raw).assumingMemoryBound(to: UInt8.self)
        return String(bytes: UnsafeBufferPointer(start: bytes, count: count), encoding: .utf8) ?? ""
    }

    private func blob(_ statement: OpaquePointer, _ index: Int32) -> Data {
        guard let raw = sqlite3_column_blob(statement, index) else { return Data() }
        return Data(bytes: raw, count: Int(sqlite3_column_bytes(statement, index)))
    }

    private func double(_ statement: OpaquePointer, _ index: Int32) -> Double? {
        guard sqlite3_column_type(statement, index) != SQLITE_NULL else { return nil }
        return sqlite3_column_double(statement, index)
    }

    private func stringList(_ raw: String) -> [String] {
        guard let data = raw.data(using: .utf8), let values = try? JSONDecoder().decode([String].self, from: data) else { return [] }
        return values.filter { !$0.isEmpty }
    }

    private func likePrefix(_ term: String) -> String {
        let escaped = term
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "%", with: "\\%")
            .replacingOccurrences(of: "_", with: "\\_")
        return "\(escaped)%"
    }
}

private enum SQLBind {
    case text(String)
    case int(Int)
}
