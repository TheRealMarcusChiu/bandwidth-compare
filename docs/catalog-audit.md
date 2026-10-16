# Catalog audit: 2026-10-16

Scope: add HBM4E and fill in the meaningful generations or modes missing from existing families. The catalog went from 162 to 178 entries (16 added). No existing id, name or figure changed. The only edits to existing rows are revision aliases, sources and notes on four DisplayPort rows. Values were checked by script against `HEAD`.

Method: every figure comes from a source fetched on 2026-10-16. Quotes below were read from the page itself. When the official page was blocked, the doc says so and names the mirror that was used. All arithmetic is `js/data.js` integer math, checked in `tests/unit/additions.test.mjs`. Each figure is **one direction** and never a bidirectional sum. Memory figures are per stack or per device as labelled.

Rules applied:

- A vendor claim is not a standard. The HBM4E rows carry vendor figures, not JEDEC standard rates, so they are `vendor-claim`. No JEDEC HBM4E standard was verified by this audit (see Status review); that is not a proof that none exists.
- A roadmap is not a release. PCIe 8.0 rows are `developing` (badge "Not ratified").
- A bandwidth is never invented. If a source gives only a link total (HDMI 2.2), no per-lane rate is shown.
- A spec revision that keeps the same link rate becomes an **alias** of the existing row, never a new row. Examples: DP 1.3 → HBR3, DP 2.0 → UHBR, HDMI 1.4 → the 10.2 Gb/s TMDS row.

## Additions

