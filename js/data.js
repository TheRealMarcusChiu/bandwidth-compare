// BANDWIDTH / compare: interface catalog.
//
// Every figure is computed from integers so the arithmetic is exact and testable:
//   GB/s = bitsPerSecond × effNum ÷ (effDen × 8 × 10^9)
// bitsPerSecond is the aggregate signaling rate across the stated width, in ONE
// direction. Duplex directions are never summed.

/** How a number should be read. */
export const BASES = {
  'raw-signaling': {
    label: 'Raw signaling',
    short: 'RAW',
    description:
      'Line rate before encoding, framing, FLIT or FEC overhead. Usable throughput is lower.',
  },
  'encoding-adjusted': {
    label: 'Encoding-adjusted',
    short: 'ENC',
    description:
      'Line rate after line-code overhead (8b/10b or 128b/130b). Still ignores packet/protocol overhead.',
  },
  'memory-theoretical': {
    label: 'Theoretical memory peak',
    short: 'MEM',
    description:
      'Data rate per pin × bus width ÷ 8. A peak; refresh, bank conflicts and command overhead reduce it.',
  },
  'advertised-link': {
    label: 'Advertised link rate',
    short: 'ADV',
    description:
      'The headline rate named by the standard or vendor. Not payload throughput.',
  },
};

/** Product/standard status. */
export const STATUSES = {
  standard: 'Published standard',
  'vendor-bin': 'Vendor / extended bin (not a base JEDEC grade)',
  'vendor-claim': 'Vendor capability claim',
  historical: 'Historical example',
  illustrative: 'Illustrative example',
  developing: 'In development, not ratified',
  connector: 'Connector / form factor',
  'user-supplied': 'User-supplied form-factor rate (not independently verified)',
};

/** Compact status flag shown next to the value; the full label lives in Comparison details. */
export const STATUS_SHORT = {
  standard: null,
  'vendor-bin': 'Vendor bin',
  'vendor-claim': 'Vendor claim',
  historical: 'Historical',
  illustrative: 'Illustrative',
  developing: 'Not ratified',
  connector: 'Connector',
  'user-supplied': 'User-supplied',
};

/** Whether we checked the figure against a cited source. */
export const VERIFICATION = {
  sourced: 'Cited source',
  unverified: 'User-supplied, unverified',
};

export const CATEGORIES = {
  memory: 'Memory',
  expansion: 'Expansion bus',
  storage: 'Storage',
  peripheral: 'Peripheral',
  display: 'Display',
  network: 'Network',
  card: 'Memory card',
};

