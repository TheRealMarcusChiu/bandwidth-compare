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
npm test             # node --test: data validity, arithmetic, ratio/URL/search logic (no deps)
npm i                # installs @playwright/test (dev only)
npx playwright install chromium
npm run test:e2e     # Playwright, desktop 1440×1000 + Pixel 7 mobile
```

The E2E suite starts its own server on port 4179 and stops it afterwards. It covers:

- keyboard and mouse filtering on both comboboxes
- arrows, Enter, Escape and outside-click dismissal
- the empty state
- swap, the unit toggle and URL state round-trips
- copy link
- invalid URL IDs
- identical selections
- the extreme ratio with a sub-pixel bar
- mixed-basis and unverified notices
- catalog filtering
- source links
- horizontal overflow and touch-target size
- zero console errors and zero remote requests

It also writes `/tmp/bandwidth-desktop.png` and `/tmp/bandwidth-mobile.png`.

## Files

| Path | Purpose |
|---|---|
| `index.html` | Markup, CSP, ARIA combobox shells |
| `styles.css` | Dark theme, responsive layout |
| `js/data.js` | Catalog, sources, basis/status/verification enums. All values computed here |
| `js/compare.js` | Pure logic: formatting, ratio, bar widths, URL state, search (shared with tests) |
| `js/combobox.js` | Accessible type-to-filter combobox |
| `js/app.js` | Rendering and events |
| `scripts/serve.mjs` | Zero-dependency static server (serves only site files) |
| `tests/unit/*.test.mjs` | `node --test` suites |
| `tests/e2e/app.spec.mjs` | Playwright suite |

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
| `status` | `standard` · `vendor-bin` · `vendor-claim` · `historical` · `illustrative` · `developing` · `connector` |
| `verification` | `sourced` (matches a linked source) or `unverified` (user-supplied seed) |
| `sources` | Keys into `SOURCES` (title, publisher, url, kind: primary/secondary/user) |
| `asymmetric` | `{forwardMbps, reverseMbps}` for USB4 v2 120/40 and TB5 Bandwidth Boost |
| `connectorOf` | For U.2/U.3/M.2/SD Express rows: the id of the underlying link |

Integers in, one division out: every GB/s value is the correctly rounded result of a single integer division. Tests can therefore assert exact equality, e.g. `HBM3 === 819.2` and `SAS-4 === 2.8125`.

## Calculations

| Family | Formula | Basis |
|---|---|---|
| HBM, GDDR | Gb/s per pin × width ÷ 8 (HBM per stack 1024-bit, HBM4 2048-bit; GDDR x32 device, GDDR6W x64) | memory-theoretical |
| DDR–DDR5, MRDIMM | MT/s × 64 ÷ 8000 | memory-theoretical |
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
- The **Gb/s** view is the post-encoding bit rate for encoding-adjusted rows. SATA III therefore shows 4.8 Gb/s, while the formula line keeps the 6 Gb/s line rate visible.
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
- **IEEE:** 802.3df (800G) approved; P802.3dj (1.6T) not yet ratified.

Several primary sites (pcisig.com, jedec.org, sdcard.org, intel.com) returned HTTP 403 to automated fetches. Their links point to the canonical pages, but those pages weren't machine-verified for this build.

These entries are marked **`unverified`** (badge "User-supplied, unverified"; sources include `user-seed`):

- HBM2E vendor-tested 4.2 Gb/s
- GDDR1/GDDR2 illustrative and GDDR3/GDDR4 historical per-pin rates
- DDR2-1066 (labeled vendor/extended bin)
- DDR5-9200 (sampled)
- DDR5 MRDIMM 8000 / 10400 / 12800. Only 8800 is cited to JEDEC; 12800 is labeled in development.
- LPDDR6-14400 top bin
- Ethernet 1.6 Tb/s (labeled in development, not ratified)

Other notes:

- No PCIe "6.5" or "7.1" revisions are presented. A unit test asserts this.
- Status labels separate vendor claims (HBM3E 9.2, HBM4 Samsung, GDDR6X, GDDR6W, GDDR7 40 Gb/s, LPDDR5X 10.7) from JEDEC base grades.
- `sourced` means the number matches a linked source. It does not mean the site independently measured anything.

## Caveats

- All figures are ceilings. Protocol, packet, refresh and controller overhead are not modeled.
- USB/Thunderbolt/Ethernet "advertised" rates include line-code overhead that differs by generation.
- LPDDR rows (except LPDDR6) are normalized to 64 bits for comparison. Real devices use 16/32-bit channels in various counts.
- HDMI/DisplayPort are included only where the lane count and raw rate are unambiguous.