| id | Figure | Calculation | Status | Source (date) and evidence |
|---|---|---|---|---|
| `hbm4-jedec` | 2,048 GB/s per stack | 8 Gb/s × 2048 bits ÷ 8 | standard | JEDEC JESD270-4 press release (Apr 16, 2025), JEDEC text reproduced at https://us.design-reuse.com/news/57708/jedec-hbm4.html: "With transfer speeds up to 8 Gb/s across a 2048-bit interface, HBM4 boosts total bandwidth up to 2 TB/s." |
| `hbm4e-samsung-sample` | 3,584 GB/s per stack | 14 Gb/s × 2048 ÷ 8 | vendor-claim | Samsung HBM product page (undated, accessed 2026-10-16, HTTP 200), https://semiconductor.samsung.com/dram/hbm/, HBM4E section: "Organization" "2048" (width). Samsung Newsroom (May 29, 2026), https://semiconductor.samsung.com/news-events/news/samsung-electronics-begins-shipment-of-industry-first-hbm4e-samples/: "a stable pin speed of 14 gigabits-per-second (Gbps)", "performance scalable up to 16Gbps", "up to 3.6 terabytes-per-second (TB/s) per stack". The announcement described sample shipments and planned mass production "aligned with customer schedules" (no date); later production availability is not established by this audit. No mention of JEDEC. |
| `hbm4e-samsung-max` | 4,096 GB/s per stack | 16 Gb/s × 2048 ÷ 8 | vendor-claim | Samsung HBM product page (undated, accessed 2026-10-16, HTTP 200), https://semiconductor.samsung.com/dram/hbm/, HBM4E section: "Speed" "Up to 16.0 Gbps", "Organization" "2048", "4 TB/s of bandwidth in a single 16-high stack". Samsung Newsroom (Mar 16, 2026, GTC), https://semiconductor.samsung.com/news-events/news/samsung-unveils-hbm4e-showcasing-comprehensive-ai-solutions-nvidia-partnership-and-vision-at-nvidia-gtc-2026/: "HBM4E, delivering 16Gbps per pin and 4.0-terabytes-per-second (TB/s) bandwidth". Also cites the May 29, 2026 release above ("scalable up to 16Gbps"). |
| `gddr7-jedec` | 192 GB/s per x32 device | 192 GB/s × 8 ÷ 32 = 48 Gb/s per pin (derived) | standard | JEDEC JESD239 press release (Mar 5, 2024), JEDEC text reproduced at https://us.design-reuse.com/news/55819/jedec-gddr7-graphics-memory-standard.html: "JESD239 GDDR7 offers double the bandwidth over GDDR6, reaching up to 192 GB/s per device". This is a ceiling the standard allows. It is not a shipping bin. |
| `gddr7-micron-32` | 128 GB/s per x32 device | 32 Gb/s × 32 ÷ 8 | vendor-claim | Micron GDDR7 product page (undated, accessed 2026-10-16), https://www.micron.com/products/memory/graphics-memory/gddr7: "GDDR7 achieves speeds up to 32 Gb/s". |
| `lpddr5x-8533` | 68.264 GB/s (64-bit normalized) | 8533 MT/s × 64 ÷ 8000 (MT/s × bits ÷ 8 = MB/s; ÷ 1000 = GB/s) | standard | JEDEC JESD209-5B press release (Jul 28, 2021), reproduced at https://jpralves.net/post/2021/08/12/jedec-publishes-new-and-updated-standards-for-low-power-memory-devices-used-in-5g-and-ai-applications.html: "Speed extension up to 8533 Mbps (versus up to 6400 Mbps in the previous revision)". |
| `pcie8-x1`, `pcie8-x2`, `pcie8-x4`, `pcie8-x8`, `pcie8-x16` | 32 / 64 / 128 / 256 / 512 GB/s | 256 GT/s × lanes ÷ 8 (raw, FLIT/FEC not subtracted) | developing (roadmap target) | PCI-SIG press release (Aug 5, 2025), reproduced at https://www.design-reuse.com/news/202529150-pci-sig-reg-announces-pci-express-reg-8-0-specification-to-reach-256-0-gt-s/: "Delivering 256.0 GT/s raw bit rate and up to 1 TB/s bi-directionally via x16 configuration", "planned for release to members by 2028". Draft 0.5 (May 6, 2026), https://www.signalintegrityjournal.com/articles/4313-pcie-80-specification-draft-05-now-available-on-track-for-2560-gt-s-transfer-speeds-by-2028: "draft 0.5 is now available for member review", "remains on track for full release by 2028". 1 TB/s bidirectional = 512 GB/s each way, which matches x16. |
| `dp11-hbr` | 10.8 Gb/s (1.35 GB/s) | 2.7 Gb/s × 4 lanes ÷ 8 (raw) | standard | VESA DisplayPort 1.2 release (Jan 7, 2010), https://www.displayport.org/pr/vesa-introduces-displayport-v1-2-the-most-comprehensive-and-innovative-display-interface-available/: "doubling the maximum data transfer rate from 10.8 Gbps … to 21.6 Gbps", which places 10.8 Gbps at v1.1a. Also: "the per-lane data rate is doubled from 2.7 Gbps to 5.4 Gbps … over the four lanes". |
| `dp12-hbr2` | 21.6 Gb/s (2.7 GB/s) | 5.4 Gb/s × 4 lanes ÷ 8 (raw) | standard | Same VESA release as above. |
| `hdmi13-tmds` | 10.2 Gb/s (1.275 GB/s) | 10.2 Gb/s link total ÷ 8 (raw) | standard | HDMI Licensing (Jun 22, 2006), https://www.hdmi.org/press/bodydetails/68: "HDMI 1.3 increases its single-link bandwidth from 165MHz (4.95 gigabits per second) to 340 MHz (10.2 Gbps)". For HDMI 1.4/1.4b, https://www.hdmi.org/spec/hdmi1_4b says "All resolutions and refresh rates can be support with the High Speed HDMI Cable", and https://www.hdmi.org/resource/cables says High Speed is "with support up to 10.2Gbps bandwidth". |
| `hdmi20-tmds` | 18 Gb/s (2.25 GB/s) | 18 Gb/s link total ÷ 8 (raw) | standard | HDMI Forum (Sep 4, 2013), https://www.hdmi.org/press/bodydetails/24: "offers a significant increase in bandwidth (up to 18Gbps)". |
| `hdmi22-frl` | 96 Gb/s (12 GB/s) | 96 Gb/s link total ÷ 8 (raw) | standard | HDMI Forum (Jun 25, 2025), https://hdmiforum.org/hdmi-forum-releases-version-2-2-of-the-hdmi-specification: "Higher 96Gbps bandwidth and next-gen HDMI Fixed Rate Link technology". Ultra96 covers "a maximum of 64Gbps, 80Gbps or 96Gbps". No lane count or per-lane rate is published, so `perLane` is `null`. |