export const SOURCES = {
  'jedec-hbm': {
    title: 'JEDEC HBM / HBM2 / HBM3 standards (JESD235, JESD238)',
    publisher: 'JEDEC',
    url: 'https://www.jedec.org/standards-documents/docs/jesd235a',
    kind: 'primary',
  },
  'samsung-hbm2e': {
    title: 'Samsung Flashbolt HBM2E announcement',
    publisher: 'Samsung Newsroom',
    url: 'https://news.samsung.com/global/samsung-electronics-to-launch-industrys-first-16gb-hbm2e-flashbolt',
    kind: 'primary',
  },
  'micron-hbm3e': {
    title: 'Micron HBM3E (9.2 Gb/s per pin, >1.2 TB/s)',
    publisher: 'Micron',
    url: 'https://www.micron.com/products/memory/hbm/hbm3e',
    kind: 'primary',
  },
  'samsung-hbm4': {
    title: 'Samsung ships first commercial HBM4 (11.7 Gb/s, up to 13 Gb/s, 3.3 TB/s)',
    publisher: 'TrendForce, reporting Samsung press release (Feb 2026)',
    url: 'https://www.trendforce.com/news/2026/02/12/news-samsung-delivers-first-ever-commercial-hbm4-boosting-speeds-from-11-7%E2%80%AFgbps-to-13%E2%80%AFgbps/',
    kind: 'secondary',
  },
  'jedec-hbm4': {
    title: 'JEDEC releases JESD270-4 HBM4 (up to 8 Gb/s, 2048-bit, 2 TB/s)',
    publisher: 'JEDEC press release via Design & Reuse (Apr 16, 2025)',
    url: 'https://us.design-reuse.com/news/57708/jedec-hbm4.html',
    kind: 'secondary',
  },
  'samsung-hbm4e-samples': {
    title: 'Samsung begins shipment of industry-first HBM4E samples (14 Gb/s, up to 16 Gb/s, 3.6 TB/s)',
    publisher: 'Samsung Semiconductor Newsroom (May 29, 2026)',
    url: 'https://semiconductor.samsung.com/news-events/news/samsung-electronics-begins-shipment-of-industry-first-hbm4e-samples/',
    kind: 'primary',
  },
  'samsung-hbm-product': {
    title: 'Samsung HBM product page, HBM4E specs (Speed up to 16.0 Gbps, Organization 2048)',
    publisher: 'Samsung Semiconductor product page (undated; accessed Oct 16, 2026)',
    url: 'https://semiconductor.samsung.com/dram/hbm/',
    kind: 'primary',
  },
  'samsung-hbm4e-gtc': {
    title: 'Samsung unveils HBM4E at NVIDIA GTC 2026 (16 Gb/s per pin, 4.0 TB/s)',
    publisher: 'Samsung Semiconductor Newsroom (Mar 16, 2026)',
    url: 'https://semiconductor.samsung.com/news-events/news/samsung-unveils-hbm4e-showcasing-comprehensive-ai-solutions-nvidia-partnership-and-vision-at-nvidia-gtc-2026/',
    kind: 'primary',
  },
  'jedec-gddr': {
    title: 'JEDEC GDDR5 / GDDR6 / GDDR7 standards (JESD212, JESD250, JESD239)',
    publisher: 'JEDEC',
    url: 'https://www.jedec.org/category/technology-focus-area/graphics-memory-gddr',
    kind: 'primary',
  },
  'micron-gddr6x': {
    title: 'Micron GDDR6X',
    publisher: 'Micron',
    url: 'https://www.micron.com/products/memory/graphics-memory/gddr6x',
    kind: 'primary',
  },
  'samsung-gddr6w': {
    title: 'Samsung GDDR6W (x64, 22 Gb/s per pin)',
    publisher: 'Samsung Newsroom',
    url: 'https://news.samsung.com/global/samsung-develops-industry-first-gddr6w-dram-to-take-graphics-performance-to-the-next-level',
    kind: 'primary',
  },
  'samsung-gddr7': {
    title: 'Samsung 24Gb GDDR7 (40 Gb/s per pin)',
    publisher: 'Samsung Newsroom (Oct 2024)',
    url: 'https://news.samsung.com/global/samsung-develops-industrys-first-24gb-gddr7-dram-for-next-generation-ai-computing',
    kind: 'primary',
  },
  'jedec-gddr7': {
    title: 'JEDEC publishes JESD239 GDDR7 (up to 192 GB/s per device, PAM3)',
    publisher: 'JEDEC press release via Design & Reuse (Mar 5, 2024)',
    url: 'https://us.design-reuse.com/news/55819/jedec-gddr7-graphics-memory-standard.html',
    kind: 'secondary',
  },
  'micron-gddr7': {
    title: 'Micron GDDR7 ("speeds up to 32 Gb/s")',
    publisher: 'Micron product page (undated; accessed Oct 16, 2026)',
    url: 'https://www.micron.com/products/memory/graphics-memory/gddr7',
    kind: 'primary',
  },
  'jedec-ddr': {
    title: 'JEDEC DDR SDRAM standards (JESD79, -2, -3, -4, -5)',
    publisher: 'JEDEC',
    url: 'https://www.jedec.org/category/technology-focus-area/main-memory-ddr3-ddr4-sdram',
    kind: 'primary',
  },
  'jedec-mrdimm': {
    title: 'JEDEC DDR5 MRDIMM announcement',
    publisher: 'JEDEC',
    url: 'https://www.jedec.org/news/pressreleases/jedec-unveils-plans-ddr5-mrdimm-and-lpddr6-camm-standards-propel-high-performance',
    kind: 'primary',
  },
  'jedec-lpddr': {
    title: 'JEDEC LPDDR standards (JESD209 family)',
    publisher: 'JEDEC',
    url: 'https://www.jedec.org/category/technology-focus-area/mobile-memory-lpddr-wide-io-memory-mcp',
    kind: 'primary',
  },
  'samsung-lpddr5x': {
    title: 'Samsung LPDDR5X 10.7 Gb/s',
    publisher: 'Samsung Newsroom',
    url: 'https://news.samsung.com/global/samsung-develops-industrys-fastest-10-7gbps-lpddr5x-dram-optimized-for-ai-applications',
    kind: 'primary',
  },
  'jedec-lpddr5x': {
    title: 'JEDEC JESD209-5B: LPDDR5X speed extension up to 8533 Mbps',
    publisher: 'JEDEC press release, reproduced by jpralves.net (Jul 28, 2021; repost Aug 12, 2021)',
    url: 'https://jpralves.net/post/2021/08/12/jedec-publishes-new-and-updated-standards-for-low-power-memory-devices-used-in-5g-and-ai-applications.html',
    kind: 'secondary',
  },
  'pcisig-faq': {
    title: 'PCI Express specifications and FAQ (per-lane rates, encoding)',
    publisher: 'PCI-SIG',
    url: 'https://pcisig.com/faq',
    kind: 'primary',
  },
  'pcisig-7': {
    title: 'PCI-SIG releases PCIe 7.0 (128 GT/s, PAM4, FLIT)',
    publisher: 'PCI-SIG via Business Wire (Jun 2025)',
    url: 'https://www.businesswire.com/news/home/20250611299049/en',
    kind: 'primary',
  },
  'pcisig-8': {
    title: 'PCI-SIG announces PCIe 8.0 specification to reach 256.0 GT/s (release to members planned by 2028)',
    publisher: 'PCI-SIG press release via Design & Reuse (Aug 5, 2025)',
    url: 'https://www.design-reuse.com/news/202529150-pci-sig-reg-announces-pci-express-reg-8-0-specification-to-reach-256-0-gt-s/',
    kind: 'secondary',
  },
  'pcisig-8-draft05': {
    title: 'PCIe 8.0 specification draft 0.5 available to members; on track for 2028',
    publisher: 'Signal Integrity Journal, reporting PCI-SIG (May 6, 2026)',
    url: 'https://www.signalintegrityjournal.com/articles/4313-pcie-80-specification-draft-05-now-available-on-track-for-2560-gt-s-transfer-speeds-by-2028',
    kind: 'secondary',
  },
  'sta-sas': {
    title: 'SAS roadmap and 24G SAS (22.5 Gbaud)',
    publisher: 'SCSI Trade Association / SNIA',
    url: 'https://www.snia.org/forums/scsi-trade-association',
    kind: 'primary',
  },
  'sata-io': {
    title: 'SATA-IO specifications',
    publisher: 'SATA-IO',
    url: 'https://sata-io.org/developers/purchase-specification',
    kind: 'primary',
  },
  'usbif-docs': {
    title: 'USB specifications and USB4',
    publisher: 'USB-IF',
    url: 'https://www.usb.org/usb4',
    kind: 'primary',
  },
  'usbif-v2': {
    title: 'USB4 Version 2.0 (80 Gbps, 120/40 asymmetric)',
    publisher: 'USB-IF',
    url: 'https://www.usb.org/sites/default/files/2022-09/USB%20PG%20USB4%20Version%202.0%20Announcement_FINAL.pdf',
    kind: 'primary',
  },
  'intel-tb5': {
    title: 'Thunderbolt 5 technology brief',
    publisher: 'Intel',
    url: 'https://intel.com/content/dam/www/central-libraries/us/en/documents/2023-09/thunderbolt-5-technology-brief.pdf',
    kind: 'primary',
  },
  'intel-tb': {
    title: 'Thunderbolt technology overview (generations 1–4)',
    publisher: 'Intel',
    url: 'https://www.intel.com/content/www/us/en/architecture-and-technology/thunderbolt/overview.html',
    kind: 'primary',
  },
  'ieee-8023': {
    title: 'IEEE 802.3 Ethernet Working Group',
    publisher: 'IEEE',
    url: 'https://www.ieee802.org/3/',
    kind: 'primary',
  },
  'ieee-8023dj': {
    title: 'IEEE P802.3dj (200G/lane, 1.6 Tb/s) task force',
    publisher: 'IEEE',
    url: 'https://www.ieee802.org/3/dj/',
    kind: 'primary',
  },
  'osfp-msa': {
    title: 'OSFP MSA, official site and FAQ (OSFP and OSFP-XD rate and electrical-lane mappings)',
    publisher: 'OSFP MSA (accessed Oct 18, 2026)',
    url: 'https://www.osfpmsa.org/',
    kind: 'primary',
  },
  'snia-sff8639': {
    title: 'SFF-8639 multifunction 6X unshielded connector (U.2)',
    publisher: 'SNIA SFF TA TWG',
    url: 'https://www.snia.org/technology-communities/sff/specifications',
    kind: 'primary',
  },
  'snia-u3': {
    title: 'SFF-TA-1001 Universal x4 Link Definition for SFF-8639 (U.3)',
    publisher: 'SNIA SFF TA TWG',
    url: 'https://www.snia.org/technology-communities/sff/specifications',
    kind: 'primary',
  },
  'pcisig-m2': {
    title: 'PCI Express M.2 Specification',
    publisher: 'PCI-SIG',
    url: 'https://pcisig.com/specifications',
    kind: 'primary',
  },
  'nvme-specs': {
    title: 'NVM Express specifications (protocol, not a link rate)',
    publisher: 'NVM Express',
    url: 'https://nvmexpress.org/specifications/',
    kind: 'primary',
  },
  'sda-bus': {
    title: 'SD bus speeds: UHS-I, UHS-II, UHS-III, SD Express',
    publisher: 'SD Association',
    url: 'https://www.sdcard.org/developers/sd-standard-overview/bus-speed-default-speed-high-speed-uhs-sd-express/',
    kind: 'primary',
  },
  'sda-express': {
    title: 'SD 8.0: SD Express over PCIe 3.0/4.0 x1/x2',
    publisher: 'SD Association via Business Wire (May 2020)',
    url: 'https://www.businesswirechina.com/en/news/43505.html',
    kind: 'secondary',
  },
  'vesa-dp': {
    title: 'DisplayPort 2.1 (UHBR10/13.5/20, four lanes)',
    publisher: 'VESA',
    url: 'https://www.displayport.org/',
    kind: 'primary',
  },
  'hdmi-21': {
    title: 'HDMI 2.1 specification overview (48 Gbps FRL)',
    publisher: 'HDMI Licensing Administrator',
    url: 'https://www.hdmi.org/spec/hdmi2_1',
    kind: 'primary',
  },
  'vesa-dp12': {
    title: 'VESA introduces DisplayPort v1.2 (10.8 → 21.6 Gbps; 2.7 → 5.4 Gbps per lane, four lanes)',
    publisher: 'VESA / displayport.org press release (Jan 7, 2010)',
    url: 'https://www.displayport.org/pr/vesa-introduces-displayport-v1-2-the-most-comprehensive-and-innovative-display-interface-available/',
    kind: 'primary',
  },
  'vesa-hbr3': {
    title: 'VESA HBR3 certification: 8.1 Gbps per lane, 32.4 Gbps; HBR3 released with DisplayPort 1.3 (Sept 2014)',
    publisher: 'VESA / displayport.org press release (Jan 4, 2017)',
    url: 'https://www.displayport.org/pr/vesa-rolls-early-certification-program-video-source-display-products-using-hbr3-high-bandwidth-link-rate/',
    kind: 'primary',
  },
  'vesa-uhbr': {
    title: 'VESA UHBR certification: UHBR10/13.5/20 link rates "defined by DisplayPort 2.0"',
    publisher: 'VESA / displayport.org press release (Feb 28, 2022)',
    url: 'https://www.displayport.org/pr/vesa-readies-displayport-uhbr-ultra-high-bit-rate-device-certification-and-begins-certification-of-uhbr-cables/',
    kind: 'primary',
  },
  'hdmi-13': {
    title: 'HDMI 1.3 doubles bandwidth: single link 165 MHz (4.95 Gbps) → 340 MHz (10.2 Gbps)',
    publisher: 'HDMI Licensing press release (Jun 22, 2006)',
    url: 'https://www.hdmi.org/press/bodydetails/68',
    kind: 'primary',
  },
  'hdmi-14b': {
    title: 'HDMI Specification 1.4b ("All resolutions and refresh rates can be support with the High Speed HDMI Cable")',
    publisher: 'HDMI Licensing Administrator (undated page; accessed Oct 16, 2026)',
    url: 'https://www.hdmi.org/spec/hdmi1_4b',
    kind: 'primary',
  },
  'hdmi-20': {
    title: 'HDMI Forum releases version 2.0 of the HDMI specification (up to 18Gbps)',
    publisher: 'HDMI Forum press release (Sep 4, 2013)',
    url: 'https://www.hdmi.org/press/bodydetails/24',
    kind: 'primary',
  },
  'hdmi-22': {
    title: 'HDMI Forum releases version 2.2 of the HDMI specification (96Gbps, next-gen FRL, Ultra96)',
    publisher: 'HDMI Forum press release (Jun 25, 2025)',
    url: 'https://hdmiforum.org/hdmi-forum-releases-version-2-2-of-the-hdmi-specification',
    kind: 'primary',
  },
  'hdmi-cables': {
    title: 'HDMI cable types: High Speed 10.2Gbps, Premium High Speed 18Gbps, Ultra High Speed 48Gbps, Ultra96 96Gbps',
    publisher: 'HDMI Licensing Administrator (undated page; accessed Oct 16, 2026)',
    url: 'https://www.hdmi.org/resource/cables',
    kind: 'primary',
  },
  'user-seed': {
    title: 'Seed data supplied by the site owner (not independently checked)',
    publisher: 'User supplied',
    url: '',
    kind: 'user',
  },
};

