# BANDWIDTH / compare

A static site that compares the peak bandwidth of two interfaces: memory (HBM, GDDR, DDR, LPDDR), PCIe, SAS/SATA, U.2/U.3/M.2, SD, USB, Thunderbolt, DisplayPort/HDMI and Ethernet. Every number states what kind of number it is.

It uses plain HTML, CSS and ES modules. There is no framework, no build step, no remote fonts or scripts, and no tracking. A strict CSP (`default-src 'self'`) is set in `index.html`.

## Run locally

```sh
npm start            # node scripts/serve.mjs → http://127.0.0.1:8080/
# or any static server, e.g. python3 -m http.server
```

ES modules don't load over `file://`, so use a server. For GitHub Pages, publish the repository root. `.nojekyll` is included.

## Tests

```sh
npm test             # node --test: data validity, arithmetic, ratio/URL/search/sort logic (no deps)
npm i                # installs @playwright/test (dev only)
npx playwright install chromium
npm run test:e2e     # Playwright, desktop 1440×1000 + Pixel 7 mobile (+ fixed-size contexts in layout.spec)
```

The E2E suite starts its own server on port 4179 and stops it afterwards. It covers:

- keyboard and mouse filtering on both comboboxes
- arrows, Enter, Escape and outside-click dismissal
- the empty state
- swap, the unit toggle and URL state round-trips
- the Raw signaling / Encoding-adjusted switch: values, ratio, bars, picker previews, catalog values/basis/sort, details, screen-reader text, swap/unit/reload persistence, repeated toggles and malformed `m=`
- copy link
- invalid URL IDs
- identical selections
- the extreme ratio with a sub-pixel bar
- mixed-basis and unverified notices
- catalog filtering
- catalog sorting combined with filters, unit toggles and selections
- source links
- horizontal overflow and touch-target size
- zero console errors and zero remote requests
- (`layout.spec.mjs`) the compact comparison ends inside the first viewport at 375×667, 390×844, 360×740, 1366×768 and 1440×900 for default, long-name, mixed-basis, asymmetric, unverified, connector and extreme-ratio pairs, with legible minimum type sizes and nothing clipped
- (`layout.spec.mjs`) Comparison details: collapsed by default, holding the formulas, notes, full caveats and underlying link
- (`layout.spec.mjs`) the mode switch: 44px phone targets with short visible labels, raw previews in the phone picker sheet, swap/link/reload, and first-viewport fit in both modes (long DDR, HBM4E, unavailable-mode flags)
- (`layout.spec.mjs`) DDR channel configurations: phone-sheet search and pick, ratio, swap, share links (legacy and suffixed IDs), desktop combobox, the details Channels row and subchannel note, and catalog filter/sort
- (`layout.spec.mjs`) the mobile picker sheet: tap to browse with no keyboard, deliberate search, tap to pick, Cancel/Escape restore, focus trap and restore, list scroll that doesn't move the page, visual-viewport resize, 44px targets, and normal scrolling on a short landscape phone

It also writes `/tmp/bandwidth-desktop.png`, `/tmp/bandwidth-mobile.png`, `/tmp/bandwidth-sort-{desktop,mobile}.png`, `/tmp/bandwidth-fit-<WxH>-<case>.png`, `/tmp/bandwidth-sheet-375x667.png`, `/tmp/bandwidth-ddr-channels-375x667.png`, `/tmp/bandwidth-details-375x667.png` and `/tmp/bandwidth-landscape-740x360.png`, plus `/tmp/bandwidth-mode-{375x667,1366x768}.png`.

## Layout and mobile use

The page header, both selectors, the two values, the ratio, the bars and short warning flags form the compact comparison (`<section id="compare">`). It is sized to fit the first screen on common laptops (1366×768 and up) and portrait phones (360–390 px wide). The catalog and methodology sit below the fold.

