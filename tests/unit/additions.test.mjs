// Catalog additions from the 2026-10-16 audit (docs/catalog-audit.md).
// Each figure is pinned to the arithmetic its cited source supports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACES, BY_ID, SOURCES } from '../../js/data.js';
import { buildIndex, search } from '../../js/compare.js';

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing interface ${id}`);
  return i;
};
const idx = buildIndex(INTERFACES);
const ids = (q) => search(idx, q).map((i) => i.id);

/** Sources added by the audit must be dated and point at a real page. */
function assertDatedSources(entry) {
  for (const key of entry.sources) {
    const s = SOURCES[key];
    assert.ok(s, `${entry.id}: unknown source ${key}`);
    assert.match(s.url, /^https:\/\//, `${entry.id}: ${key} url`);
    assert.match(s.publisher, /\b(19|20)\d\d\b/, `${entry.id}: ${key} publisher carries a date`);
  }
}

// ------------------------------------------------------------ HBM4 / HBM4E

test('HBM4 JEDEC baseline: 8 Gb/s × 2048 bits = 2,048 GB/s per stack', () => {
  const i = get('hbm4-jedec');
  assert.equal(i.family, 'HBM');
  assert.equal(i.status, 'standard');
  assert.equal(i.verification, 'sourced');
  assert.equal(i.width.count, 2048);
  assert.equal(i.perLane.value, 8);
  assert.equal(i.GBps, 2048);
  assert.ok(i.sources.includes('jedec-hbm4'));
  assert.match(i.notes, /JESD270-4/);
  assertDatedSources(i);
});

test('HBM4E (Samsung): vendor claims, 14 Gb/s sample and 16 Gb/s maximum over 2048 bits', () => {
  const sample = get('hbm4e-samsung-sample');
  const max = get('hbm4e-samsung-max');
  for (const i of [sample, max]) {
    assert.equal(i.family, 'HBM');
    assert.equal(i.basis, 'memory-theoretical');
    assert.equal(i.status, 'vendor-claim'); // vendor figures, not JEDEC standard rates
    assert.equal(i.verification, 'sourced');
    assert.equal(i.width.count, 2048);
    assertDatedSources(i);
    // Width is documented by Samsung's HBM product page ("Organization 2048"), not assumed.
    assert.ok(i.sources.includes('samsung-hbm-product'), `${i.id} cites the Samsung HBM product page`);
    assert.match(i.notes, /Organization 2048/);
    assert.doesNotMatch(i.notes, /assum/i);
    // Precise attribution instead of unqualified present-tense claims.
    assert.match(i.notes, /vendor figures?, not JEDEC standard rates/i);
    assert.match(i.notes, /May 29, 2026/);
    assert.match(i.notes, /sample shipments/i);
    assert.match(i.notes, /planned mass production/i);
    assert.doesNotMatch(i.notes, /not a published JEDEC standard|not in volume production|Sampling, not volume/i);
  }
  assert.equal(sample.perLane.value, 14);
  assert.equal(max.perLane.value, 16);
  assert.equal(sample.GBps, 3584); // Samsung: "up to 3.6 TB/s per stack"
  assert.equal(max.GBps, 4096); // Samsung: "4.0 TB/s"
  // Samsung's rounded TB/s figures must agree with the documented 2048-bit
  // organization to within rounding.
  assert.ok(Math.abs(sample.GBps / 1000 - 3.6) < 0.05);
  assert.ok(Math.abs(max.GBps / 1000 - 4.0) < 0.1);
  assert.ok(max.sources.includes('samsung-hbm4e-gtc'));
  assert.ok(sample.sources.includes('samsung-hbm4e-samples'));
});

test('Samsung HBM product page: primary, undated, access date cited', () => {
  const s = SOURCES['samsung-hbm-product'];
  assert.ok(s);
  assert.equal(s.url, 'https://semiconductor.samsung.com/dram/hbm/');
  assert.equal(s.kind, 'primary');
  assert.match(s.publisher, /undated; accessed Oct 16, 2026/);
  assert.match(s.title, /16\.0 Gbps/);
  assert.match(s.title, /Organization 2048/);
});

test('HBM ordering stays generational', () => {
  const hbm = INTERFACES.filter((i) => i.family === 'HBM').map((i) => i.id);
  assert.ok(hbm.indexOf('hbm3e') < hbm.indexOf('hbm4-jedec'));
  assert.ok(hbm.indexOf('hbm4-jedec') < hbm.indexOf('hbm4-samsung-production'));
  assert.ok(hbm.indexOf('hbm4-samsung-max') < hbm.indexOf('hbm4e-samsung-sample'));
  assert.ok(hbm.indexOf('hbm4e-samsung-sample') < hbm.indexOf('hbm4e-samsung-max'));
});

test('search finds HBM4E and the JEDEC HBM4 baseline', () => {
  assert.deepEqual(ids('hbm4e').sort(), ['hbm4e-samsung-max', 'hbm4e-samsung-sample']);
  assert.ok(ids('hbm 4e').includes('hbm4e-samsung-max'));
  assert.ok(ids('jesd270').includes('hbm4-jedec'));
  assert.ok(ids('hbm4').includes('hbm4-jedec'));
});

// ------------------------------------------------------------ GDDR7 / LPDDR5X

test('GDDR7 JEDEC JESD239 headline: 192 GB/s per x32 device ⇒ 48 Gb/s per pin', () => {
  const i = get('gddr7-jedec');
  assert.equal(i.family, 'GDDR');
  assert.equal(i.status, 'standard');
  assert.equal(i.width.count, 32);
  assert.equal(i.GBps, 192);
  assert.equal(i.perLane.value, (192 * 8) / 32);
  assert.match(i.notes, /192 GB\/s per device/);
  assert.ok(i.sources.includes('jedec-gddr7'));
  assertDatedSources(i);
});

test('GDDR7 Micron 32 Gb/s vendor figure: 128 GB/s per x32 device', () => {
  const i = get('gddr7-micron-32');
  assert.equal(i.status, 'vendor-claim');
  assert.equal(i.verification, 'sourced');
  assert.equal(i.GBps, 128);
  assert.ok(i.sources.includes('micron-gddr7'));
  // Existing Samsung 40 Gb/s entry is untouched.
  assert.equal(get('gddr7-samsung-max').GBps, 160);
});

test('LPDDR5X JEDEC 8533 (JESD209-5B), 64-bit normalized like its siblings', () => {
  const i = get('lpddr5x-8533');
  assert.equal(i.name, 'LPDDR5X-8533 (64-bit normalized)');
  assert.equal(i.status, 'standard');
  assert.equal(i.GBps, (8533 * 64) / 8000);
  assert.equal(i.GBps, 68.264);
  assert.ok(i.sources.includes('jedec-lpddr5x'));
  assertDatedSources(i);
  const lp = INTERFACES.filter((x) => x.family === 'LPDDR').map((x) => x.id);
  assert.equal(lp.indexOf('lpddr5x-8533') + 1, lp.indexOf('lpddr5x-10700'));
});

test('search finds the new GDDR7 and LPDDR5X rows', () => {
  assert.ok(ids('gddr7').includes('gddr7-jedec'));
  assert.ok(ids('jesd239').includes('gddr7-jedec'));
  assert.ok(ids('gddr7 micron').includes('gddr7-micron-32'));
  assert.ok(ids('lpddr5x 8533').includes('lpddr5x-8533'));
});

// ------------------------------------------------------------ PCIe 8.0 (roadmap)

test('PCIe 8.0 rows are roadmap targets: 256 GT/s raw, per direction, not ratified', () => {
  for (const l of [1, 2, 4, 8, 16]) {
    const i = get(`pcie8-x${l}`);
    assert.equal(i.family, 'PCIe');
    assert.equal(i.status, 'developing');
    assert.equal(i.verification, 'sourced');
    assert.equal(i.basis, 'raw-signaling');
    assert.deepEqual(i.efficiency, [1, 1]);
    assert.equal(i.perLane.value, 256);
    assert.equal(i.GBps, (256 * l) / 8);
    assert.equal(i.name, `PCIe 8.0 x${l} (target)`);
    assert.match(i.notes, /target/i);
    assert.match(i.notes, /2028/);
    assert.ok(i.sources.includes('pcisig-8'));
    assertDatedSources(i);
  }
  // PCI-SIG: "up to 1 TB/s bi-directionally via x16" = 512 GB/s each way; never summed.
  assert.equal(get('pcie8-x16').GBps, 512);
  // PCIe 7.0 remains the newest released specification.
  assert.equal(get('pcie7-x16').status, 'standard');
  assert.equal(get('pcie7-x16').GBps, 256);
});

test('search finds PCIe 8.0 by common spellings', () => {
  assert.ok(ids('pcie 8 x16').includes('pcie8-x16'));
  assert.ok(ids('gen8 x4').includes('pcie8-x4'));
  assert.ok(ids('pcie8x1').includes('pcie8-x1'));
});

// ------------------------------------------------------------ display

test('DisplayPort HBR (v1.1a) and HBR2 (v1.2): four lanes, raw', () => {
  const hbr = get('dp11-hbr');
  const hbr2 = get('dp12-hbr2');
  assert.equal(hbr.name, 'DisplayPort 1.1a HBR');
  assert.equal(hbr2.name, 'DisplayPort 1.2 HBR2');
  for (const i of [hbr, hbr2]) {
    assert.equal(i.basis, 'raw-signaling');
    assert.equal(i.status, 'standard');
    assert.equal(i.width.count, 4);
    assert.ok(i.sources.includes('vesa-dp12'));
    assertDatedSources(i);
  }
  assert.equal(hbr.perLane.value, 2.7);
  assert.equal(hbr.Gbps, 10.8); // VESA: "from 10.8 Gbps"
  assert.equal(hbr2.perLane.value, 5.4);
  assert.equal(hbr2.Gbps, 21.6); // VESA: "to 21.6 Gbps"
  const dp = INTERFACES.filter((x) => x.family === 'DisplayPort').map((x) => x.id);
  assert.deepEqual(dp.slice(0, 3), ['dp11-hbr', 'dp12-hbr2', 'dp14-hbr3']);
});

test('DP revisions with no new link rate are aliases, not rows', () => {
  assert.ok(get('dp14-hbr3').aliases.includes('DP 1.3'));
  for (const id of ['dp21-uhbr10', 'dp21-uhbr13-5', 'dp21-uhbr20']) assert.ok(get(id).aliases.includes('DP 2.0'), id);
  assert.ok(ids('dp 1.3').includes('dp14-hbr3'));
  assert.ok(ids('dp 2.0').includes('dp21-uhbr20'));
  assert.ok(ids('hbr2').includes('dp12-hbr2'));
  assert.ok(!INTERFACES.some((i) => /DisplayPort (1\.3|2\.0)\b/.test(i.name)));
});

test('HDMI TMDS 10.2 / 18 Gb/s and HDMI 2.2 96 Gb/s, raw link totals', () => {
  const want = { 'hdmi13-tmds': 10.2, 'hdmi20-tmds': 18, 'hdmi21-frl': 48, 'hdmi22-frl': 96 };
  for (const [id, gbps] of Object.entries(want)) {
    const i = get(id);
    assert.equal(i.family, 'HDMI');
    assert.equal(i.basis, 'raw-signaling');
    assert.equal(i.status, 'standard');
    assert.equal(i.Gbps, gbps, id);
  }
  assert.equal(get('hdmi22-frl').GBps, 12);
  assert.equal(get('hdmi13-tmds').GBps, 1.275);
  assert.equal(get('hdmi20-tmds').GBps, 2.25);
  // HDMI 2.2 publishes no per-lane FRL rate; we must not invent one.
  assert.equal(get('hdmi22-frl').perLane, null);
  assert.match(get('hdmi22-frl').notes, /lane/i);
  for (const id of ['hdmi13-tmds', 'hdmi20-tmds', 'hdmi22-frl']) assertDatedSources(get(id));
  const hdmi = INTERFACES.filter((x) => x.family === 'HDMI').map((x) => x.id);
  assert.deepEqual(hdmi, ['hdmi13-tmds', 'hdmi20-tmds', 'hdmi21-frl', 'hdmi22-frl']);
});

test('search finds HDMI revisions', () => {
  assert.ok(ids('hdmi 1.4').includes('hdmi13-tmds'));
  assert.ok(ids('hdmi 2.0').includes('hdmi20-tmds'));
  assert.ok(ids('hdmi 2.2').includes('hdmi22-frl'));
  assert.ok(ids('ultra96').includes('hdmi22-frl'));
});

// ------------------------------------------------------------ audit bookkeeping

const ADDED = [
  'hbm4-jedec', 'hbm4e-samsung-sample', 'hbm4e-samsung-max',
  'gddr7-jedec', 'gddr7-micron-32', 'lpddr5x-8533',
  'pcie8-x1', 'pcie8-x2', 'pcie8-x4', 'pcie8-x8', 'pcie8-x16',
  'dp11-hbr', 'dp12-hbr2', 'hdmi13-tmds', 'hdmi20-tmds', 'hdmi22-frl',
];

// Separately audited on 2026-10-18 (docs/transceiver-form-factors-audit.md, tests/unit/osfp.test.mjs).
const OSFP_ADDED = ['osfp-400g', 'osfp-800g', 'osfp-1-6t', 'osfp-xd-800g', 'osfp-xd-1-6t', 'osfp-xd-3-2t'];
// User-supplied, unverified transceiver rates (tests/unit/user-transceivers.test.mjs).
const USER_FF_ADDED = [
  'sfp-1g', 'sfp-plus-10g', 'sfp28-25g', 'sfp56-50g', 'sfp112-100g', 'sfp224-200g',
  'sfp-dd56-100g', 'sfp-dd112-200g',
  'qsfp-4g', 'qsfp-plus-40g', 'qsfp28-100g', 'qsfp56-200g', 'qsfp112-400g', 'qsfp224-800g',
  'qsfp-dd-200g', 'qsfp-dd-400g', 'qsfp-dd-800g', 'qsfp-dd-1600g',
];
const LATER = [...OSFP_ADDED, ...USER_FF_ADDED];

test('catalog grows by exactly the audited additions (162 → 178)', () => {
  assert.equal(ADDED.length, 16);
  for (const id of ADDED) get(id);
  // The audit predates DDR channel variants (tests/unit/channels.test.mjs): its
  // 178 counts the 1-channel DDR rows only, so the extra configurations are excluded here.
  // The OSFP and user-supplied transceiver rows came from later, separate audits and are counted on their own.
  const audited = INTERFACES.filter((i) => !(i.channels > 1) && !LATER.includes(i.id));
  assert.equal(audited.length, 162 + ADDED.length);
  assert.ok(!LATER.some((id) => ADDED.includes(id)));
  for (const id of OSFP_ADDED) assert.deepEqual(get(id).sources, ['osfp-msa'], id);
  for (const id of USER_FF_ADDED) assert.deepEqual(get(id).sources, ['user-seed'], id);
  assert.equal(INTERFACES.length - audited.length, 34 * 5 + OSFP_ADDED.length + USER_FF_ADDED.length);
  assert.equal(INTERFACES.length, 178 + 34 * 5 + 6 + 18);
});

test('docs/catalog-audit.md documents every addition, its sources and the exclusions', async () => {
  const { readFile } = await import('node:fs/promises');
  const doc = await readFile(new URL('../../docs/catalog-audit.md', import.meta.url), 'utf8');
  assert.match(doc, /2026-10-16/);
  for (const id of ADDED) {
    assert.ok(doc.includes(`\`${id}\``), `audit doc mentions ${id}`);
    for (const key of get(id).sources) {
      if (key === 'pcisig-faq') continue; // pre-existing generic source
      assert.ok(doc.includes(SOURCES[key].url), `audit doc cites ${key} for ${id}`);
    }
  }
  // HBM4E width is documented by Samsung, not taken from JEDEC HBM4.
  assert.match(doc, /Width note for HBM4E:[^\n]*Organization[^\n]*2048/);
  assert.doesNotMatch(doc, /width comes from JEDEC HBM4|Width assumes/i);
  // No unqualified negatives: JEDEC absence is "none verified", production is attributed.
  assert.doesNotMatch(doc, /has no published JEDEC standard|No JEDEC standard was found|shipping \*\*samples\*\* only/);
  assert.match(doc, /none verified/i);
  assert.match(doc, /not a proof that none exists/i);
  assert.match(doc, /later production availability is not established by this audit/i);
  // LPDDR5X units: MT/s × bits ÷ 8000 = GB/s.
  assert.match(doc, /`lpddr5x-8533`[^\n]*8533 MT\/s × 64 ÷ 8000/);
  assert.doesNotMatch(doc, /8533 MT\/s × 64 ÷ 8 \|/);
  for (const heading of ['## Additions', '## Exclusions', '## Blocked or uncertain sources', '## Status review']) {
    assert.ok(doc.includes(heading), heading);
  }
});