// ---------------------------------------------------------------- helpers

const G = 1_000_000_000;
const M = 1_000_000;

/** Exact GB/s from integer inputs. */
export function computeGBps(bitsPerSecond, effNum = 1, effDen = 1) {
  return (bitsPerSecond * effNum) / (effDen * 8 * G);
}

const ENC_8B10B = [8, 10];
const ENC_128B130B = [128, 130];
const NONE = [1, 1];

function make(fields) {
  const [effNum, effDen] = fields.efficiency ?? NONE;
  const bitsPerSecond = fields.bitsPerSecond;
  const entry = {
    aliases: [],
    notes: '',
    asymmetric: null,
    ...fields,
    efficiency: [effNum, effDen],
    GBps: computeGBps(bitsPerSecond, effNum, effDen),
    Gbps: (bitsPerSecond * effNum) / (effDen * G),
  };
  return Object.freeze(entry);
}

/** Memory: per-pin rate (Mb/s, integer) × width bits. */
function memory({ perPinMbps, widthBits, ...rest }) {
  return make({
    category: 'memory',
    basis: 'memory-theoretical',
    bitsPerSecond: perPinMbps * widthBits * M,
    perLane: { value: perPinMbps / 1000, unit: 'Gb/s per pin' },
    width: { count: widthBits, label: `${widthBits}-bit` },
    formula: `${fmtNum(perPinMbps / 1000)} Gb/s/pin × ${widthBits} bits ÷ 8`,
    ...rest,
  });
}

function fmtNum(n) {
  return String(Number(n.toPrecision(12)));
}

// ---------------------------------------------------------------- memory

const hbm = [
  ['hbm1', 'HBM1', 1000, 1024, 'standard', 'sourced', ['jedec-hbm'], ['HBM']],
  ['hbm2', 'HBM2', 2400, 1024, 'standard', 'sourced', ['jedec-hbm'], []],
  ['hbm2e', 'HBM2E', 3200, 1024, 'standard', 'sourced', ['jedec-hbm', 'samsung-hbm2e'], []],
  ['hbm2e-vendor-4-2', 'HBM2E (vendor-tested 4.2 Gb/s)', 4200, 1024, 'vendor-claim', 'unverified', ['user-seed', 'samsung-hbm2e'], ['Flashbolt']],
  ['hbm3', 'HBM3', 6400, 1024, 'standard', 'sourced', ['jedec-hbm'], []],
  ['hbm3e', 'HBM3E', 9200, 1024, 'vendor-claim', 'sourced', ['micron-hbm3e'], []],
  ['hbm4-jedec', 'HBM4 (JEDEC JESD270-4)', 8000, 2048, 'standard', 'sourced', ['jedec-hbm4'], ['HBM4', 'JESD270-4', 'JESD270'],
    'Per stack. JEDEC JESD270-4 (Apr 2025): "transfer speeds up to 8 Gb/s across a 2048-bit interface", up to 2 TB/s.'],
  ['hbm4-samsung-production', 'HBM4 (Samsung production claim)', 11700, 2048, 'vendor-claim', 'sourced', ['samsung-hbm4'], ['HBM4']],
  ['hbm4-samsung-max', 'HBM4 (Samsung maximum)', 13000, 2048, 'vendor-claim', 'sourced', ['samsung-hbm4'], []],
  ['hbm4e-samsung-sample', 'HBM4E (Samsung sample, 14 Gb/s)', 14000, 2048, 'vendor-claim', 'sourced', ['samsung-hbm4e-samples', 'samsung-hbm-product'], ['HBM4E', 'HBM 4E'],
    'Per stack. Vendor figures, not JEDEC standard rates. Samsung\'s May 29, 2026 announcement described sample shipments of 12-high HBM4E at a "stable pin speed of 14 Gbps", up to 3.6 TB/s per stack, and planned mass production "aligned with customer schedules"; later production availability is not established here. Width per Samsung\'s HBM4E product page: Organization 2048 (14 × 2048 ÷ 8 = 3,584 GB/s, matching 3.6 TB/s).'],
  ['hbm4e-samsung-max', 'HBM4E (Samsung maximum, 16 Gb/s)', 16000, 2048, 'vendor-claim', 'sourced', ['samsung-hbm-product', 'samsung-hbm4e-gtc', 'samsung-hbm4e-samples'], ['HBM4E', 'HBM 4E'],
    'Per stack. Vendor figures, not JEDEC standard rates. Samsung\'s HBM4E product page: Speed "Up to 16.0 Gbps", Organization 2048; GTC (Mar 2026): "16Gbps per pin and 4.0 TB/s". Samsung\'s May 29, 2026 announcement described sample shipments "scalable up to 16Gbps" and planned mass production; later production availability is not established here. 16 × 2048 ÷ 8 = 4,096 GB/s, matching 4.0 TB/s.'],
].map(([id, name, perPinMbps, widthBits, status, verification, sources, aliases, notes = 'Per stack.']) =>
  memory({
    id, name, family: 'HBM', perPinMbps, widthBits, status, verification, sources,
    aliases: [...aliases, 'high bandwidth memory', 'stack'],
    notes,
  }),
);

const gddr = [
  ['gddr1', 'GDDR1 (graphics DDR, illustrative)', 400, 32, 'illustrative', 'unverified', ['user-seed'], ['GDDR']],
  ['gddr2', 'GDDR2 (illustrative)', 1000, 32, 'illustrative', 'unverified', ['user-seed'], []],
  ['gddr3', 'GDDR3 (historical)', 2000, 32, 'historical', 'unverified', ['user-seed'], []],
  ['gddr4', 'GDDR4 (historical)', 3200, 32, 'historical', 'unverified', ['user-seed'], []],
  ['gddr5', 'GDDR5', 8000, 32, 'standard', 'sourced', ['jedec-gddr'], []],
  ['gddr5x', 'GDDR5X', 12000, 32, 'standard', 'sourced', ['jedec-gddr'], []],
  ['gddr6', 'GDDR6', 24000, 32, 'standard', 'sourced', ['jedec-gddr'], []],
  ['gddr6x', 'GDDR6X', 24000, 32, 'vendor-claim', 'sourced', ['micron-gddr6x'], ['Micron PAM4']],
  ['gddr6w', 'GDDR6W (x64 package)', 22000, 64, 'vendor-claim', 'sourced', ['samsung-gddr6w'], ['Samsung']],
  ['gddr7-jedec', 'GDDR7 (JEDEC JESD239 headline)', 48000, 32, 'standard', 'sourced', ['jedec-gddr7'], ['GDDR7', 'JESD239', 'PAM3'],
    'Per x32 device. JEDEC JESD239 (Mar 2024): "up to 192 GB/s per device". Per-pin rate derived: 192 GB/s × 8 ÷ 32 bits = 48 Gb/s. A ceiling the standard allows, not a shipping speed.'],
  ['gddr7-micron-32', 'GDDR7 (Micron 32 Gb/s)', 32000, 32, 'vendor-claim', 'sourced', ['micron-gddr7'], ['GDDR7', 'Micron'],
    'Per x32 device. Micron product page: "GDDR7 achieves speeds up to 32 Gb/s". Vendor figure; shipping cards often use lower bins.'],
  ['gddr7-samsung-max', 'GDDR7 (Samsung maximum)', 40000, 32, 'vendor-claim', 'sourced', ['samsung-gddr7', 'jedec-gddr'], ['GDDR7']],
].map(([id, name, perPinMbps, widthBits, status, verification, sources, aliases, notes]) =>
  memory({
    id, name, family: 'GDDR', perPinMbps, widthBits, status, verification, sources,
    aliases: [...aliases, 'graphics memory', 'vram'],
    notes: notes ?? (widthBits === 64 ? 'Per x64 package (two dies).' : 'Per x32 device.'),
  }),
);