- Spacing and the big numbers scale with viewport height and column width (`svh`, container `cqi` units and character count). Long values shrink instead of overflowing, down to a 26 px minimum. Nothing uses a fixed height or clipping. When the comparison can't fit (zoom, short landscape), the page simply scrolls.
- On phones, A and B values sit side by side. The picker buttons show the full interface names, wrapping if needed. The compact ratio line says "A lists 13.1× the figure of B", so long names can't grow it.
- Each side shows its basis and width badges. A status flag appears only when it is a caveat (Unverified, Not ratified, Vendor claim, Connector…), with the full wording in its `title` attribute. Short notice flags (Mixed basis, Unverified figure, Asymmetric link, Extreme difference, Identical selection) stay visible.
- **Comparison details** (a `<details>`, collapsed by default, between the comparison and the catalog) holds the full ratio sentence, each side's value in both units, formula, basis description, encoding, reverse direction, status, verification, notes, the connector's underlying link, the row's sources (title, publisher, kind), the full notice explanations and the linear-scale note.

### Picker sheet (narrow or short touch screens)

At widths ≤ 760 px, or on coarse-pointer screens ≤ 500 px tall, each selector is a full-width button showing the current name. The mode is set as `html.is-sheet-mode` by `js/combobox.js`.

- Tapping the button opens the same combobox (same `#cb-a`/`#lb-a` IDs and ARIA) as a full-screen `role="dialog"` `aria-modal` sheet. It has a title, a Cancel button, a 16 px+ search field and a scrollable, family-grouped list. Names are never truncated, and rows are at least 52 px tall.
- Browsing doesn't focus the search field, so no keyboard appears. Tapping the field is a deliberate search.
- Picking an option or Cancel closes the sheet. After touch, focus returns to the picker button, so the on-screen keyboard is dismissed and the comparison is visible. Cancel and Escape restore the previous name.
- While open, page scroll is locked (`html.cb-lock`) and the list uses `overscroll-behavior: contain`. The sheet is sized to `visualViewport`, so it shrinks above the on-screen keyboard.
- Keyboard: focusing the combobox opens the sheet for search. Arrows, Enter and Escape work as on desktop. Tab is trapped between the search field and Cancel, and focus returns to the combobox on close.

Wider screens keep the inline type-to-filter combobox unchanged.

## Catalog sorting

The catalog has a **Sort by** select. The options are original order, bandwidth highest or lowest first, name A–Z or Z–A, and family A–Z or Z–A. It reorders only the catalog table. The A/B comparator dropdowns always keep catalog order.

- Bandwidth sorts use the underlying `GBps` number, never the formatted string, so the order is the same in GB/s and Gb/s.
- Ties always break by natural, case-insensitive name A–Z (`x4` before `x16`), then by `id`. The result does not depend on input order.
- `sortItems()` (in `js/compare.js`) returns a copy and never mutates `INTERFACES`.
- The sort applies after search and category filtering. It persists while filters, units or A/B selections change. It is not saved in the URL and resets on reload.
- Family header rows show only in original and family orders. In other orders the family appears inline next to each name. `aria-sort` is set on the Interface or value column when a sort applies.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Markup, CSP, ARIA combobox shells |
| `styles.css` | Dark theme, responsive layout |
| `js/data.js` | Catalog, sources, basis/status/verification enums. All values computed here |
| `js/mode.js` | Pure display views per mode (`viewOf`, `modeSupport`); never changes the catalog |
| `js/compare.js` | Pure logic: formatting, ratio, bar widths, URL state, search, catalog sort (shared with tests) |
| `js/combobox.js` | Accessible type-to-filter combobox; full-screen picker sheet on narrow/touch screens |
| `js/app.js` | Rendering and events |
| `form-factors.html`, `js/form-factors-page.js` | Ethernet transceiver form-factor guide page (separate from the comparator; its MSA-verified OSFP capacities and its other numeric rates, as user-supplied unverified rows, also have catalog rows) |
| `js/form-factors.js` | Guide data, sources and pure search. Not imported by the comparator (the six OSFP and 18 user-supplied transceiver catalog rows live in `js/data.js`) |
| `scripts/serve.mjs` | Zero-dependency static server (serves only site files) |
| `tests/unit/*.test.mjs` | `node --test` suites (`sort.test.mjs` covers catalog sorting; `additions.test.mjs` covers the 2026-10-16 audit rows and keeps `docs/catalog-audit.md` in sync; `channels.test.mjs` covers DDR channel configurations) |
| `tests/unit/mode.test.mjs` | Mode views, ratio/bars/sort per mode, memory invariance, unsupported rows, URL `m=` |
| `tests/e2e/app.spec.mjs` | Playwright suite |
| `tests/e2e/layout.spec.mjs` | Viewport-fit, Comparison details and mobile picker sheet tests (fixed-size contexts, run once) |
| `tests/unit/form-factors.test.mjs`, `tests/e2e/form-factors.spec.mjs` | Guide rows, search, OSFP mappings, which guide rows reach `INTERFACES`, audit-doc sync; page search, no-results, keyboard, phone overflow, OSFP-XD 3.2T selectable with its source, QSFP-DD1600 selectable with its unverified warning and provenance, DSFP not selectable |
| `tests/unit/user-transceivers.test.mjs` | The 18 user-supplied transceiver rows: exact ids, rates, Gb/s ÷ 8 conversions, provenance, statuses, SFP224 caveat, lane-mapping labels, search, DSFP/legacy exclusion, doc sync |

