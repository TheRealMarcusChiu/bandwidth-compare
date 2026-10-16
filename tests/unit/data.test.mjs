import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERFACES, BY_ID, BASES, STATUSES, VERIFICATION, CATEGORIES, SOURCES, DEFAULT_A, DEFAULT_B, computeGBps,
} from '../../js/data.js';

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing interface ${id}`);
  return i;
};
const GBps = (id) => get(id).GBps;

// ------------------------------------------------------------ schema

test('ids are unique, url-safe and indexed', () => {
  const ids = INTERFACES.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
  assert.equal(BY_ID.size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9][a-z0-9-]{0,63}$/, id);
});

test('names are unique', () => {
  const names = INTERFACES.map((i) => i.name);
  const dupes = names.filter((n, k) => names.indexOf(n) !== k);
  assert.deepEqual(dupes, []);
});

test('every entry has valid metadata', () => {
  for (const i of INTERFACES) {
    const where = i.id;
    assert.ok(i.name && typeof i.name === 'string', where);
    assert.ok(i.family, where);
    assert.ok(i.category in CATEGORIES, `${where} category`);
    assert.ok(i.basis in BASES, `${where} basis`);
    assert.ok(i.status in STATUSES, `${where} status`);
    assert.ok(i.verification in VERIFICATION, `${where} verification`);
    assert.ok(Array.isArray(i.sources) && i.sources.length > 0, `${where} sources`);
    for (const s of i.sources) assert.ok(s in SOURCES, `${where} unknown source ${s}`);
    assert.ok(i.width && typeof i.width.label === 'string' && i.width.label, `${where} width`);
    assert.ok(typeof i.formula === 'string' && i.formula.includes('÷ 8') || i.formula.includes('MB/s'), `${where} formula`);
    assert.ok(Array.isArray(i.aliases), where);
    assert.ok(Number.isSafeInteger(i.bitsPerSecond) && i.bitsPerSecond > 0, `${where} bitsPerSecond integer`);
    assert.ok(Number.isFinite(i.GBps) && i.GBps > 0, `${where} GBps`);
    assert.equal(i.GBps, computeGBps(i.bitsPerSecond, ...i.efficiency), `${where} GBps formula`);
    assert.ok(Math.abs(i.Gbps - i.GBps * 8) < 1e-9 * i.Gbps, `${where} Gbps = 8 × GBps`);
    assert.ok(Object.isFrozen(i), `${where} frozen`);
  }
});

test('sources are well formed and every source is used', () => {
  const used = new Set(INTERFACES.flatMap((i) => i.sources));
  for (const [id, s] of Object.entries(SOURCES)) {
    assert.ok(s.title && s.publisher, id);
    assert.ok(['primary', 'secondary', 'user'].includes(s.kind), id);
    if (s.kind !== 'user') assert.match(s.url, /^https:\/\//, id);
    assert.ok(used.has(id), `source ${id} unused`);
  }
});

test('unverified entries cite the user seed; sourced entries cite something else', () => {
  for (const i of INTERFACES) {
    if (i.verification === 'unverified') assert.ok(i.sources.includes('user-seed'), i.id);
    else assert.ok(i.sources.some((s) => s !== 'user-seed'), i.id);
  }
});

test('defaults exist', () => {
  assert.equal(DEFAULT_A, 'pcie4-x4');
  assert.equal(DEFAULT_B, 'sata3');
  get(DEFAULT_A);
  get(DEFAULT_B);
});

// ------------------------------------------------------------ basis metadata

test('basis assignment per family', () => {
  const expect = {
    HBM: 'memory-theoretical', GDDR: 'memory-theoretical', DDR: 'memory-theoretical', DDR2: 'memory-theoretical',
    DDR3: 'memory-theoretical', DDR4: 'memory-theoretical', DDR5: 'memory-theoretical', 'DDR5 MRDIMM': 'memory-theoretical',
    LPDDR: 'memory-theoretical', SAS: 'raw-signaling', SATA: 'encoding-adjusted', USB: 'advertised-link',
    Thunderbolt: 'advertised-link', Ethernet: 'advertised-link', DisplayPort: 'raw-signaling', HDMI: 'raw-signaling',
  };
  for (const i of INTERFACES) if (i.family in expect) assert.equal(i.basis, expect[i.family], i.id);
  for (let g = 1; g <= 7; g++) {
    for (const l of [1, 2, 4, 8, 16]) {
      assert.equal(get(`pcie${g}-x${l}`).basis, g >= 6 ? 'raw-signaling' : 'encoding-adjusted', `pcie${g}-x${l}`);
    }
  }
});

test('PCIe encoding per generation', () => {
  for (const g of [1, 2]) assert.deepEqual(get(`pcie${g}-x1`).efficiency, [8, 10]);
  for (const g of [3, 4, 5]) assert.deepEqual(get(`pcie${g}-x1`).efficiency, [128, 130]);
  for (const g of [6, 7]) assert.deepEqual(get(`pcie${g}-x1`).efficiency, [1, 1]);
});

test('no unverified PCIe 6.5 / 7.1 revisions are presented', () => {
  for (const i of INTERFACES) {
    assert.doesNotMatch(i.name, /PCIe\s*(6\.5|7\.1)/, i.id);
  }
});

test('connector rows mirror their underlying link and are marked as connectors', () => {
  const rows = INTERFACES.filter((i) => i.connectorOf);
  assert.ok(rows.length >= 13);
  for (const r of rows) {
    const base = get(r.connectorOf);
    assert.equal(r.GBps, base.GBps, r.id);
    assert.equal(r.basis, base.basis, r.id);
  }
  for (const g of [3, 4, 5]) {
    for (const f of ['u2', 'u3', 'm2']) {
      const r = get(`${f}-nvme-pcie${g}-x4`);
      assert.equal(r.status, 'connector');
      assert.equal(r.connectorOf, `pcie${g}-x4`);
      assert.match(r.notes, /protocol|connector|form factor/i);
    }
  }
  assert.equal(get('m2-sata').connectorOf, 'sata3');
});

test('asymmetric modes record both directions and display only the faster', () => {
  for (const id of ['usb4v2-120', 'tb5-boost']) {
    const i = get(id);
    assert.deepEqual(i.asymmetric, { forwardMbps: 120000, reverseMbps: 40000 });
    assert.equal(i.Gbps, 120); // never 160
  }
  assert.equal(get('usb4v2-80').Gbps, 80); // never 160
  assert.equal(get('tb5').Gbps, 80);
});

test('status labels for non-standard data', () => {
  assert.equal(get('eth-1600g').status, 'developing');
  assert.equal(get('eth-1600g').verification, 'unverified');
  assert.equal(get('eth-800g').status, 'standard');
  assert.equal(get('ddr5-9200').verification, 'unverified');
  assert.equal(get('ddr5-8800').status, 'standard');
  assert.equal(get('ddr2-1066').status, 'vendor-bin');
  assert.equal(get('gddr1').status, 'illustrative');
  assert.equal(get('gddr2').status, 'illustrative');
  assert.equal(get('gddr3').status, 'historical');
  assert.equal(get('gddr4').status, 'historical');
  assert.equal(get('hbm2e-vendor-4-2').verification, 'unverified');
  assert.equal(get('hbm4-samsung-max').status, 'vendor-claim');
  assert.equal(get('gddr7-samsung-max').status, 'vendor-claim');
  assert.equal(get('ddr5-mrdimm-8800').status, 'standard');
  for (const r of [8000, 10400, 12800]) assert.equal(get(`ddr5-mrdimm-${r}`).verification, 'unverified');
});

// ------------------------------------------------------------ arithmetic (exact)

test('HBM per stack', () => {
  assert.equal(GBps('hbm1'), 128);
  assert.equal(GBps('hbm2'), 307.2);
  assert.equal(GBps('hbm2e'), 409.6);
  assert.equal(GBps('hbm2e-vendor-4-2'), 537.6);
  assert.equal(GBps('hbm3'), 819.2);
  assert.equal(GBps('hbm3e'), 1177.6);
  assert.equal(GBps('hbm4-samsung-production'), 2995.2);
  assert.equal(GBps('hbm4-samsung-max'), 3328);
  assert.equal(get('hbm4-samsung-max').width.count, 2048);
});

test('GDDR per device', () => {
  const want = { gddr1: 1.6, gddr2: 4, gddr3: 8, gddr4: 12.8, gddr5: 32, gddr5x: 48, gddr6: 96, gddr6x: 96, gddr6w: 176, 'gddr7-samsung-max': 160 };
  for (const [id, v] of Object.entries(want)) assert.equal(GBps(id), v, id);
  assert.equal(get('gddr6w').width.count, 64);
});

test('DDR generations: MT/s × 64 ÷ 8000', () => {
  const sets = {
    ddr: [200, 266, 333, 400],
    ddr2: [400, 533, 667, 800, 1066],
    ddr3: [800, 1066, 1333, 1600, 1866, 2133],
    ddr4: [1600, 1866, 2133, 2400, 2666, 2933, 3200],
    ddr5: [4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000, 8400, 8800, 9200],
    'ddr5-mrdimm': [8000, 8800, 10400, 12800],
  };
  for (const [p, rates] of Object.entries(sets)) {
    for (const r of rates) assert.equal(GBps(`${p}-${r}`), (r * 64) / 8000, `${p}-${r}`);
  }
  assert.equal(GBps('ddr-400'), 3.2);
  assert.equal(GBps('ddr4-3200'), 25.6);
  assert.equal(GBps('ddr5-6400'), 51.2);
  assert.equal(GBps('ddr5-mrdimm-12800'), 102.4);
});

test('LPDDR normalized to 64 bits except LPDDR6 at 24 bits', () => {
  const want = { 'lpddr1-400': 3.2, 'lpddr2-1066': 8.528, 'lpddr3-2133': 17.064, 'lpddr4-4266': 34.128, 'lpddr4x-4266': 34.128, 'lpddr5-6400': 51.2, 'lpddr5x-10700': 85.6, 'lpddr6-14400': 43.2 };
  for (const [id, v] of Object.entries(want)) assert.equal(GBps(id), v, id);
  assert.equal(get('lpddr6-14400').width.count, 24);
});

test('PCIe per direction across all generations and widths', () => {
  const gt = { 1: 2.5, 2: 5, 3: 8, 4: 16, 5: 32, 6: 64, 7: 128 };
  for (const [g, rate] of Object.entries(gt)) {
    for (const l of [1, 2, 4, 8, 16]) {
      const eff = g <= 2 ? 0.8 : g <= 5 ? 128 / 130 : 1;
      const v = GBps(`pcie${g}-x${l}`);
      assert.ok(Math.abs(v - (rate * l * eff) / 8) < 1e-12, `pcie${g}-x${l}`);
    }
  }
  assert.equal(GBps('pcie1-x1'), 0.25);
  assert.equal(GBps('pcie2-x16'), 8);
  assert.equal(GBps('pcie4-x4'), (16 * 4 * 128) / (130 * 8));
  assert.equal(GBps('pcie6-x16'), 128);
  assert.equal(GBps('pcie7-x16'), 256); // PCI-SIG: 512 GB/s is the bidirectional sum; we show 256
});

test('SAS raw and SATA encoding-adjusted', () => {
  assert.equal(GBps('sas1'), 0.375);
  assert.equal(GBps('sas2'), 0.75);
  assert.equal(GBps('sas3'), 1.5);
  assert.equal(GBps('sas4'), 2.8125);
  assert.equal(GBps('sas4-1'), 2.8125);
  assert.equal(GBps('sata1'), 0.15);
  assert.equal(GBps('sata2'), 0.3);
  assert.equal(GBps('sata3'), 0.6);
});

test('USB and Thunderbolt advertised rates', () => {
  const want = {
    'usb1-low': 0.0001875, 'usb1-full': 0.0015, usb2: 0.06, 'usb-5g': 0.625, 'usb-10g': 1.25,
    'usb32-gen1x2': 1.25, 'usb32-gen2x2': 2.5, 'usb4-20': 2.5, 'usb4-40': 5, 'usb4v2-80': 10, 'usb4v2-120': 15,
    tb1: 1.25, tb2: 2.5, tb3: 5, tb4: 5, tb5: 10, 'tb5-boost': 15,
  };
  for (const [id, v] of Object.entries(want)) assert.equal(GBps(id), v, id);
});

test('Ethernet', () => {
  assert.equal(GBps('eth-10m'), 0.00125);
  assert.equal(GBps('eth-100m'), 0.0125);
  const gb = [1, 2.5, 5, 10, 25, 40, 50, 100, 200, 400, 800, 1600];
  for (const g of gb) assert.equal(GBps(`eth-${String(g).replace('.', '-')}g`), g / 8, `eth ${g}`);
});

test('SD bus and SD Express', () => {
  assert.equal(GBps('sd-uhs1'), 0.104);
  assert.equal(GBps('sd-uhs2-fd156'), 0.156);
  assert.equal(GBps('sd-uhs2-hd312'), 0.312);
  assert.equal(GBps('sd-uhs3-fd312'), 0.312);
  assert.equal(GBps('sd-uhs3-fd624'), 0.624);
  assert.equal(GBps('sd-express-pcie3-x1'), GBps('pcie3-x1'));
  assert.equal(GBps('sd-express-pcie4-x2'), GBps('pcie4-x2'));
  assert.ok(Math.abs(GBps('sd-express-pcie4-x2') - 3.938) < 0.001); // SDA: ~3,940 MB/s
});

test('display links are raw lane sums', () => {
  assert.equal(get('dp14-hbr3').Gbps, 32.4);
  assert.equal(get('dp21-uhbr20').Gbps, 80);
  assert.equal(get('hdmi21-frl').Gbps, 48);
});