/** DDR channel configurations: N × 64-bit channels. */
export const DDR_CHANNELS = [1, 2, 4, 8, 12, 16];
const CHANNEL_BITS = 64;

const channelLabel = (n) => `${n} channel${n === 1 ? '' : 's'}`;
const CHANNEL_WORDS = { 1: ['single channel'], 2: ['dual channel'], 4: ['quad channel'], 8: ['octa channel', 'eight channel'], 12: ['twelve channel'], 16: ['sixteen channel'] };

/**
 * DDR–DDR5: MT/s × 64 bits × N channels ÷ 8, one row per channel count.
 * The 1-channel row keeps the original id (`ddr5-6400`) so old share links work;
 * the others get a stable suffix (`ddr5-6400-8ch`). Every configuration inherits
 * the rate's status, verification and sources: it is arithmetic, not a platform claim.
 */
function ddrEntries(family, idPrefix, rates, { status = () => 'standard', verification = () => 'sourced', sources = () => ['jedec-ddr'], notes = 'One 64-bit channel (DIMM, no ECC).', aliases = [], label = (r) => `${family}-${r}` } = {}) {
  return rates.flatMap((rate) =>
    DDR_CHANNELS.map((n) => {
      const bits = CHANNEL_BITS * n;
      return memory({
        id: n === 1 ? `${idPrefix}-${rate}` : `${idPrefix}-${rate}-${n}ch`,
        name: `${label(rate)} · ${channelLabel(n)}`,
        family,
        perPinMbps: rate,
        widthBits: bits,
        width: { count: bits, label: n === 1 ? `${bits}-bit` : `${bits}-bit (${n} × ${CHANNEL_BITS})` },
        channels: n,
        channelBits: CHANNEL_BITS,
        status: status(rate),
        verification: verification(rate),
        sources: sources(rate),
        aliases: [`${family} ${rate}`, `${family}${rate}`, `PC ${rate}`, ...aliases, ...CHANNEL_WORDS[n]],
        notes: n === 1
          ? notes
          : `${notes} Theoretical ${n}-channel configuration: ${n} × ${CHANNEL_BITS}-bit channels = ${bits}-bit aggregate. ` +
            `Not a claim that any processor supports ${channelLabel(n)} of ${family}; inherits the ${family}-${rate} rate's status and source.`,
        formula: `${rate} MT/s × ${CHANNEL_BITS} bits × ${channelLabel(n)} ÷ 8`,
      });
    }),
  );
}

const ddr = [
  ...ddrEntries('DDR', 'ddr', [200, 266, 333, 400], { aliases: ['DDR1', 'SDRAM'] }),
  ...ddrEntries('DDR2', 'ddr2', [400, 533, 667, 800, 1066], {
    status: (r) => (r === 1066 ? 'vendor-bin' : 'standard'),
    verification: (r) => (r === 1066 ? 'unverified' : 'sourced'),
    sources: (r) => (r === 1066 ? ['user-seed'] : ['jedec-ddr']),
  }),
  ...ddrEntries('DDR3', 'ddr3', [800, 1066, 1333, 1600, 1866, 2133], {
    aliases: ['DDR3L'],
    label: (r) => `DDR3/DDR3L-${r}`,
    notes: 'One 64-bit channel. DDR3L is the 1.35 V variant at the same data rates.',
  }),
  ...ddrEntries('DDR4', 'ddr4', [1600, 1866, 2133, 2400, 2666, 2933, 3200]),
  ...ddrEntries('DDR5', 'ddr5', [4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000, 8400, 8800, 9200], {
    status: (r) => (r === 9200 ? 'vendor-claim' : 'standard'),
    verification: (r) => (r === 9200 ? 'unverified' : 'sourced'),
    sources: (r) => (r === 9200 ? ['user-seed'] : ['jedec-ddr']),
    label: (r) => (r === 9200 ? 'DDR5-9200 (sampled)' : `DDR5-${r}`),
    notes: 'Each 64-bit channel here is one DDR5 DIMM\'s two 32-bit subchannels, counted once (2 × 32 = 64 bits, not doubled). JEDEC grades through 8800 per JESD79-5C.',
  }),
  // MRDIMM keeps its single host-channel rows (no channel variants).
  ...[8000, 8800, 10400, 12800].map((rate) =>
    memory({
      id: `ddr5-mrdimm-${rate}`,
      name: `DDR5 MRDIMM-${rate} (host channel)`,
      family: 'DDR5 MRDIMM',
      perPinMbps: rate,
      widthBits: 64,
      status: rate === 8800 ? 'standard' : rate === 12800 ? 'developing' : 'vendor-claim',
      verification: rate === 8800 ? 'sourced' : 'unverified',
      sources: rate === 8800 ? ['jedec-mrdimm'] : ['user-seed'],
      aliases: [`DDR5 MRDIMM ${rate}`, `DDR5 MRDIMM${rate}`, `PC ${rate}`, 'MCR DIMM', 'multiplexed rank'],
      notes: 'Host-side 64-bit channel rate; the DRAM ranks run at half the rate.',
      formula: `${rate} MT/s × 64 bits ÷ 8`,
    }),
  ),
];

const lp = [
  ['lpddr1', 'LPDDR1', 400, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr2', 'LPDDR2', 1066, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr3', 'LPDDR3', 2133, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr4', 'LPDDR4', 4266, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr4x', 'LPDDR4X', 4266, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr5', 'LPDDR5', 6400, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr5x', 'LPDDR5X', 8533, 'standard', 'sourced', ['jedec-lpddr5x']],
  ['lpddr5x', 'LPDDR5X (10.7 Gb/s)', 10700, 'vendor-claim', 'sourced', ['samsung-lpddr5x']],
];
const lpddr = [
  ...lp.map(([id, name, rate, status, verification, sources]) =>
    memory({
      id: `${id}-${rate}`,
      name: `${name}-${rate} (64-bit normalized)`,
      family: 'LPDDR',
      perPinMbps: rate,
      widthBits: 64,
      status, verification, sources,
      aliases: [name, 'mobile', 'low power'],
      notes: 'Normalized to a 64-bit bus for comparison; real devices use 16/32-bit channels in various counts.',
      formula: `${rate} MT/s × 64 bits ÷ 8`,
    }),
  ),
  memory({
    id: 'lpddr6-14400',
    name: 'LPDDR6-14400 (24-bit channel)',
    family: 'LPDDR',
    perPinMbps: 14400,
    widthBits: 24,
    status: 'vendor-claim',
    verification: 'unverified',
    sources: ['user-seed', 'jedec-lpddr'],
    aliases: ['LPDDR6', 'mobile', 'low power'],
    notes: 'One 24-bit LPDDR6 channel (2 × 12-bit subchannels), not normalized to 64 bits.',
    formula: '14400 MT/s × 24 bits ÷ 8',
  }),
];

// ---------------------------------------------------------------- PCIe

const PCIE_GENS = [
  { gen: 1, label: '1.0', revs: ['1.0', '1.0a', '1.1'], gtMbps: 2500, enc: ENC_8B10B, encLabel: '8b/10b' },
  { gen: 2, label: '2.0', revs: ['2.0', '2.1'], gtMbps: 5000, enc: ENC_8B10B, encLabel: '8b/10b' },
  { gen: 3, label: '3.0', revs: ['3.0', '3.1'], gtMbps: 8000, enc: ENC_128B130B, encLabel: '128b/130b' },
  { gen: 4, label: '4.0', revs: ['4.0'], gtMbps: 16000, enc: ENC_128B130B, encLabel: '128b/130b' },
  { gen: 5, label: '5.0', revs: ['5.0'], gtMbps: 32000, enc: ENC_128B130B, encLabel: '128b/130b' },
  { gen: 6, label: '6.0', revs: ['6.0'], gtMbps: 64000, enc: NONE, encLabel: 'PAM4 FLIT (raw, FLIT/FEC overhead excluded)' },
  { gen: 7, label: '7.0', revs: ['7.0'], gtMbps: 128000, enc: NONE, encLabel: 'PAM4 FLIT (raw, FLIT/FEC overhead excluded)' },
  // Roadmap only: PCI-SIG announced the 256 GT/s target (Aug 2025) and draft 0.5 (May 2026); release planned by 2028.
  { gen: 8, label: '8.0', revs: ['8.0'], gtMbps: 256000, enc: NONE, encLabel: 'PAM4 FLIT (raw, FLIT/FEC overhead excluded)', target: true },
];
const LANES = [1, 2, 4, 8, 16];