## Ethernet transceiver form factors

`form-factors.html` is a separate guide, linked from the comparator footer. It covers 30 form factors (SFP, SFP-DD/DSFP, QSFP, QSFP-DD, OSFP and legacy modules) in six columns: form factor, Ethernet data rate, fiber/medium, representative reach, module-dependent details and typical connector. A form factor is a shape, not a link rate. The MSA-verified OSFP subset is in the comparator: the four OSFP/OSFP-XD guide rows whose rate and electrical-lane mapping match the OSFP MSA FAQ become six catalog entries, one per mapping (`osfp-400g` 8×50G, `osfp-800g` 8×100G, `osfp-1-6t` 8×200G, `osfp-xd-800g` 16×50G, `osfp-xd-1-6t` 16×100G, `osfp-xd-3-2t` 8×200G, never 16×200G). They are advertised-link rows with status *Connector / form factor*, cite the OSFP MSA as a primary source and are labelled as aggregate module capacity, not usable payload; the MSA does not specify the Ethernet PHY, medium, reach or production availability, and the generic IEEE Ethernet rows (including the in-development 1.6 Tb/s row) are unchanged. `tests/unit/osfp.test.mjs` pins all of this. OSFP rows are the only source-verified transceiver entries.

The 18 other guide rows with a numeric rate are also comparator entries, as **user-supplied, unverified** figures (`tests/unit/user-transceivers.test.mjs`): `sfp-1g`, `sfp-plus-10g`, `sfp28-25g`, `sfp56-50g`, `sfp112-100g`, `sfp224-200g`, `sfp-dd56-100g`, `sfp-dd112-200g`, `qsfp-4g`, `qsfp-plus-40g`, `qsfp28-100g`, `qsfp56-200g`, `qsfp112-400g`, `qsfp224-800g`, `qsfp-dd-200g`, `qsfp-dd-400g`, `qsfp-dd-800g` and `qsfp-dd-1600g`. Each takes the guide's nominal Ethernet data-rate column exactly as supplied (QSFP stays at 4 Gb/s) on the shared advertised-link basis, converted Gb/s ÷ 8 with no coding or overhead adjustment. They cite only `user-seed`, carry status *User-supplied* (SFP224 keeps *In development* and its production/availability caveat) and the Unverified badge, and their notes say the value is from the site owner's guide, not independently verified, and not a verified Ethernet PHY or standard, payload throughput, reach, medium or production-availability claim. A lane mapping is shown only where the guide states one (SFP-DD56 2 × 50G, SFP-DD112 2 × 100G, QSFP224 4 × 200G), marked unverified; every other row reads "Lane mapping not source-verified". DSFP and the seven legacy names (XFP, XENPAK / X2, CFP, CFP2, CFP4, CPAK, CXP) have no numeric rate in the guide, so they stay guide-only: they are not in `INTERFACES`, the selectors, the catalog or any ratio.

