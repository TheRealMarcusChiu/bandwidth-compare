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
  ['hbm4-samsung-production', 'HBM4 (Samsung production claim)', 11700, 2048, 'vendor-claim', 'sourced', ['samsung-hbm4'], ['HBM4']],
  ['hbm4-samsung-max', 'HBM4 (Samsung maximum)', 13000, 2048, 'vendor-claim', 'sourced', ['samsung-hbm4'], []],
].map(([id, name, perPinMbps, widthBits, status, verification, sources, aliases]) =>
  memory({
    id, name, family: 'HBM', perPinMbps, widthBits, status, verification, sources,
    aliases: [...aliases, 'high bandwidth memory', 'stack'],
    notes: 'Per stack.',
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
  ['gddr7-samsung-max', 'GDDR7 (Samsung maximum)', 40000, 32, 'vendor-claim', 'sourced', ['samsung-gddr7', 'jedec-gddr'], ['GDDR7']],
].map(([id, name, perPinMbps, widthBits, status, verification, sources, aliases]) =>
  memory({
    id, name, family: 'GDDR', perPinMbps, widthBits, status, verification, sources,
    aliases: [...aliases, 'graphics memory', 'vram'],
    notes: widthBits === 64 ? 'Per x64 package (two dies).' : 'Per x32 device.',
  }),
);

/** DDR / LPDDR: MT/s × 64 bits (normalized channel) ÷ 8. */
function ddrEntries(family, idPrefix, rates, { status = () => 'standard', verification = () => 'sourced', sources = () => ['jedec-ddr'], notes = 'One 64-bit channel (DIMM, no ECC).', aliases = [], width = 64, label = (r) => `${family}-${r}` } = {}) {
  return rates.map((rate) =>
    memory({
      id: `${idPrefix}-${rate}`,
      name: label(rate),
      family,
      perPinMbps: rate,
      widthBits: width,
      status: status(rate),
      verification: verification(rate),
      sources: sources(rate),
      aliases: [`${family} ${rate}`, `${family}${rate}`, `PC ${rate}`, ...aliases],
      notes,
      formula: `${rate} MT/s × ${width} bits ÷ 8`,
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
    notes: 'One 64-bit DIMM (two 32-bit subchannels). JEDEC grades through 8800 per JESD79-5C.',
  }),
  ...ddrEntries('DDR5 MRDIMM', 'ddr5-mrdimm', [8000, 8800, 10400, 12800], {
    status: (r) => (r === 8800 ? 'standard' : r === 12800 ? 'developing' : 'vendor-claim'),
    verification: (r) => (r === 8800 ? 'sourced' : 'unverified'),
    sources: (r) => (r === 8800 ? ['jedec-mrdimm'] : ['user-seed']),
    label: (r) => `DDR5 MRDIMM-${r} (host channel)`,
    aliases: ['MCR DIMM', 'multiplexed rank'],
    notes: 'Host-side 64-bit channel rate; the DRAM ranks run at half the rate.',
  }),
];

const lp = [
  ['lpddr1', 'LPDDR1', 400, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr2', 'LPDDR2', 1066, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr3', 'LPDDR3', 2133, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr4', 'LPDDR4', 4266, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr4x', 'LPDDR4X', 4266, 'standard', 'sourced', ['jedec-lpddr']],
  ['lpddr5', 'LPDDR5', 6400, 'standard', 'sourced', ['jedec-lpddr']],
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
    status: 'standard',
    verification: 'sourced',
    sources: g.gen === 7 ? ['pcisig-7', 'pcisig-faq'] : ['pcisig-faq'],
    ...extra,
  });
}

const pcie = PCIE_GENS.flatMap((g) =>
  LANES.map((lanes) =>
    pcieLink(g, lanes, {
      id: `pcie${g.gen}-x${lanes}`,
      name: `PCIe ${g.label} x${lanes}`,
      aliases: [
        `PCIe ${g.gen} x${lanes}`, `PCIe${g.gen}x${lanes}`, `Gen${g.gen} x${lanes}`, `Gen ${g.gen}`,
        ...g.revs.map((r) => `PCIe ${r}`), 'PCI Express',
      ],
      notes:
        `Per direction. Covers revisions ${g.revs.join(', ')}.` +
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

function adv({ id, name, family, mbps, width, sources, aliases = [], notes = '', status = 'standard', verification = 'sourced', asymmetric = null, category = 'peripheral' }) {
  return linkEntry({
    id, name, family, category, basis: 'advertised-link', gbpsMbps: mbps,
    perLane: null,
    width: { count: width.count ?? 1, label: width.label ?? width },
    formula: mbps < 1000 ? `${fmtNum(mbps)} Mb/s advertised ÷ 8` : `${fmtNum(mbps / 1000)} Gb/s advertised ÷ 8`,
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

const display = [
  rawLanes({ id: 'dp14-hbr3', name: 'DisplayPort 1.4 HBR3', family: 'DisplayPort', laneMbps: 8100, lanes: 4, sources: ['vesa-dp'], aliases: ['DP 1.4', 'DP1.4', 'HBR3'], notes: 'Main link, one direction. 8b/10b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr10', name: 'DisplayPort 2.1 UHBR10', family: 'DisplayPort', laneMbps: 10000, lanes: 4, sources: ['vesa-dp'], aliases: ['DP 2.1', 'DP2.1', 'UHBR10'], notes: 'Main link, one direction. 128b/132b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr13-5', name: 'DisplayPort 2.1 UHBR13.5', family: 'DisplayPort', laneMbps: 13500, lanes: 4, sources: ['vesa-dp'], aliases: ['DP 2.1', 'UHBR13.5'], notes: 'Main link, one direction. 128b/132b not subtracted.' }),
  rawLanes({ id: 'dp21-uhbr20', name: 'DisplayPort 2.1 UHBR20', family: 'DisplayPort', laneMbps: 20000, lanes: 4, sources: ['vesa-dp'], aliases: ['DP 2.1', 'UHBR20'], notes: 'Main link, one direction. 128b/132b not subtracted.' }),
  rawLanes({ id: 'hdmi21-frl', name: 'HDMI 2.1 FRL (48 Gb/s)', family: 'HDMI', laneMbps: 12000, lanes: 4, sources: ['hdmi-21'], aliases: ['HDMI 2.1', 'HDMI2.1', 'FRL'], notes: 'Fixed Rate Link, one direction. 16b/18b not subtracted.' }),
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

// ---------------------------------------------------------------- export

export const INTERFACES = Object.freeze([
  ...hbm, ...gddr, ...ddr, ...lpddr,
  ...pcie,
  ...sata, ...sas, ...connectors, ...sdBus, ...sdExpress,
  ...usb, ...tb,
  ...display,
  ...eth,
]);

export const BY_ID = new Map(INTERFACES.map((i) => [i.id, i]));

export const DEFAULT_A = 'pcie4-x4';
export const DEFAULT_B = 'sata3';