export function pcieGen(gen) {
  return PCIE_GENS.find((g) => g.gen === gen);
}

function pcieFormula(g, lanes) {
  const gt = fmtNum(g.gtMbps / 1000);
  return g.enc === NONE
    ? `${gt} GT/s × ${lanes} lane${lanes > 1 ? 's' : ''} ÷ 8 (raw)`
    : `${gt} GT/s × ${lanes} lane${lanes > 1 ? 's' : ''} × ${g.enc[0]}/${g.enc[1]} ÷ 8`;
}

function pcieLink(g, lanes, extra = {}) {
  return make({
    category: 'expansion',
    family: 'PCIe',
    basis: g.enc === NONE ? 'raw-signaling' : 'encoding-adjusted',
    bitsPerSecond: g.gtMbps * lanes * M,
    efficiency: g.enc,
    encoding: g.encLabel,
    perLane: { value: g.gtMbps / 1000, unit: 'GT/s per lane' },
    width: { count: lanes, label: `x${lanes}` },
    formula: pcieFormula(g, lanes),
    status: g.target ? 'developing' : 'standard',
    verification: 'sourced',
    sources: g.gen === 8 ? ['pcisig-8', 'pcisig-8-draft05'] : g.gen === 7 ? ['pcisig-7', 'pcisig-faq'] : ['pcisig-faq'],
    ...extra,
  });
}

const pcie = PCIE_GENS.flatMap((g) =>
  LANES.map((lanes) =>
    pcieLink(g, lanes, {
      id: `pcie${g.gen}-x${lanes}`,
      name: `PCIe ${g.label} x${lanes}${g.target ? ' (target)' : ''}`,
      aliases: [
        `PCIe ${g.gen} x${lanes}`, `PCIe${g.gen}x${lanes}`, `Gen${g.gen} x${lanes}`, `Gen ${g.gen}`,
        ...g.revs.map((r) => `PCIe ${r}`), 'PCI Express',
      ],
      notes: g.target
        ? 'Per direction. PCI-SIG roadmap target, not a released specification: 256.0 GT/s raw, "up to 1 TB/s bi-directionally via x16" (512 GB/s each way), release to members planned by 2028; draft 0.5 only (May 2026). FLIT/FEC overhead not subtracted.'
        : `Per direction. Covers revisions ${g.revs.join(', ')}.` +
          (g.gen >= 6 ? ' FLIT mode adds framing/FEC overhead not subtracted here.' : ''),
    }),
  ),
);

// ---------------------------------------------------------------- storage

function linkEntry({ gbpsMbps, ...rest }) {
  return make({ bitsPerSecond: gbpsMbps * M, ...rest });
}

const sas = [
  ['sas1', 'SAS-1 / 1.1 (3 Gb/s)', 3000, ['SAS 3G', 'SAS1.1']],
  ['sas2', 'SAS-2 / 2.1 (6 Gb/s)', 6000, ['SAS 6G', 'SAS2.1']],
  ['sas3', 'SAS-3 (12 Gb/s)', 12000, ['SAS 12G']],
  ['sas4', 'SAS-4 "24G" (22.5 Gbaud)', 22500, ['SAS 24G', '24G SAS']],
  ['sas4-1', 'SAS-4.1 "24G+" (22.5 Gbaud)', 22500, ['SAS 24G+', '24G+ SAS']],
].map(([id, name, mbps, aliases]) =>
  linkEntry({
    id, name, family: 'SAS', category: 'storage', basis: 'raw-signaling', gbpsMbps: mbps,
    perLane: { value: mbps / 1000, unit: 'Gb/s per lane' },
    width: { count: 1, label: '1 lane' },
    formula: `${fmtNum(mbps / 1000)} Gb/s × 1 lane ÷ 8 (raw)`,
    encoding: mbps >= 22500 ? '128b/150b (not subtracted)' : '8b/10b (not subtracted)',
    status: 'standard', verification: 'sourced', sources: ['sta-sas'],
    aliases: [...aliases, 'Serial Attached SCSI'],
    notes: 'Per lane, per direction. Raw line rate; "24G" is a marketing name for 22.5 Gbaud.',
  }),
);

const sata = [
  ['sata1', 'SATA I (1.5 Gb/s)', 1500, ['SATA 1.0', 'SATA 150']],
  ['sata2', 'SATA II (3 Gb/s)', 3000, ['SATA 2.0', 'SATA 300']],
  ['sata3', 'SATA III (6 Gb/s)', 6000, ['SATA 3.0', 'SATA 3.1', 'SATA 3.2', 'SATA 3.3', 'SATA 3.4', 'SATA 3.5', 'SATA 600']],
].map(([id, name, mbps, aliases]) =>
  linkEntry({
    id, name, family: 'SATA', category: 'storage', basis: 'encoding-adjusted', gbpsMbps: mbps,
    efficiency: ENC_8B10B, encoding: '8b/10b',
    perLane: { value: mbps / 1000, unit: 'Gb/s line rate' },
    width: { count: 1, label: '1 lane' },
    formula: `${fmtNum(mbps / 1000)} Gb/s × 8/10 ÷ 8`,
    status: 'standard', verification: 'sourced', sources: ['sata-io'],
    aliases: [...aliases, 'Serial ATA'],
    notes: id === 'sata3' ? 'Revisions 3.0–3.5 share the 6 Gb/s line rate.' : 'Half duplex.',
  }),
);

/** Connector / form-factor rows that inherit an underlying link. */
function viaConnector(base, { id, name, family, sources, aliases, notes }) {
  return make({
    ...base,
    id, name, family,
    category: 'storage',
    status: 'connector',
    connectorOf: base.id,
    sources: [...sources, ...base.sources],
    aliases: [...aliases],
    notes,
  });
}

const pcieById = Object.fromEntries(pcie.map((p) => [p.id, p]));
const connectors = [];
for (const gen of [3, 4, 5]) {
  const base = pcieById[`pcie${gen}-x4`];
  connectors.push(
    viaConnector(base, {
      id: `u2-nvme-pcie${gen}-x4`,
      name: `U.2 NVMe · PCIe ${gen}.0 x4`,
      family: 'U.2',
      sources: ['snia-sff8639', 'nvme-specs'],
      aliases: ['U.2', 'SFF-8639', `U2 gen${gen}`, 'NVMe', '2.5 inch'],
      notes: 'U.2 (SFF-8639) is a connector; this is the PCIe x4 link it carries. NVMe is the protocol and has no fixed bandwidth.',
    }),
    viaConnector(base, {
      id: `u3-nvme-pcie${gen}-x4`,
      name: `U.3 NVMe · PCIe ${gen}.0 x4`,
      family: 'U.3',
      sources: ['snia-u3', 'nvme-specs'],
      aliases: ['U.3', 'SFF-TA-1001', 'tri-mode', `U3 gen${gen}`, 'NVMe'],
      notes: 'U.3 (SFF-TA-1001) is a connector pinout for tri-mode SAS/SATA/NVMe bays on SFF-8639. Bandwidth is the PCIe x4 link; NVMe is the protocol.',
    }),
    viaConnector(base, {
      id: `m2-nvme-pcie${gen}-x4`,
      name: `M.2 NVMe · PCIe ${gen}.0 x4`,
      family: 'M.2',
      sources: ['pcisig-m2', 'nvme-specs'],
      aliases: ['M.2', 'M2', 'M key', `M.2 gen${gen}`, 'NVMe', '2280'],
      notes: 'M.2 is a form factor; this is the PCIe x4 link on an M-key slot. NVMe is the protocol.',
    }),
  );
}
connectors.push(
  viaConnector(
    sata.find((s) => s.id === 'sata3'),
    {
      id: 'm2-sata',
      name: 'M.2 SATA (SATA III)',
      family: 'M.2',
      sources: ['pcisig-m2'],
      aliases: ['M.2 SATA', 'B key', 'B+M key', 'M2 SATA'],
      notes: 'M.2 form factor carrying a SATA III link. Same ceiling as any SATA III port.',
    },
  ),
);
// Keep each connector family contiguous (stable sort).
const CONNECTOR_ORDER = ['U.2', 'U.3', 'M.2'];
connectors.sort((x, y) => CONNECTOR_ORDER.indexOf(x.family) - CONNECTOR_ORDER.indexOf(y.family));