- Search is case-insensitive across every cell. Tokens are ANDed and must start a word, so `SFP112` doesn't match QSFP112. The result count is announced, a no-results message replaces the table, and Escape clears the field.
- On phones the table scrolls sideways inside a focusable, labelled region, with form-factor names pinned. The page itself never scrolls horizontally.
- Only the OSFP rows' rates and lane mappings are verified, against the OSFP MSA FAQ (fetched 2026-10-18). OSFP-XD 3.2T is shown as 8×200G, as the MSA states it. Everything else is user-supplied and labelled unverified, in the guide and in the comparator. The reach figures are illustrative. QSFP-DD values are unverified because the QSFP-DD MSA site timed out. Unknown values read "Not source-verified in this update" and are never inferred.
- [docs/transceiver-form-factors-audit.md](docs/transceiver-form-factors-audit.md) holds the source matrix, the OSFP claim mapping and the gaps.

## Raw signaling / Encoding-adjusted

A two-state **Figures** switch in the header (radio group: *Raw signaling* / *Encoding-adjusted*, default Encoding-adjusted) applies to every number on the page: both values, the ratio and bars, picker previews, catalog values, basis badges and bandwidth sort, the details Value/Formula/Basis/Figures rows, notices and the screen-reader text (bar label, catalog caption, "… figures:" lead-in). On phones the visible labels shorten to "Raw" / "Enc-adj"; the full names stay the accessible names.

The catalog (`js/data.js`) is unchanged. `viewOf(item, mode)` in `js/mode.js` derives a frozen, cached display view:

| Rows | Encoding-adjusted | Raw signaling |
|---|---|---|
| `encoding-adjusted` rows with a documented line code: PCIe 1.0–2.0 (8b/10b), PCIe 3.0–5.0 (128b/130b), SATA I–III, M.2 SATA, U.2/U.3/M.2 NVMe, SD UHS-II/III, SD Express | as listed (× 8/10 or × 128/130) | `bitsPerSecond ÷ 8`: the factor is removed, basis becomes Raw signaling, formula reads e.g. `8 GT/s × 4 lanes ÷ 8 (raw, 128b/130b not subtracted)` |
| Memory (HBM, GDDR, DDR incl. channel rows, LPDDR) | unchanged, Theoretical memory peak | unchanged; never relabelled as raw |
| Raw rows: PCIe 6.0–8.0, SAS, DisplayPort, HDMI | unchanged; "Encoding adjustment unavailable; Raw signaling shown." PCIe 6.0+ adds that FLIT framing/FEC overhead is not subtracted and this is not an adjusted payload rate | unchanged (already raw) |
| Advertised rows: USB, Thunderbolt, USB4, Ethernet, SD UHS-I | unchanged; "Encoding adjustment unavailable; Advertised link rate shown." | unchanged; "Raw signaling unavailable; Advertised link rate shown." |

Rules:

- Only rows whose basis is `encoding-adjusted` **and** whose `efficiency` is not 1/1 are converted. A 1/1 efficiency means "no factor recorded", not "no overhead", so nothing is invented for raw or advertised rows, and advertised throughput is never adjusted twice.
- No new line-code factors were added for SAS, DisplayPort, HDMI or USB 5/10 Gbps. Their notes mention an encoding, but the cited sources were not re-checked for an explicit factor in this change, so they stay as listed. Ethernet, Thunderbolt and USB4 marketing rates are never mapped to a physical encoding.
- Encoding-adjusted is still not usable throughput: packet, framing and protocol overhead remain.
- The mode only reverses the line-code factor. Lane widths, DDR channels and asymmetric reverse rates are untouched.
- A short flag ("A, B: encoding adjustment unavailable" / "…: raw signaling unavailable") appears when a non-memory side can't follow the mode, unless the Mixed basis flag already covers that comparison. Details always carry the full explanation.