Existing rows that gained only revision aliases and supporting sources, with no figure changed:

- `dp14-hbr3`: + `DP 1.3`. Source: https://www.displayport.org/pr/vesa-rolls-early-certification-program-video-source-display-products-using-hbr3-high-bandwidth-link-rate/ (Jan 4, 2017): "VESA made HBR3 available to developers with the release of DisplayPort version 1.3 in September 2014"; "8.1 Gbps per lane", "32.4 Gbps".
- `dp21-uhbr10`, `dp21-uhbr13-5`, `dp21-uhbr20`: + `DP 2.0` (and `DP40`/`DP80` on the rows that cable class is rated for). Source: https://www.displayport.org/pr/vesa-readies-displayport-uhbr-ultra-high-bit-rate-device-certification-and-begins-certification-of-uhbr-cables/ (Feb 28, 2022): "UHBR10 link rate (10 Gigabits per second or Gbps) defined by DisplayPort 2.0" and "UHBR20 link rate (20 Gbps) defined by DisplayPort 2.0".

Width note for HBM4E: the width is documented, not assumed. Samsung's HBM4E product page (https://semiconductor.samsung.com/dram/hbm/, undated, accessed 2026-10-16) lists "Organization" "2048" and "Speed" "Up to 16.0 Gbps". The newsroom releases give pin speed and TB/s but not bus width. The documented 2048-bit organization agrees with both Samsung totals: 16 × 2048 ÷ 8 = 4,096 GB/s ≈ "4.0 TB/s", and 14 × 2048 ÷ 8 = 3,584 GB/s ≈ "3.6 TB/s". A test asserts this agreement.

## Status review