// ---------------------------------------------------------------- SD cards

const sdBus = [
  ['sd-uhs1', 'SD UHS-I (SDR104)', 832, [1, 1], 'advertised-link', '104 MB/s bus', ['UHS-I', 'UHS1', 'SDR104']],
  ['sd-uhs2-fd156', 'SD UHS-II FD156', 1560, ENC_8B10B, 'encoding-adjusted', 'one 1.56 Gb/s lane, 8b/10b', ['UHS-II', 'UHS2']],
  ['sd-uhs2-hd312', 'SD UHS-II HD312', 3120, ENC_8B10B, 'encoding-adjusted', 'two 1.56 Gb/s lanes one direction, 8b/10b', ['UHS-II', 'UHS2']],
  ['sd-uhs3-fd312', 'SD UHS-III FD312', 3120, ENC_8B10B, 'encoding-adjusted', 'one 3.12 Gb/s lane, 8b/10b', ['UHS-III', 'UHS3']],
  ['sd-uhs3-fd624', 'SD UHS-III FD624', 6240, ENC_8B10B, 'encoding-adjusted', 'two 3.12 Gb/s lanes, 8b/10b', ['UHS-III', 'UHS3']],
].map(([id, name, mbps, enc, basis, desc, aliases]) =>
  linkEntry({
    id, name, family: 'SD', category: 'card', basis, gbpsMbps: mbps, efficiency: enc,
    encoding: enc === ENC_8B10B ? '8b/10b' : '4-bit parallel bus',
    perLane: null,
    width: { count: 1, label: id === 'sd-uhs1' ? '4-bit bus' : desc.startsWith('two') ? '2 lanes' : '1 lane' },
    formula: id === 'sd-uhs1' ? '208 MHz × 4 bits ÷ 8 = 104 MB/s' : `${fmtNum(mbps / 1000)} Gb/s × 8/10 ÷ 8`,
    status: 'standard', verification: 'sourced', sources: ['sda-bus'],
    aliases: [...aliases, 'SD card', 'memory card'],
    notes: `SD Association bus-speed class (${desc}). Card media is usually slower than the bus.`,
  }),
);

const sdExpress = [
  ['sd-express-pcie3-x1', 'SD Express · PCIe 3.0 x1 (SD 7.0)', 3, 1],
  ['sd-express-pcie3-x2', 'SD Express · PCIe 3.0 x2 (SD 8.0)', 3, 2],
  ['sd-express-pcie4-x1', 'SD Express · PCIe 4.0 x1 (SD 8.0)', 4, 1],
  ['sd-express-pcie4-x2', 'SD Express · PCIe 4.0 x2 (SD 8.0)', 4, 2],
].map(([id, name, gen, lanes]) => {
  const base = pcieLink(pcieGen(gen), lanes, { id: 'tmp', name: 'tmp' });
  return make({
    ...base,
    id, name, family: 'SD Express', category: 'card',
    connectorOf: `pcie${gen}-x${lanes}`,
    sources: ['sda-bus', 'sda-express', 'pcisig-faq'],
    aliases: ['SD Express', 'SD 7.0', 'SD 8.0', 'microSD Express', 'NVMe', 'SD card'],
    notes: 'SD card carrying a PCIe link with NVMe. Figure is the PCIe link, per direction.',
  });
});

// ---------------------------------------------------------------- peripheral

function adv({ id, name, family, mbps, width, sources, aliases = [], notes = '', status = 'standard', verification = 'sourced', asymmetric = null, category = 'peripheral', formula }) {
  return linkEntry({
    id, name, family, category, basis: 'advertised-link', gbpsMbps: mbps,
    perLane: null,
    width: { count: width.count ?? 1, label: width.label ?? width },
    formula: formula ?? (mbps < 1000 ? `${fmtNum(mbps)} Mb/s advertised ÷ 8` : `${fmtNum(mbps / 1000)} Gb/s advertised ÷ 8`),
    status, verification, sources, aliases, notes, asymmetric,
  });
}

const usb = [
  adv({ id: 'usb1-low', name: 'USB Low Speed (1.5 Mb/s)', family: 'USB', mbps: 1.5, width: { label: '1 pair' }, sources: ['usbif-docs'], aliases: ['USB 1.0', 'USB 1.1', 'low speed'], notes: 'Half duplex.' }),
  adv({ id: 'usb1-full', name: 'USB Full Speed (12 Mb/s)', family: 'USB', mbps: 12, width: { label: '1 pair' }, sources: ['usbif-docs'], aliases: ['USB 1.1', 'full speed'], notes: 'Half duplex.' }),
  adv({ id: 'usb2', name: 'USB 2.0 Hi-Speed (480 Mb/s)', family: 'USB', mbps: 480, width: { label: '1 pair' }, sources: ['usbif-docs'], aliases: ['USB2', 'Hi-Speed', 'high speed'], notes: 'Half duplex.' }),
  adv({ id: 'usb-5g', name: 'USB 5Gbps (3.0 / 3.1 Gen 1 / 3.2 Gen 1x1)', family: 'USB', mbps: 5000, width: { label: '1 lane' }, sources: ['usbif-docs'], aliases: ['USB 3.0', 'USB 3.1 Gen 1', 'USB 3.2 Gen 1x1', 'SuperSpeed', 'USB3'], notes: 'Per direction. 8b/10b encoding not subtracted.' }),
  adv({ id: 'usb-10g', name: 'USB 10Gbps (3.1 Gen 2 / 3.2 Gen 2x1)', family: 'USB', mbps: 10000, width: { label: '1 lane' }, sources: ['usbif-docs'], aliases: ['USB 3.1 Gen 2', 'USB 3.2 Gen 2x1', 'SuperSpeed+'], notes: 'Per direction. 128b/132b encoding not subtracted.' }),
  adv({ id: 'usb32-gen1x2', name: 'USB 3.2 Gen 1x2 (10 Gb/s)', family: 'USB', mbps: 10000, width: { count: 2, label: '2 lanes' }, sources: ['usbif-docs'], aliases: ['USB 3.2 Gen 1x2'], notes: 'Two 5 Gb/s lanes over USB-C. Per direction.' }),
  adv({ id: 'usb32-gen2x2', name: 'USB 20Gbps (3.2 Gen 2x2)', family: 'USB', mbps: 20000, width: { count: 2, label: '2 lanes' }, sources: ['usbif-docs'], aliases: ['USB 3.2 Gen 2x2', 'USB 20Gbps'], notes: 'Two 10 Gb/s lanes over USB-C. Per direction.' }),
  adv({ id: 'usb4-20', name: 'USB4 20Gbps (v1.0)', family: 'USB', mbps: 20000, width: { count: 2, label: '2 lanes' }, sources: ['usbif-docs'], aliases: ['USB4', 'USB 4 Gen 2x2'], notes: 'Per direction.' }),
  adv({ id: 'usb4-40', name: 'USB4 40Gbps (v1.0)', family: 'USB', mbps: 40000, width: { count: 2, label: '2 lanes' }, sources: ['usbif-docs'], aliases: ['USB4', 'USB 4 Gen 3x2'], notes: 'Per direction.' }),
  adv({ id: 'usb4v2-80', name: 'USB4 80Gbps (v2.0, symmetric)', family: 'USB', mbps: 80000, width: { count: 2, label: '2 lanes' }, sources: ['usbif-v2', 'usbif-docs'], aliases: ['USB4 v2', 'USB4 Version 2.0', 'USB 80Gbps'], notes: '80 Gb/s each direction. Not summed.' }),
  adv({ id: 'usb4v2-120', name: 'USB4 120Gbps (v2.0, asymmetric)', family: 'USB', mbps: 120000, width: { count: 3, label: '3 lanes TX' }, sources: ['usbif-v2'], aliases: ['USB4 v2', 'asymmetric', 'USB 120Gbps'], notes: '120 Gb/s in one direction with 40 Gb/s in the other. Shown: the faster direction only.', asymmetric: { forwardMbps: 120000, reverseMbps: 40000 } }),
];