URL: `m=raw` selects raw signaling. Encoding-adjusted is the default and is omitted from the URL, so every older link (no `m=`) keeps its original figures. `m=adjusted` is accepted, matching is case-insensitive, and any other value falls back to Encoding-adjusted with a notice (`Unknown mode “…”, using Encoding-adjusted.`). Examples:

- `/?a=pcie3-x4&b=sata3`: 3.938 vs 0.6 GB/s (adjusted, 6.56×)
- `/?a=pcie3-x4&b=sata3&m=raw`: 4 vs 0.75 GB/s (5.33×)
- `/?a=pcie4-x4&b=sata3&u=Gbps&m=raw`: 64 vs 6 Gb/s
- `/?a=ddr5-9200-16ch&b=hbm4e-samsung-max&m=raw`: memory, identical in both modes
- `/?a=pcie6-x16&b=dp21-uhbr20`: both raw; encoding adjustment unavailable

## DDR channel configurations

In this catalog a **channel** is one 64-bit data bus (payload bits only, no ECC), which is one conventional DIMM channel. Every DDR, DDR2, DDR3, DDR4 and DDR5 rate is listed in 1, 2, 4, 8, 12 and 16 channel configurations:

- **Aggregate peak scales exactly by N.** `bitsPerSecond = MT/s × 64 × N`, width is `64 × N` bits, and the formula names the count, e.g. `6400 MT/s × 64 bits × 8 channels ÷ 8 = 409.6 GB/s`. The per-pin rate does not change.
- **DDR5 subchannels are counted once.** A DDR5 DIMM splits its 64 bits into two 32-bit subchannels. Here those two subchannels together are one 64-bit channel (2 × 32 = 64), so "8 channels" of DDR5-6400 is 8 × 64 bits, not 16 × 64 bits. Some vendors count each subchannel as a channel; this catalog doesn't, and the row notes say so.
- **Names state the count, singular or plural:** `DDR5-6400 · 1 channel`, `DDR5-6400 · 2 channels`. The same name appears in both selectors (desktop and the mobile sheet), the value cards, bars, details and catalog. There is no separate channel dropdown.
- **IDs.** The 1-channel row keeps the original id (`ddr5-6400`), so existing share links still work. Other counts add a stable suffix: `ddr5-6400-2ch`, `-4ch`, `-8ch`, `-12ch`, `-16ch`.
- **Search** understands `ddr5-6400 8 channels`, `8-channel`, `8ch`, `single`/`dual`/`quad`/`octa channel`, `twelve channel` and `sixteen channel`. A count followed by a channel word is one search token, so `8 channels` doesn't match unrelated 8s.
- **These are theoretical configurations.** They are not a claim that any processor supports every channel count with every generation. Each configuration inherits its rate's status, verification and sources. For example, every DDR5-9200 configuration stays unverified.
- **Not changed:** LPDDR rows (still normalized to 64 bits, LPDDR6 at 24), DDR5 MRDIMM (one host channel) and every non-DDR row. `tests/unit/channels.test.mjs` checks them against `tests/unit/fixtures/catalog-baseline.json`, which was captured before this change.

The catalog has 372 entries: 168 non-DDR rows (the 144 baseline rows, the six OSFP MSA rows and the 18 user-supplied transceiver rows) plus 34 DDR rates × 6 channel counts.

## Data schema

Each interface (`INTERFACES` in `js/data.js`, frozen objects):