- **HBM4E.** No JEDEC HBM4E standard was verified by this audit: none verified, which is not a proof that none exists (jedec.org returned 403). JEDEC's newest published HBM document seen in search results is JESD270-4A (HBM4, Dec 2025). Trade press (TrendForce, Apr 2026) said HBM4E height rules were still under discussion. The HBM4E figures are vendor figures, not JEDEC standard rates. Samsung's May 29, 2026 announcement described sample shipments and planned mass production; SK hynix (Jun 18, 2026, via syndicated copies) announced sample shipments. Later production availability is not established by this audit.
- **PCIe 7.0.** Released Jun 11, 2025 (existing `pcisig-7` source). It stays `standard`. Its x16 figure is 256 GB/s per direction, since PCI-SIG's 512 GB/s is the bidirectional sum.
- **PCIe 8.0.** Roadmap target only (draft 0.5, May 2026, release by 2028). Added as `developing`.
- **Ethernet 1.6 Tb/s (IEEE P802.3dj).** Still in development. IEEE SA (https://standards.ieee.org/ieee/802.3dj/11115/) shows "Active PAR". The 802.3 WG page (https://www.ieee802.org/3/, last update 15 October 2026) still lists "IEEE P802.3dj" as a Task Force. `eth-1600g` stays `developing` / `unverified`.
- **HDMI 2.2.** Published by the HDMI Forum on Jun 25, 2025, so it is `standard`. hdmi.org calls it "the most recent update of the HDMI specification". Shipping products are a separate matter and are not claimed.

## Exclusions

These items were checked and deliberately not added:

- **SAS-5 / "48G SAS".** No current STA source found. A 2024-era report (iThome) says STA dropped 48G in favour of 24G+, which is already `sas4-1`. With no rate to cite, nothing was added.
- **DisplayPort RBR (1.62 Gb/s/lane).** No VESA page reached states it. The only sources were Intel FPGA docs (the URL now redirects to a 404) and secondary explainers. It is also a lower optional rate of existing generations, not a new generation.
- **DisplayPort 1.0 as a named row.** VESA's v1.2 release names only v1.1a for 10.8 Gbps, so `dp11-hbr` carries `DP 1.1a` only.
- **HDMI 1.4a, HDMI 2.0a/2.0b, HDMI 2.1a/2.1b, DP 1.2a, DP 2.1a/2.1b.** These revisions have the same link rate as an existing row. They are not separate bandwidth modes, and no source was fetched that ties each one to its rate, so no alias was added either.
- **HDMI 2.2 Ultra96 64/80 Gb/s tiers.** These are optional product tiers within HDMI 2.2. They are mentioned in the `hdmi22-frl` notes but not added as rows.
- **SK hynix HBM4E 16 Gb/s.** Same per-pin rate as `hbm4e-samsung-max`, so a row would duplicate that figure. SK hynix also gave no TB/s figure, and its own newsroom did not appear in search, only syndicated copies (e.g. https://www.storagereview.com/news/sk-hynix-ships-12-high-hbm4e-samples-16gbps-per-pin-and-48gb-stacks).
- **Micron GDDR7 36 Gb/s, Micron 28 Gb/s.** These are known only from trade press (TrendForce, Apr 2026), and Micron's own page states only "up to 32 Gb/s".
- **LPDDR5X 9600 / 10667 as JEDEC grades.** No JEDEC release found standardizing them. `lpddr5x-10700` stays a Samsung vendor claim.
- **LPDDR6 JEDEC rate.** The JEDEC JESD209-6 release (Jul 9, 2025, via https://www.eejournal.com/industry_news/jedec-releases-new-lpddr6-standard-to-enhance-mobile-and-ai-memory-performance) gives the "2 sub-channels per die, 12 data signal lines (DQs) per sub-channel" layout but **no data rate**. The 10,667–14,400 MT/s range appears only in secondary coverage. `lpddr6-14400` was left as is (user seed, unverified).
- **DDR5-9200 as a JEDEC grade.** Search snippets tie 9200 to JESD400-5D, the **SPD** standard, not JESD79-5 core timings. JESD79-5D (Nov 2025) was seen only as a JEDEC listing snippet, and jedec.org returned 403. `ddr5-9200` stays unverified. JESD79-5C (8800) is already covered.
- **SD Express 9.x.** The SD Association bus-speed page lists no SD Express rate beyond 8.00 (PCIe 4.0 x2, 3940 MB/s), which `sd-express-pcie4-x2` already covers. No 9.x rows were added.
- **New connector rows (M.2/U.2 on PCIe 6.0, EDSFF).** No connector-specification source was fetched that ties these form factors to a PCIe 6.0 link. Connector rows mirror their underlying link, so any PCIe 6.0 figure is already available on `pcie6-x4`.

## Blocked or uncertain sources

| Wanted | Result | What was used instead |
|---|---|---|
| jedec.org press releases (HBM4, GDDR7, LPDDR5X, JESD79-5D listing) | HTTP 403 | Verbatim JEDEC press-release reprints (Design & Reuse, jpralves.net), marked `secondary` |
| businesswire.com (JEDEC HBM4, PCI-SIG 8.0) | HTTP 403 | Design & Reuse reprint of the same release, marked `secondary` |
| pcisig.com (newsroom) | Fetch tool refused the domain | Design & Reuse reprint (Aug 2025), Signal Integrity Journal (May 2026), both `secondary` |
| news.samsung.com HBM4E releases | Timed out | Same releases on semiconductor.samsung.com (Samsung's own site), `primary` |
| ieee802.org/3/dj/ | Reachable but last updated 24 July 2025 | IEEE SA project page ("Active PAR") and 802.3 WG page (updated 15 Oct 2026) |
| intel.com DisplayPort FPGA glossary (RBR/HBR rates) | Redirects to a 404 | None; RBR excluded |
| Samsung HBM product page https://semiconductor.samsung.com/dram/hbm/ | HTTP 200 on 2026-10-16; undated | Cited as `primary` on both HBM4E rows with its access date: "Up to 16.0 Gbps", "Organization" "2048", "4 TB/s … 16-high stack" |
