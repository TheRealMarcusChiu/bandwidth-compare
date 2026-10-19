# Transceiver form-factor guide audit: 2026-10-18

Scope: add a separate, searchable guide to Ethernet transceiver form factors (`form-factors.html`, data in `js/form-factors.js`). A form factor is a module and cage shape, not a link standard or rate, so the guide is kept apart from the bandwidth catalog. The MSA-verified OSFP subset is in the comparator catalog as the only source-verified transceiver entries (see "Comparator entries" below). The 18 other guide rows with a numeric rate are comparator entries too, as user-supplied, unverified figures (see "User-supplied comparator entries"). DSFP and the seven legacy names have no numeric rate in the guide, so they stay out of `INTERFACES`, the comparator search index, the A/B selectors, totals and ratios. `tests/unit/form-factors.test.mjs`, `tests/unit/osfp.test.mjs` and `tests/unit/user-transceivers.test.mjs` assert this split and keep this document in sync with the data.

Method: the only primary source that was fetched and read is the OSFP MSA site. Every other value is user-supplied and is labelled that way on the page and below. A value that the supplied notes don't give is shown as "Not source-verified in this update; consult the exact MSA or module datasheet." It is never inferred. The guide has six columns: Form factor | Ethernet data rate | Fiber/medium | Representative reach | Module-dependent details | Typical connector.

## Row scope

The guide has 30 rows in six groups:

| Group | Rows | Names |
|---|---|---|
| SFP | 6 | SFP, SFP+, SFP28, SFP56, SFP112, SFP224 |
| SFP-DD / DSFP | 3 | SFP-DD56, SFP-DD112, DSFP |
| QSFP | 6 | QSFP, QSFP+, QSFP28, QSFP56, QSFP112, QSFP224 / QSFP800 |
| QSFP-DD | 4 | QSFP-DD (200G), QSFP-DD (400G), QSFP-DD800, QSFP-DD1600 |
| OSFP | 4 | OSFP56 / OSFP400, OSFP112 / OSFP800, OSFP224 / OSFP1600, OSFP-XD |
| Legacy | 7 | XFP, XENPAK / X2, CFP, CFP2, CFP4, CPAK, CXP |

The combined rows are QSFP224 / QSFP800, OSFP56 / OSFP400, OSFP112 / OSFP800, OSFP224 / OSFP1600 and XENPAK / X2. No row was created for unnamed or truncated material in the supplied notes.

## Source matrix

| Source | URL | Result on 2026-10-18 | Used for |
|---|---|---|---|
| OSFP MSA, official site and FAQ | https://www.osfpmsa.org/ | Fetched and read | OSFP and OSFP-XD rate and electrical-lane mappings only. Status badge "OSFP MSA: rate & lanes" |
| SNIA SFF Specifications | https://www.snia.org/technology-communities/sff/specifications | HTTP 200, title "SFF Specifications \| SNIA \| Experts on Data". The fetch did not expose the underlying document content | Linked as the official specification index only. It is not cited as proof of any number |
| QSFP-DD MSA | https://www.qsfp-dd.com/ | Timed out, including likely spec and document paths | Linked, but called inaccessible in this audit. No QSFP-DD value is verified against it |
| Cisco and other vendor datasheets | (not linked) | HTTP 403 to automated requests. Exact SFP56, QSFP28 and coherent 400G/800G datasheets were not matched | Nothing. Reach examples remain user-supplied |
| Site owner's form-factor notes | (not linked) | User-supplied | All non-OSFP rates, media, reach examples, connectors and lane notes, labelled "User-supplied, unverified". The numeric rates are also the 18 user-supplied comparator entries, cited there as `user-seed` |

## OSFP MSA: claim mapping

The OSFP MSA FAQ states:

- OSFP has 8 high-speed electrical lanes and supports up to 400 Gb/s (8×50G), 800 Gb/s (8×100G) or 1.6 Tb/s (8×200G).
- OSFP-XD is a 16-lane form factor. Its FAQ lists 800 Gb/s (16×50G), 1.6 Tb/s (16×100G) and 3.2 Tb/s (8×200G).