| Field | Meaning |
|---|---|
| `id` | URL-safe unique id used in `?a=&b=` |
| `name`, `family`, `category`, `aliases` | Display and search |
| `basis` | `raw-signaling` · `encoding-adjusted` · `memory-theoretical` · `advertised-link` |
| `bitsPerSecond` | **Integer** aggregate signaling rate across the stated width, one direction |
| `efficiency` | `[num, den]` line-code ratio (`[8,10]`, `[128,130]`, or `[1,1]`) |
| `GBps`, `Gbps` | Derived: `bitsPerSecond × num ÷ (den × 8×10⁹)`; `Gbps = GBps × 8` |
| `width` | `{count, label}`: lanes, bus bits, channels |
| `perLane` | Per-pin/per-lane rate where meaningful |
| `formula`, `encoding`, `notes` | Shown verbatim under each value |
| `status` | `standard` · `vendor-bin` · `vendor-claim` · `historical` · `illustrative` · `developing` · `connector` · `user-supplied` |
| `verification` | `sourced` (matches a linked source) or `unverified` (user-supplied seed) |
| `sources` | Keys into `SOURCES` (title, publisher, url, kind: primary/secondary/user) |
| `asymmetric` | `{forwardMbps, reverseMbps}` for USB4 v2 120/40 and TB5 Bandwidth Boost |
| `connectorOf` | For U.2/U.3/M.2/SD Express rows: the id of the underlying link |
| `channels`, `channelBits` | DDR–DDR5 rows only: channel count N (1, 2, 4, 8, 12, 16) and payload bits per channel (64) |

Integers in, one division out: every GB/s value is the correctly rounded result of a single integer division. Tests can therefore assert exact equality, e.g. `HBM3 === 819.2` and `SAS-4 === 2.8125`.

## Calculations

| Family | Formula | Basis |
|---|---|---|
| HBM, GDDR | Gb/s per pin × width ÷ 8 (HBM per stack 1024-bit, HBM4 2048-bit; GDDR x32 device, GDDR6W x64) | memory-theoretical |
| DDR–DDR5 | MT/s × 64 × N channels ÷ 8000 | memory-theoretical |
| DDR5 MRDIMM | MT/s × 64 ÷ 8000 (one host channel) | memory-theoretical |
| LPDDR1–5X | MT/s × 64 ÷ 8000 (normalized 64-bit) | memory-theoretical |
| LPDDR6 | 14400 × 24 ÷ 8000 = 43.2 | memory-theoretical |
| PCIe 1–2 | GT/s × lanes × 8/10 ÷ 8 | encoding-adjusted |
| PCIe 3–5 | GT/s × lanes × 128/130 ÷ 8 | encoding-adjusted |
| PCIe 6–7 | GT/s × lanes ÷ 8 (FLIT/FEC overhead **not** subtracted) | raw-signaling |
| SAS | line rate ÷ 8 (SAS-4 "24G" = 22.5 Gbaud) | raw-signaling |
| SATA | line rate × 8/10 ÷ 8 | encoding-adjusted |
| USB, Thunderbolt, Ethernet | advertised rate ÷ 8 | advertised-link |
| SD UHS-I | 104 MB/s bus | advertised-link |
| SD UHS-II/III | lane rate × 8/10 ÷ 8 (FD156/HD312/FD312/FD624) | encoding-adjusted |
| SD Express, U.2, U.3, M.2 NVMe | identical to the underlying PCIe link | encoding-adjusted |
| M.2 SATA | identical to SATA III | encoding-adjusted |
| DisplayPort, HDMI FRL | lane rate × lanes ÷ 8 | raw-signaling |

Rules the UI enforces:

- **One direction, never summed.** PCIe 7.0 x16 shows 256 GB/s; PCI-SIG's "512 GB/s" is the bidirectional sum. USB4 v2 shows 80, not 160.
- **Asymmetric modes** (USB4 v2 120/40, TB5 Boost) show the faster direction and print the reverse rate.
- **Ratio** is larger ÷ smaller on GB/s, so it doesn't change with the unit.
- **Bars** are exact linear percentages with no minimum width. Below 1 px nothing is drawn, and the UI says so with the exact percentage.
- A **mixed-basis warning** appears whenever the two sides have different `basis` values.
- The **Gb/s** view is the post-encoding bit rate for encoding-adjusted rows in Encoding-adjusted mode (the default). SATA III therefore shows 4.8 Gb/s, while the formula line keeps the 6 Gb/s line rate visible.
- **Decimal units throughout.** 1 GB/s = 10⁹ B/s.

