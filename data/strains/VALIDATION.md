# Strain archive validation — 2026-10-21

Counts come from `data/strains/report.json`, produced by `scripts/strains/build-strains.mjs` against the published index (`apps/mobile/public/strains/`, generated, not committed). Every id is `s_` plus the slug.

## Records

| | |
| --- | ---: |
| Records | 47,929 |
| Unique slugs | 47,929 |
| Unique ids | 47,929 |
| Cultivars | 30,394 |
| Registry products | 17,535 |
| Excluded before publish | 2 |

The two exclusions are scraped page chrome, not cultivar names: `seeds` ("Seeds") and `age-verification` ("AGE VERIFICATION"), both from the listing scrape.

## Suspected duplicates

3,810 records sit in a cluster of two or more that share a family key, the same autoflower flag, and the same breeder group (one named breeder, several, or none). That is a suspicion, not a merge. 4,468 cultivar families have more than one member. The admin duplicate queue lists 1,126 non-canonical records from those clusters. An administrator can mark a pair "not a duplicate"; nothing is merged automatically.

## Evidence on file

| | |
| --- | ---: |
| With a source other than the NIDA class note or the bare name list | 38,747 |
| With any cannabinoid figure | 28,973 |
| With a sourced cannabinoid figure (lab, registry, or seller claim) | 28,921 |
| With a lab aggregate | 3,695 |
| With a measured terpene | 8,319 |
| With any terpene (measured or only mentioned) | 9,109 |
| With lineage | 17,652 |
| With conflicting lineage claims | 2,787 |
| With a breeder | 18,939 |
| Documented (completeness ≥ 60) | 10,978 |
| Partial (25–59) | 25,496 |
| Needs research (< 25) | 11,455 |

A registry figure is one filing. Listing THC and CBD of 0/0 are treated as missing (2,482 THC, 122 CBD). Lab rows that are all zero, or above 45% cannabinoid or 10% terpene, are excluded.

## Images

| | |
| --- | ---: |
| Stored PNG (thumbnail and detail), renderer v4 | 1,000 |
| Failed | 0 |
| Rendered on the device from the same geometry | 46,929 |

Uniqueness was measured on the 47,931-record set that still included the two page-chrome names above. Those two were inside a collision-free set, so the published 47,929 are a subset of it.

- 47,931 distinct 256-bit dHashes, 0 exact collisions
- 47,913 distinct 64-bit dHashes
- 1,148,666,415 pairs compared; minimum Hamming distance 9; median 114
- Pixel re-render of the 200 closest pairs: at least 2.6% of pixels differ; the closest pairs are unrelated families

A record with no stored file still gets its own render. The CRT placeholder ("SPECIMEN QUEUED" / "SPECIMEN UNAVAILABLE") is what the screen shows before that render finishes, or if it fails. It is not a substitute picture of some other strain.

## Research still open

11,455 records score under 25 and are the needs-research queue. The research pass has read 3,000 of 11,461 queued records and filed proposals on 67. It does not write those proposals into the files. 8,461 records in that pass are still unread. 400 of 20,668 listing URLs have been checked: 381 answered, 19 are broken. 497 TGA product files are flagged for review after 2027-01-31 because the source list covers 1 Jan–30 Jun 2026.

## Checks run

- `tsc --noEmit` in `apps/mobile`: clean.
- ESLint (expo flat config, temporary install, not saved): clean on the strain screens and the nug components. Seven `set-state-in-effect` errors remain in files this change did not introduce (`files.tsx`, `mix.tsx`, `_layout.tsx`, `session.tsx`).
- Headless Chrome against the Expo dev server, gate set in localStorage: list total 47,929; search by name, alias ("sweet soma" → 4), parent ("purple urkle" → 83), and breeder ("barney's farm" → 415); empty search; indica facet 3,158; lab-results filter 3,695; load-more 24 → 48; clear filters back to 47,929. Blue Dream shows all ten sections, a stored-asset caption, and a lineage link to `/strain/blueberry`. A Connecticut product renders on the device and is captioned that way. An unknown slug says "Not found". Admin says sign-in is not configured and stays locked. Home, Files, Mix, and More render. At 390px, list and detail scroll widths equal the viewport. No console errors and no failed requests.