| Row | Rate | Module-dependent details | MSA claim |
|---|---|---|---|
| OSFP56 / OSFP400 | 400G | 8×50G electrical lanes | "400 Gb/s (8×50G)" |
| OSFP112 / OSFP800 | 800G | 8×100G electrical lanes; "112" is the lane signaling class, not the aggregate module rate | "800 Gb/s (8×100G)" |
| OSFP224 / OSFP1600 | 1.6T | 8×200G electrical lanes; "224" is the lane signaling class, not the aggregate module rate | "1.6 Tb/s (8×200G)" |
| OSFP-XD | 800G; 1.6T; 3.2T | 16 electrical lanes: 800G = 16×50G; 1.6T = 16×100G; 3.2T = 8×200G | "800 Gb/s (16×50G)", "1.6 Tb/s (16×100G)", "3.2 Tb/s (8×200G)" |

The OSFP verification covers rate and lane mapping only. Medium, reach and connector for the OSFP rows are not source-verified and show the not-verified note.

**Correction, OSFP-XD 3.2T lane mapping.** The MSA FAQ gives 3.2 Tb/s as 8×200G. The guide reproduces that mapping as published, not 16×200G, even though OSFP-XD is described as a 16-lane form factor. A unit test fails if "16×200G" appears anywhere except in that explicit "not 16×200G" caveat.

The "112" and "224" class names refer roughly to 100G- and 200G-class electrical-lane signaling generations, not to aggregate module capacity. The guide never conflates the two.

## Comparator entries (OSFP MSA subset, source-verified)

Follow-up on 2026-10-18: the four guide rows marked `msa-verified` (OSFP56 / OSFP400, OSFP112 / OSFP800, OSFP224 / OSFP1600, OSFP-XD) were promoted into the comparator catalog in `js/data.js`. OSFP-XD's three rates are split, so there are six entries, one per MSA rate/lane mapping. That step took the catalog from 348 to 354 (150 non-DDR rows: the 144 baseline rows plus these six, and 34 DDR rates × 6 channel counts).

| ID | Name | Width | GB/s | MSA claim |
|---|---|---|---|---|
| `osfp-400g` | OSFP56 / OSFP400 module (400 Gb/s, 8×50G) | 8 × 50G lanes | 50 | "400 Gb/s (8×50G)" |
| `osfp-800g` | OSFP112 / OSFP800 module (800 Gb/s, 8×100G) | 8 × 100G lanes | 100 | "800 Gb/s (8×100G)" |
| `osfp-1-6t` | OSFP224 / OSFP1600 module (1.6 Tb/s, 8×200G) | 8 × 200G lanes | 200 | "1.6 Tb/s (8×200G)" |
| `osfp-xd-800g` | OSFP-XD module (800 Gb/s, 16×50G) | 16 × 50G lanes | 100 | "800 Gb/s (16×50G)" |
| `osfp-xd-1-6t` | OSFP-XD module (1.6 Tb/s, 16×100G) | 16 × 100G lanes | 200 | "1.6 Tb/s (16×100G)" |
| `osfp-xd-3-2t` | OSFP-XD module (3.2 Tb/s, 8×200G) | 8 × 200G lanes | 400 | "3.2 Tb/s (8×200G)", not 16×200G |

How they are labelled:

- Basis *Advertised link rate*, status *Connector / form factor*, verification *Cited source*, category Network. Source `osfp-msa` (https://www.osfpmsa.org/, primary), shown in each row's comparison details and in the methodology source list.
- Notes call the figure the OSFP MSA aggregate module capacity, not usable payload throughput. The MSA publishes the rate and electrical-lane mapping; it does not specify the Ethernet PHY, optical medium or reach, and the rows make no production availability claim.
- MSA module capacity is not IEEE PHY status. The generic IEEE Ethernet rows are unchanged, including the in-development, unratified 1.6 Tb/s row (`eth-1600g`); the two 1.6 Tb/s OSFP rows point to it rather than implying a ratified 1.6 Tb/s Ethernet PHY.

These six are the only transceiver entries with `verification: 'sourced'`. The other numeric guide rows were added later as unverified entries (next section); OSFP queries such as "osfp", "OSFP-XD" and "osfp800" still return only these six.

## User-supplied comparator entries (unverified)

Follow-up on 2026-10-18: the 18 non-MSA guide rows that give an explicit numeric rate were added to the comparator catalog in `js/data.js`, after the OSFP rows and in guide order. The catalog grows from 354 to 372 entries (168 non-DDR rows: the 144 baseline rows, the six OSFP rows and these 18, plus 34 DDR rates × 6 channel counts). The guide itself is unchanged at 30 rows.

These are the site owner's values, not verified standards. Each entry:

- Uses the guide's nominal Ethernet data-rate column exactly as supplied, on the shared *Advertised link rate* basis. GB/s is the exact Gb/s ÷ 8; no coding or overhead adjustment is inferred, so raw and encoding-adjusted modes show the same figure. The unusual QSFP 4G value is kept as supplied, not corrected.
- Cites only `user-seed` (no extra source citations), has `verification: 'unverified'` (the Unverified badge) and status *User-supplied* (`user-supplied`, "User-supplied form-factor rate (not independently verified)"). SFP224 keeps status *In development* (`developing`), is also unverified, and its notes repeat that current production/availability status was not independently verified.
- Has notes saying the value came from the site owner's transceiver form-factor guide, was not independently verified, and is not a verified Ethernet PHY or standard, not payload throughput, and makes no reach, medium or production-availability claim.
- Shows a lane mapping only where the guide states one, marked unverified (width "2 × 50G lanes (unverified)" and so on). Every other row's width reads "Lane mapping not source-verified"; no lane count is guessed.

| Guide row | Gb/s as supplied | ID | GB/s | Status | Lane mapping |
|---|---|---|---|---|---|
| SFP | 1 | `sfp-1g` | 0.125 | User-supplied | Not source-verified |
| SFP+ | 10 | `sfp-plus-10g` | 1.25 | User-supplied | Not source-verified |
| SFP28 | 25 | `sfp28-25g` | 3.125 | User-supplied | Not source-verified |
| SFP56 | 50 | `sfp56-50g` | 6.25 | User-supplied | Not source-verified |
| SFP112 | 100 | `sfp112-100g` | 12.5 | User-supplied | Not source-verified |
| SFP224 | 200 | `sfp224-200g` | 25 | In development | Not source-verified |
| SFP-DD56 | 100 | `sfp-dd56-100g` | 12.5 | User-supplied | 2 × 50G (as supplied, unverified) |
| SFP-DD112 | 200 | `sfp-dd112-200g` | 25 | User-supplied | 2 × 100G (as supplied, unverified) |
| QSFP | 4 | `qsfp-4g` | 0.5 | User-supplied | Not source-verified |
| QSFP+ | 40 | `qsfp-plus-40g` | 5 | User-supplied | Not source-verified |
| QSFP28 | 100 | `qsfp28-100g` | 12.5 | User-supplied | Not source-verified |
| QSFP56 | 200 | `qsfp56-200g` | 25 | User-supplied | Not source-verified |
| QSFP112 | 400 | `qsfp112-400g` | 50 | User-supplied | Not source-verified |
| QSFP224 / QSFP800 | 800 | `qsfp224-800g` | 100 | User-supplied | 4 × 200G (as supplied, unverified) |
| QSFP-DD (200G) | 200 | `qsfp-dd-200g` | 25 | User-supplied | Not source-verified |
| QSFP-DD (400G) | 400 | `qsfp-dd-400g` | 50 | User-supplied | Not source-verified |
| QSFP-DD800 | 800 | `qsfp-dd-800g` | 100 | User-supplied | Not source-verified |
| QSFP-DD1600 | 1600 | `qsfp-dd-1600g` | 200 | User-supplied | Not source-verified |

Not added: DSFP and the seven legacy names (XFP, XENPAK / X2, CFP, CFP2, CFP4, CPAK, CXP) have no numeric rate in the user guide, so there is nothing to compare. They stay listed in the guide only, and a unit test checks that searching any of their names returns no comparator entry.

Search: comparator search matches substrings, so "sfp" finds every OSFP and user-supplied transceiver row, and "sfp112" also finds OSFP112 and QSFP112. Search compacts each field separately, so a match cannot span two fields (for example, "…supplied" followed by "SFP" does not match "dsfp").

## User-supplied values (unverified)

These reach figures are illustrative examples from the site owner's notes. They are not independently verified standards, and the page tells readers to check the exact optic datasheet.

| Row | Rate | Medium | Representative reach | Connector |
|---|---|---|---|---|
| SFP | 1G | MMF, SMF, copper | MMF 550 m; SMF 10–80 km (specialty longer); copper 100 m | Duplex LC; simplex LC (BiDi); RJ45 (copper) |
| SFP+ | 10G | MMF (OM3/OM4), SMF, copper | MMF 300 m OM3 / 400 m OM4; SMF 10/40/80 km (specialty 120 km); RJ45 commonly 30–100 m | LC; RJ45 (copper) |
| SFP28 | 25G | MMF (OM3/OM4), SMF | MMF 70 m OM3 / 100 m OM4; SMF 10/25/40 km (specialty longer) | LC |
| SFP56 | 50G | MMF, SMF | MMF 70–100 m; SMF 10–40 km (user-supplied, unverified) | LC |
| SFP112 | 100G | MMF, SMF | MMF typically 50–100 m; SMF 500 m / 2 km / 10 km, module-dependent (user-supplied, unverified) | LC |
| SFP224 | 200G | not verified | No single family-wide reach; module-dependent. Emerging generation, marked developing. Current production/availability status was not independently verified; the guide asserts neither production nor non-production | not verified |

Other user-supplied values. Fields not listed show the not-verified note.

- SFP-DD56: 100G, using 2×50G electrical lanes.
- SFP-DD112: 200G, using 2×100G electrical lanes; module-dependent.
- QSFP: 4G, kept as supplied and marked "not independently verified". It was not silently changed.
- QSFP+ 40G, QSFP28 100G, QSFP56 200G, QSFP112 400G.
- QSFP224 / QSFP800: 800G, using 4×200G electrical lanes (as supplied, not independently verified).
- QSFP-DD (200G), QSFP-DD (400G), QSFP-DD800, QSFP-DD1600: 200G, 400G, 800G and 1.6T generations. No lane mapping is shown. Each row reads "Lane mapping not source-verified in this update", because the QSFP-DD MSA could not be retrieved. None is elevated to "standard verified".

Named only, with every value not verified: DSFP ("not verified in this update; see the exact MSA or module") and the legacy XFP, XENPAK / X2, CFP, CFP2, CFP4, CPAK and CXP. No rate was invented for any of them.

## Caveats shown on the page

- Reach figures are illustrative and require the exact module datasheet.
- 112/224 are lane signaling classes, not module rates.
- OSFP-XD 3.2T is 8×200G as the MSA states it, not 16×200G.
- OM3, OM4 and OM5 are MMF grades. OS2 is typical SMF cabling. MTP is a branded MPO implementation.
- The connector column is the media-side optical or copper interface, not the host electrical contacts. DAC is copper. AOC is captive optical fiber and often has no detachable LC/MPO media connector.

## Source gaps and exclusions

- **QSFP-DD MSA** (https://www.qsfp-dd.com/) timed out. QSFP-DD values stay user-supplied and unverified until an exact MSA document is retrieved directly.
- **Cisco and vendor pages** returned 403. No vendor datasheet backs any reach figure.
- **SNIA** is cited as the official SFF index only, not as proof of any figure.
- **Ambiguous date excluded.** The supplied source note included an unattached date, "June 03, 2021". It could not be tied to a cited source, so it is not presented as a source date anywhere in the guide. A unit test asserts that no "2021" date appears in the guide data.