## User-supplied vs sourced data

The seed list was supplied by the site owner. I checked figures against primary or secondary sources where I could reach them:

- **USB-IF:** USB4 page fetched directly.
- **Samsung HBM4:** 11.7 / 13 Gb/s and 3.3 TB/s, via TrendForce's report of the Feb 2026 press release.
- **Samsung GDDR7:** 40 Gb/s, Samsung Newsroom, Oct 2024.
- **Intel Thunderbolt 5 brief:** 80 Gb/s, and 120/40 with Bandwidth Boost.
- **PCI-SIG PCIe 7.0:** 128 GT/s, Business Wire, Jun 2025.
- **SD 8.0:** SD Express over PCIe 4.0 x2, about 3.94 GB/s.
- **SNIA:** U.3 as SFF-TA-1001.
- **IEEE:** 802.3df (800G) approved; P802.3dj (1.6T) not yet ratified (still "Active PAR" on 2026-10-16).

The 2026-10-16 audit added 16 rows: JEDEC HBM4 baseline, Samsung HBM4E, JEDEC/Micron GDDR7, LPDDR5X-8533, PCIe 8.0 roadmap targets, DisplayPort HBR/HBR2, and HDMI 1.3/1.4, 2.0 and 2.2. [docs/catalog-audit.md](docs/catalog-audit.md) lists the dated sources, evidence quotes, deliberate exclusions and blocked sources. That audit is a dated snapshot: its 162 → 178 count predates the DDR channel configurations, which later brought the catalog to 348; the six OSFP MSA rows (2026-10-18, [docs/transceiver-form-factors-audit.md](docs/transceiver-form-factors-audit.md)) brought it to 354; the 18 user-supplied, unverified transceiver rows bring it to 372.

Several primary sites (pcisig.com, jedec.org, sdcard.org, intel.com) returned HTTP 403 to automated fetches. Their links point to the canonical pages, but those pages weren't machine-verified for this build.

These entries are marked **`unverified`** (badge "User-supplied, unverified"; sources include `user-seed`):

- HBM2E vendor-tested 4.2 Gb/s
- GDDR1/GDDR2 illustrative and GDDR3/GDDR4 historical per-pin rates
- DDR2-1066 (labeled vendor/extended bin)
- DDR5-9200 (sampled)
- DDR5 MRDIMM 8000 / 10400 / 12800. Only 8800 is cited to JEDEC; 12800 is labeled in development.
- LPDDR6-14400 top bin
- Ethernet 1.6 Tb/s (labeled in development, not ratified)
- The 18 SFP, SFP-DD, QSFP and QSFP-DD form-factor rates from the site owner's transceiver guide (status *User-supplied*; SFP224 labeled in development)

Other notes:

- No PCIe "6.5" or "7.1" revisions are presented. A unit test asserts this.
- Status labels separate vendor claims (HBM3E 9.2, HBM4 Samsung, HBM4E Samsung, GDDR6X, GDDR6W, GDDR7 Micron 32 / Samsung 40 Gb/s, LPDDR5X 10.7) from JEDEC base grades.
- PCIe 8.0 rows are PCI-SIG roadmap targets (draft 0.5; release planned by 2028), labeled "Not ratified".
- `sourced` means the number matches a linked source. It does not mean the site independently measured anything.

## Caveats

- All figures are ceilings. Protocol, packet, refresh and controller overhead are not modeled.
- USB/Thunderbolt/Ethernet "advertised" rates include line-code overhead that differs by generation.
- LPDDR rows (except LPDDR6) are normalized to 64 bits for comparison. Real devices use 16/32-bit channels in various counts.
- HDMI/DisplayPort are included only where the raw rate is unambiguous. HDMI 1.3/1.4, 2.0 and 2.2 rows show the official link total without a per-lane split, because the cited sources don't state one.