const tb = [
  adv({ id: 'tb1', name: 'Thunderbolt 1 (10 Gb/s per channel)', family: 'Thunderbolt', mbps: 10000, width: { label: '1 channel' }, sources: ['intel-tb'], aliases: ['Thunderbolt', 'TB1'], notes: 'Two independent 10 Gb/s channels; shown per channel, per direction.' }),
  adv({ id: 'tb2', name: 'Thunderbolt 2 (20 Gb/s)', family: 'Thunderbolt', mbps: 20000, width: { label: '2 channels bonded' }, sources: ['intel-tb'], aliases: ['TB2'], notes: 'Channels aggregated. Per direction.' }),
  adv({ id: 'tb3', name: 'Thunderbolt 3 (40 Gb/s)', family: 'Thunderbolt', mbps: 40000, width: { label: '2 lanes' }, sources: ['intel-tb'], aliases: ['TB3'], notes: 'Per direction.' }),
  adv({ id: 'tb4', name: 'Thunderbolt 4 (40 Gb/s)', family: 'Thunderbolt', mbps: 40000, width: { label: '2 lanes' }, sources: ['intel-tb'], aliases: ['TB4'], notes: 'Same 40 Gb/s link as TB3 with stricter minimum requirements. Per direction.' }),
  adv({ id: 'tb5', name: 'Thunderbolt 5 (80 Gb/s)', family: 'Thunderbolt', mbps: 80000, width: { label: '2 lanes' }, sources: ['intel-tb5'], aliases: ['TB5'], notes: '80 Gb/s each direction. Not summed.' }),
  adv({ id: 'tb5-boost', name: 'Thunderbolt 5 Bandwidth Boost (120 Gb/s)', family: 'Thunderbolt', mbps: 120000, width: { label: '3 lanes TX' }, sources: ['intel-tb5'], aliases: ['TB5', 'Bandwidth Boost'], notes: '120 Gb/s transmit with 40 Gb/s receive. Shown: the faster direction only.', asymmetric: { forwardMbps: 120000, reverseMbps: 40000 } }),
];

// ---------------------------------------------------------------- display

function rawLanes({ id, name, family, laneMbps, lanes, sources, aliases, notes }) {
  return linkEntry({
    id, name, family, category: 'display', basis: 'raw-signaling', gbpsMbps: laneMbps * lanes,
    perLane: { value: laneMbps / 1000, unit: 'Gb/s per lane' },
    width: { count: lanes, label: `${lanes} lanes` },
    formula: `${fmtNum(laneMbps / 1000)} Gb/s × ${lanes} lanes ÷ 8 (raw)`,
    status: 'standard', verification: 'sourced', sources, aliases, notes,
  });
}

/** HDMI generations whose official sources state only the link total, not a per-lane rate. */
function hdmiTotal({ id, name, mbps, widthLabel, sources, aliases, notes }) {
  return linkEntry({
    id, name, family: 'HDMI', category: 'display', basis: 'raw-signaling', gbpsMbps: mbps,
    perLane: null,
    width: { count: 1, label: widthLabel },
    formula: `${fmtNum(mbps / 1000)} Gb/s link total ÷ 8 (raw)`,
    status: 'standard', verification: 'sourced', sources, aliases, notes,
  });
}

const display = [
  rawLanes({ id: 'dp11-hbr', name: 'DisplayPort 1.1a HBR', family: 'DisplayPort', laneMbps: 2700, lanes: 4, sources: ['vesa-dp12'], aliases: ['DP 1.1a', 'DP1.1a', 'HBR'], notes: 'Main link, one direction. VESA: DisplayPort 1.1a maximum is 10.8 Gbps (2.7 Gbps per lane × 4). 8b/10b not subtracted.' }),
  rawLanes({ id: 'dp12-hbr2', name: 'DisplayPort 1.2 HBR2', family: 'DisplayPort', laneMbps: 5400, lanes: 4, sources: ['vesa-dp12'], aliases: ['DP 1.2', 'DP1.2', 'HBR2'], notes: 'Main link, one direction. VESA (Jan 2010): per-lane rate "doubled from 2.7 Gbps to 5.4 Gbps", 21.6 Gbps over four lanes. 8b/10b not subtracted.' }),
  rawLanes({ id: 'dp14-hbr3', name: 'DisplayPort 1.4 HBR3', family: 'DisplayPort', laneMbps: 8100, lanes: 4, sources: ['vesa-dp', 'vesa-hbr3'], aliases: ['DP 1.4', 'DP1.4', 'HBR3', 'DP 1.3', 'DP1.3'], notes: 'Main link, one direction. HBR3 was introduced in DisplayPort 1.3 (Sept 2014) and kept in 1.4. 8b/10b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr10', name: 'DisplayPort 2.1 UHBR10', family: 'DisplayPort', laneMbps: 10000, lanes: 4, sources: ['vesa-dp', 'vesa-uhbr'], aliases: ['DP 2.1', 'DP2.1', 'UHBR10', 'DP 2.0', 'DP40'], notes: 'Main link, one direction. UHBR rates were defined in DisplayPort 2.0 and kept in 2.1. 128b/132b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr13-5', name: 'DisplayPort 2.1 UHBR13.5', family: 'DisplayPort', laneMbps: 13500, lanes: 4, sources: ['vesa-dp', 'vesa-uhbr'], aliases: ['DP 2.1', 'UHBR13.5', 'DP 2.0'], notes: 'Main link, one direction. UHBR rates were defined in DisplayPort 2.0 and kept in 2.1. 128b/132b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr20', name: 'DisplayPort 2.1 UHBR20', family: 'DisplayPort', laneMbps: 20000, lanes: 4, sources: ['vesa-dp', 'vesa-uhbr'], aliases: ['DP 2.1', 'UHBR20', 'DP 2.0', 'DP80'], notes: 'Main link, one direction. UHBR rates were defined in DisplayPort 2.0 and kept in 2.1. 128b/132b not subtracted.' }),
  hdmiTotal({ id: 'hdmi13-tmds', name: 'HDMI 1.3 / 1.4 TMDS (10.2 Gb/s)', mbps: 10200, widthLabel: 'TMDS link', sources: ['hdmi-13', 'hdmi-14b', 'hdmi-cables'], aliases: ['HDMI 1.3', 'HDMI 1.4', 'HDMI 1.4b', 'HDMI1.4', 'TMDS', 'High Speed'], notes: 'TMDS link total, one direction. HDMI 1.3 (2006) raised single-link bandwidth to 340 MHz (10.2 Gbps); HDMI 1.4b formats all run on the High Speed cable, rated to 10.2 Gbps. 8b/10b not subtracted.' }),
  hdmiTotal({ id: 'hdmi20-tmds', name: 'HDMI 2.0 TMDS (18 Gb/s)', mbps: 18000, widthLabel: 'TMDS link', sources: ['hdmi-20', 'hdmi-cables'], aliases: ['HDMI 2.0', 'HDMI2.0', 'TMDS', 'Premium High Speed'], notes: 'TMDS link total, one direction. HDMI Forum (Sept 2013): "up to 18Gbps". 8b/10b not subtracted.' }),
  rawLanes({ id: 'hdmi21-frl', name: 'HDMI 2.1 FRL (48 Gb/s)', family: 'HDMI', laneMbps: 12000, lanes: 4, sources: ['hdmi-21'], aliases: ['HDMI 2.1', 'HDMI2.1', 'FRL'], notes: 'Fixed Rate Link, one direction. 16b/18b not subtracted.' }),
  hdmiTotal({ id: 'hdmi22-frl', name: 'HDMI 2.2 FRL (96 Gb/s)', mbps: 96000, widthLabel: 'FRL link', sources: ['hdmi-22', 'hdmi-cables'], aliases: ['HDMI 2.2', 'HDMI2.2', 'Ultra96', 'FRL'], notes: 'Fixed Rate Link total, one direction. HDMI Forum (Jun 2025): "96Gbps bandwidth and next-gen HDMI Fixed Rate Link". The public material gives no per-lane rate or lane count, so none is shown. Ultra96 products may support 64, 80 or 96 Gbps; requires the Ultra96 cable.' }),
];

// ---------------------------------------------------------------- network

