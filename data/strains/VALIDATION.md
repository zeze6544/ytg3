# Strain archive validation — 2026-10-21

Counts come from `data/strains/report.json`, produced by `scripts/strains/build-strains.mjs` against the published index (`apps/mobile/public/strains/`, generated, not committed). Every id is `s_` plus the slug.

## Records

| | |
| --- | ---: |
| Records | 42,834 |
| Unique slugs | 42,834 |
| Unique ids | 42,834 |
| Cultivars | 28,330 |
| Registry products | 14,504 |
| Excluded before publish | 2 |
| Collapsed as the same cultivar | 2,064 |
| Collapsed as the same registry filing | 3,031 |

The two exclusions are scraped page chrome, not cultivar names: `seeds` ("Seeds") and `age-verification` ("AGE VERIFICATION"), both from the listing scrape.

## Duplicates removed

A cultivar was collapsed when it shared a family key, the same autoflower flag, and the same breeder group with another record (one named breeder, several, or none). The record that stays is the curated or name-list entry when one exists, otherwise the shorter exact name. Seller listings from the dropped record are kept on the one that remains, and the dropped name is kept as an alias. Different breeders stay separate. 3,658 cultivar families still have more than one member.

A registry product was collapsed when it was the same filing again: same normalised name, brand, form (flower, grind, preroll, or other), and the same THC and CBD figures, with only the pack size or batch code changed. A different form or a different label brand stays. After this pass, no record is flagged as a suspected duplicate.

## Evidence on file

| | |
| --- | ---: |
| With a source other than the NIDA class note or the bare name list | 33,682 |
| With any cannabinoid figure | 25,064 |
| With a sourced cannabinoid figure (lab, registry, or seller claim) | 25,007 |
| With a lab aggregate | 3,263 |
| With a measured terpene | 7,170 |
| With any terpene (measured or only mentioned) | 7,949 |
| With lineage | 15,778 |
| With conflicting lineage claims | 2,070 |
| With a breeder | 17,029 |
| Documented (completeness ≥ 60) | 11,302 |
| Partial (25–59) | 20,298 |
| Needs research (< 25) | 11,234 |

A registry figure is one filing. Listing THC and CBD of 0/0 are treated as missing (2,482 THC, 122 CBD). Lab rows that are all zero, or above 45% cannabinoid or 10% terpene, are excluded.

## Images

| | |
| --- | ---: |
| Stored PNG (thumbnail and detail), renderer v4 | 894 |
| Failed | 0 |
| Rendered on the device from the same geometry | 41,940 |

Uniqueness was measured on the earlier 47,931-record set. The published 42,834 records are a subset of that collision-free set, after the page-chrome names and the collapsed duplicates were removed. The 106 stored images that belonged to a collapsed record were deleted with it.

- 47,931 distinct 256-bit dHashes, 0 exact collisions
- 47,913 distinct 64-bit dHashes
- 1,148,666,415 pairs compared; minimum Hamming distance 9; median 114
- Pixel re-render of the 200 closest pairs: at least 2.6% of pixels differ; the closest pairs are unrelated families

A record with no stored file still gets its own render. The screen says "Drawing this specimen" while that render is in progress, and "Image unavailable" if it fails. That message is not a picture of some other strain.

## Research still open

11,234 records score under 25 and are the needs-research queue. The research pass, run before this collapse, read 3,000 records and filed proposals on 67. It does not write those proposals into the files. 400 of 20,668 listing URLs have been checked: 381 answered, 19 are broken. TGA product files from the 1 Jan–30 Jun 2026 list are flagged for review after 2027-01-31.

## Checks run

- `tsc --noEmit` in `apps/mobile`: clean after the readable-type pass.
- Headless Chrome against the Expo dev server. The age gate is the first screen; confirming it opens the archive. Home shows 13,617 substances and 42,834 strains. Substance search for morphine opens the morphine file, including "Not on this file." where a field is empty. Mix check for alcohol and heroin returns Deadly and says the pair can kill. The strain index shows 42,834 files. Blue Dream opens with a stored drawing captioned as not a photograph, and the identity section is readable. An unknown substance says "File not found." An unknown strain says "No strain file has this address." Strain maintenance stays locked when sign-in is not configured. At 390px the five tab labels fit on one line. No console errors on that pass.