const eth = [
  [10, 'Mb', '10BASE-T', 'standard'],
  [100, 'Mb', 'Fast Ethernet', 'standard'],
  [1000, 'Gb', 'Gigabit', 'standard'],
  [2500, 'Gb', '2.5GBASE-T', 'standard'],
  [5000, 'Gb', '5GBASE-T', 'standard'],
  [10000, 'Gb', '10GbE', 'standard'],
  [25000, 'Gb', '25GbE', 'standard'],
  [40000, 'Gb', '40GbE', 'standard'],
  [50000, 'Gb', '50GbE', 'standard'],
  [100000, 'Gb', '100GbE', 'standard'],
  [200000, 'Gb', '200GbE', 'standard'],
  [400000, 'Gb', '400GbE', 'standard'],
  [800000, 'Gb', '800GbE', 'standard'],
  [1600000, 'Gb', '1.6TbE', 'developing'],
].map(([mbps, unit, alias, status]) => {
  const label = unit === 'Mb' ? `${mbps} Mb/s` : `${fmtNum(mbps / 1000)} Gb/s`;
  const dev = status === 'developing';
  return adv({
    id: unit === 'Mb' ? `eth-${mbps}m` : `eth-${String(mbps / 1000).replace('.', '-')}g`,
    name: dev ? 'Ethernet 1.6 Tb/s (in development)' : `Ethernet ${label}`,
    family: 'Ethernet', category: 'network', mbps,
    width: { label: 'per port' },
    status, verification: dev ? 'unverified' : 'sourced',
    sources: dev ? ['user-seed', 'ieee-8023dj'] : ['ieee-8023'],
    aliases: [alias, 'LAN', 'network', 'GbE'],
    notes: dev
      ? 'IEEE P802.3dj not ratified at time of writing. Per direction (full duplex, not summed).'
      : 'MAC data rate per direction. Full duplex is not summed.',
  });
});

// ---------------------------------------------------------------- OSFP module capacity

/**
 * OSFP / OSFP-XD aggregate module capacity as published by the OSFP MSA FAQ: one row
 * per rate/lane mapping. These MSA-verified rows of the transceiver guide are the only
 * source-verified transceiver entries; the guide's other numeric rows follow below as
 * user-supplied, unverified entries.
 */
const OSFP_NOTE = 'OSFP MSA aggregate module capacity (form-factor/connector entry), not usable payload throughput. ' +
  'The MSA publishes the module rate and electrical-lane mapping; it does not specify the Ethernet PHY, ' +
  'optical medium or reach, and this is not a production availability claim.';
const IEEE_NOTE = ' IEEE Ethernet PHY status is separate: see the Ethernet rows (1.6 Tb/s is in development there).';

const osfp = [
  ['osfp-400g', 'OSFP', 'OSFP56 / OSFP400', 400, 8, 50, ['OSFP56', 'OSFP400', '8x50G']],
  ['osfp-800g', 'OSFP', 'OSFP112 / OSFP800', 800, 8, 100, ['OSFP112', 'OSFP800', '8x100G']],
  ['osfp-1-6t', 'OSFP', 'OSFP224 / OSFP1600', 1600, 8, 200, ['OSFP224', 'OSFP1600', 'OSFP 1.6T', '8x200G']],
  ['osfp-xd-800g', 'OSFP-XD', 'OSFP-XD', 800, 16, 50, ['OSFP XD 800G', '16x50G']],
  ['osfp-xd-1-6t', 'OSFP-XD', 'OSFP-XD', 1600, 16, 100, ['OSFP XD 1.6T', '16x100G']],
  ['osfp-xd-3-2t', 'OSFP-XD', 'OSFP-XD', 3200, 8, 200, ['OSFP XD 3.2T', '8x200G']],
].map(([id, family, label, gbps, lanes, laneG, aliases]) => {
  const rate = gbps < 1000 ? `${gbps} Gb/s` : `${fmtNum(gbps / 1000)} Tb/s`;
  const mapping = `${lanes} × ${laneG}G`;
  return adv({
    id, family, category: 'network', mbps: gbps * 1000,
    name: `${label} module (${rate}, ${lanes}×${laneG}G)`,
    width: { count: lanes, label: `${mapping} lanes` },
    formula: `${mapping} electrical lanes = ${fmtNum(gbps)} Gb/s module capacity ÷ 8`,
    status: 'connector', verification: 'sourced', sources: ['osfp-msa'],
    aliases: [...aliases, 'OSFP', ...(family === 'OSFP-XD' ? ['OSFP-XD'] : []), 'OSFP MSA', 'transceiver module'],
    notes: `${OSFP_NOTE} Mapping: ${mapping} electrical lanes = ${rate}` +
      (id === 'osfp-xd-3-2t' ? ', as the MSA FAQ states it: 8 × 200G, not 16 × 200G, even though OSFP-XD has 16 lanes.' : '.') +
      (gbps === 1600 ? IEEE_NOTE : ''),
  });
});

// ---------------------------------------------------------------- user-supplied form-factor rates

/**
 * The non-MSA rows of the transceiver form-factor guide page that give an explicit
 * numeric rate, compared exactly as the site owner supplied them. Unverified: no IEEE,
 * MSA or datasheet check, no inferred coding/overhead and no guessed lane count. A lane
 * mapping appears only where the guide itself states one. DSFP and the legacy names give
 * no rate and stay guide-only.
 */
const USER_FF_NOTE = 'Nominal rate from the site owner’s transceiver form-factor guide, compared exactly as supplied; ' +
  'not independently verified. It is not a verified Ethernet PHY or standard and not payload throughput, ' +
  'with no reach, medium or production-availability claim. No coding or overhead adjustment is inferred.';

const userFormFactors = [
  // [id, family, guide name, Gb/s as supplied, guide lane mapping or null, extra note]
  ['sfp-1g', 'SFP', 'SFP', 1, null],
  ['sfp-plus-10g', 'SFP', 'SFP+', 10, null],
  ['sfp28-25g', 'SFP', 'SFP28', 25, null],
  ['sfp56-50g', 'SFP', 'SFP56', 50, null],
  ['sfp112-100g', 'SFP', 'SFP112', 100, null],
  ['sfp224-200g', 'SFP', 'SFP224', 200, null, 'Developing generation: current production/availability status not independently verified.'],
  ['sfp-dd56-100g', 'SFP-DD', 'SFP-DD56', 100, [2, 50]],
  ['sfp-dd112-200g', 'SFP-DD', 'SFP-DD112', 200, [2, 100]],
  ['qsfp-4g', 'QSFP', 'QSFP', 4, null, 'The 4 Gb/s figure is reproduced exactly as supplied and has not been corrected.'],
  ['qsfp-plus-40g', 'QSFP', 'QSFP+', 40, null],
  ['qsfp28-100g', 'QSFP', 'QSFP28', 100, null],
  ['qsfp56-200g', 'QSFP', 'QSFP56', 200, null],
  ['qsfp112-400g', 'QSFP', 'QSFP112', 400, null],
  ['qsfp224-800g', 'QSFP', 'QSFP224 / QSFP800', 800, [4, 200]],
  ['qsfp-dd-200g', 'QSFP-DD', 'QSFP-DD (200G)', 200, null],
  ['qsfp-dd-400g', 'QSFP-DD', 'QSFP-DD (400G)', 400, null],
  ['qsfp-dd-800g', 'QSFP-DD', 'QSFP-DD800', 800, null],
  ['qsfp-dd-1600g', 'QSFP-DD', 'QSFP-DD1600', 1600, null],
].map(([id, family, guideName, gbps, lanes, extra]) => {
  const rate = gbps < 1000 ? `${gbps} Gb/s` : `${fmtNum(gbps / 1000)} Tb/s`;
  const dev = id === 'sfp224-200g';
  const label = guideName.replace(/ \(\d+G\)$/, '');
  return adv({
    id, family, category: 'network', mbps: gbps * 1000,
    name: `${label} module (${rate}, ${dev ? 'developing, ' : ''}user-supplied)`,
    width: lanes
      ? { count: lanes[0], label: `${lanes[0]} × ${lanes[1]}G lanes (unverified)` }
      : { count: 1, label: 'Lane mapping not source-verified' },
    formula: `${gbps} Gb/s nominal rate as supplied ÷ 8`,
    status: dev ? 'developing' : 'user-supplied', verification: 'unverified', sources: ['user-seed'],
    aliases: [...new Set([guideName, ...guideName.split(' / '), family])].concat('user-supplied', 'transceiver module'),
    notes: `${USER_FF_NOTE} ` +
      (lanes ? `Lane mapping as supplied in the guide, unverified: ${lanes[0]} × ${lanes[1]}G electrical lanes.` : 'Lane mapping not source-verified.') +
      (extra ? ` ${extra}` : ''),
  });
});

// ---------------------------------------------------------------- export

export const INTERFACES = Object.freeze([
  ...hbm, ...gddr, ...ddr, ...lpddr,
  ...pcie,
  ...sata, ...sas, ...connectors, ...sdBus, ...sdExpress,
  ...usb, ...tb,
  ...display,
  ...eth, ...osfp, ...userFormFactors,
]);

export const BY_ID = new Map(INTERFACES.map((i) => [i.id, i]));

export const DEFAULT_A = 'pcie4-x4';
export const DEFAULT_B = 'sata3';
