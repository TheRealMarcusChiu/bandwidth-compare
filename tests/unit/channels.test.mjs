// DDR–DDR5 channel configurations (1, 2, 4, 8, 12, 16 × 64-bit channels).
// Baseline values come from tests/unit/fixtures/catalog-baseline.json, captured
// from the catalog before channel variants existed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INTERFACES, BY_ID } from '../../js/data.js';
import { buildIndex, search } from '../../js/compare.js';

const BASELINE = JSON.parse(readFileSync(new URL('./fixtures/catalog-baseline.json', import.meta.url), 'utf8'));
const DDR_FAMILIES = new Set(['DDR', 'DDR2', 'DDR3', 'DDR4', 'DDR5']);

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing interface ${id}`);
  return i;
};

// ------------------------------------------------------------ legacy 1-channel rows

test('legacy DDR ids are kept as the 1-channel configuration with unchanged figures', () => {
  assert.equal(BASELINE.ddrSingleChannel.length, 34);
  for (const old of BASELINE.ddrSingleChannel) {
    const i = get(old.id);
    assert.equal(i.family, old.family, old.id);
    assert.equal(i.bitsPerSecond, old.bitsPerSecond, old.id);
    assert.equal(i.GBps, old.GBps, old.id);
    assert.equal(i.status, old.status, old.id);
    assert.equal(i.verification, old.verification, old.id);
    assert.deepEqual(i.sources, old.sources, old.id);
    assert.equal(i.channels, 1, old.id);
    assert.equal(i.channelBits, 64, old.id);
    assert.equal(i.width.count, 64, old.id);
    assert.match(i.name, / · 1 channel$/, old.id);
    assert.match(i.formula, /× 64 bits × 1 channel ÷ 8$/, old.id);
  }
  assert.equal(get('ddr5-6400').name, 'DDR5-6400 · 1 channel');
  assert.equal(get('ddr5-9200').name, 'DDR5-9200 (sampled) · 1 channel');
  assert.equal(get('ddr3-1600').name, 'DDR3/DDR3L-1600 · 1 channel');
});

// ------------------------------------------------------------ channel variants

const COUNTS = [1, 2, 4, 8, 12, 16];
const variantId = (baseId, n) => (n === 1 ? baseId : `${baseId}-${n}ch`);

test('every DDR–DDR5 rate has 1, 2, 4, 8, 12 and 16 channel configurations with stable ids', () => {
  for (const base of BASELINE.ddrSingleChannel) {
    for (const n of COUNTS) {
      const i = get(variantId(base.id, n));
      assert.equal(i.channels, n, i.id);
      assert.equal(i.family, base.family, i.id);
    }
  }
  const ddrRows = INTERFACES.filter((i) => DDR_FAMILIES.has(i.family));
  assert.equal(ddrRows.length, 34 * COUNTS.length);
  // Within a family: rate-major, then channel count ascending.
  const ddr5 = ddrRows.filter((i) => i.family === 'DDR5').map((i) => i.id);
  assert.deepEqual(ddr5.slice(0, 7), ['ddr5-4800', 'ddr5-4800-2ch', 'ddr5-4800-4ch', 'ddr5-4800-8ch', 'ddr5-4800-12ch', 'ddr5-4800-16ch', 'ddr5-5200']);
});

test('aggregate peak scales exactly by N: bits, GB/s, width and formula', () => {
  for (const base of BASELINE.ddrSingleChannel) {
    const one = get(base.id);
    for (const n of COUNTS) {
      const i = get(variantId(base.id, n));
      assert.equal(i.bitsPerSecond, base.bitsPerSecond * n, i.id);
      assert.equal(i.GBps, (one.perLane.value * 1000 * 64 * n) / 8000, i.id); // MT/s × 64 × N ÷ 8000, one division
      assert.ok(Math.abs(i.GBps - base.GBps * n) <= 1e-12 * i.GBps, `${i.id} = N × 1-channel`);
      assert.equal(i.Gbps, i.GBps * 8, i.id);
      assert.equal(i.channelBits, 64, i.id);
      assert.equal(i.width.count, 64 * n, i.id);
      assert.equal(i.width.label, n === 1 ? '64-bit' : `${64 * n}-bit (${n} × 64)`, i.id);
      assert.deepEqual(i.perLane, one.perLane, `${i.id} per-pin rate unchanged`);
      assert.equal(i.formula, `${one.perLane.value * 1000} MT/s × 64 bits × ${n} channel${n === 1 ? '' : 's'} ÷ 8`, i.id);
      assert.equal(i.basis, 'memory-theoretical', i.id);
      assert.ok(Object.isFrozen(i), i.id);
    }
  }
  assert.equal(get('ddr5-6400').GBps, 51.2);
  assert.equal(get('ddr5-6400-2ch').GBps, 102.4);
  assert.equal(get('ddr5-6400-8ch').GBps, 409.6);
  assert.equal(get('ddr5-6400-12ch').GBps, 614.4);
  assert.equal(get('ddr4-3200-4ch').GBps, 102.4);
  assert.equal(get('ddr-400-16ch').GBps, 51.2);
});

test('names state the channel count, singular or plural', () => {
  for (const base of BASELINE.ddrSingleChannel) {
    for (const n of COUNTS) {
      const i = get(variantId(base.id, n));
      assert.ok(i.name.endsWith(n === 1 ? ' · 1 channel' : ` · ${n} channels`), i.name);
      assert.doesNotMatch(i.name, /\b1 channels\b|\b([2-9]|1[0-9]) channel\b/, i.name);
    }
  }
  assert.equal(get('ddr5-6400-2ch').name, 'DDR5-6400 · 2 channels');
  assert.equal(get('ddr5-6400-8ch').name, 'DDR5-6400 · 8 channels');
  assert.equal(get('ddr5-9200-16ch').name, 'DDR5-9200 (sampled) · 16 channels');
});

test('variants inherit the rate\'s status, verification and sources', () => {
  for (const base of BASELINE.ddrSingleChannel) {
    for (const n of COUNTS) {
      const i = get(variantId(base.id, n));
      assert.equal(i.status, base.status, i.id);
      assert.equal(i.verification, base.verification, i.id);
      assert.deepEqual(i.sources, base.sources, i.id);
    }
  }
  assert.equal(get('ddr5-9200-8ch').verification, 'unverified');
  assert.equal(get('ddr2-1066-4ch').status, 'vendor-bin');
});

test('notes: theoretical configuration, no support claim; DDR5 subchannels counted once', () => {
  for (const base of BASELINE.ddrSingleChannel) {
    for (const n of COUNTS.slice(1)) {
      const i = get(variantId(base.id, n));
      assert.match(i.notes, new RegExp(`Theoretical ${n}-channel configuration`), i.id);
      assert.match(i.notes, /not a claim that any (particular )?processor supports/i, i.id);
      assert.match(i.notes, /inherits/i, i.id);
    }
  }
  for (const n of COUNTS) {
    const i = get(variantId('ddr5-6400', n));
    assert.match(i.notes, /two 32-bit subchannels/, i.id);
    assert.match(i.notes, /counted once|not doubled/i, i.id);
  }
});

// ------------------------------------------------------------ everything else untouched

// Added after the baseline was captured, in separate audits: the OSFP MSA rows
// (tests/unit/osfp.test.mjs) and the user-supplied, unverified transceiver rates
// (tests/unit/user-transceivers.test.mjs).
const OSFP_IDS = ['osfp-400g', 'osfp-800g', 'osfp-1-6t', 'osfp-xd-800g', 'osfp-xd-1-6t', 'osfp-xd-3-2t'];
const USER_FF_IDS = [
  'sfp-1g', 'sfp-plus-10g', 'sfp28-25g', 'sfp56-50g', 'sfp112-100g', 'sfp224-200g',
  'sfp-dd56-100g', 'sfp-dd112-200g',
  'qsfp-4g', 'qsfp-plus-40g', 'qsfp28-100g', 'qsfp56-200g', 'qsfp112-400g', 'qsfp224-800g',
  'qsfp-dd-200g', 'qsfp-dd-400g', 'qsfp-dd-800g', 'qsfp-dd-1600g',
];
const LATER = new Set([...OSFP_IDS, ...USER_FF_IDS]);

test('non-DDR rows (LPDDR, MRDIMM, HBM, GDDR, PCIe, …) are byte-for-byte unchanged and in the same order', () => {
  const others = INTERFACES.filter((i) => !DDR_FAMILIES.has(i.family) && !LATER.has(i.id));
  assert.equal(BASELINE.nonDdr.length, 144);
  assert.ok(BASELINE.nonDdr.every((b) => !LATER.has(b.id)), 'baseline predates OSFP and the user-supplied transceiver rows');
  assert.deepEqual(others.map((i) => i.id), BASELINE.nonDdr.map((b) => b.id));
  for (const b of BASELINE.nonDdr) {
    const i = get(b.id);
    for (const key of Object.keys(b)) assert.deepEqual(i[key], b[key], `${b.id}.${key}`);
    // Serialized projection of the captured fields, in the fixture's key order.
    const picked = Object.fromEntries(Object.keys(b).map((k) => [k, i[k]]));
    assert.equal(JSON.stringify(picked), JSON.stringify(b), `${b.id} byte-for-byte`);
    assert.equal(i.channels, undefined, `${b.id} has no channel metadata`);
  }
  // LPDDR normalized widths are untouched.
  for (const i of INTERFACES.filter((x) => x.family === 'LPDDR')) {
    assert.equal(i.width.count, i.id === 'lpddr6-14400' ? 24 : 64, i.id);
  }
  assert.equal(get('ddr5-mrdimm-12800').name, 'DDR5 MRDIMM-12800 (host channel)');
  assert.ok(!BY_ID.has('ddr5-mrdimm-8800-2ch'));
});

test('the six OSFP MSA and 18 user-supplied transceiver rows are the only new non-DDR rows, appended after the baseline', () => {
  const nonDdr = INTERFACES.filter((i) => !DDR_FAMILIES.has(i.family));
  assert.equal(nonDdr.length, 168);
  assert.equal(USER_FF_IDS.length, 18);
  assert.deepEqual(nonDdr.map((i) => i.id), [...BASELINE.nonDdr.map((b) => b.id), ...OSFP_IDS, ...USER_FF_IDS]);
  for (const id of OSFP_IDS) {
    const i = get(id);
    assert.equal(i.channels, undefined, id);
    assert.deepEqual(i.sources, ['osfp-msa'], id);
    assert.equal(i.status, 'connector', id);
    assert.equal(i.verification, 'sourced', id);
  }
  for (const id of USER_FF_IDS) {
    const i = get(id);
    assert.equal(i.channels, undefined, id);
    assert.deepEqual(i.sources, ['user-seed'], id);
    assert.equal(i.status, id === 'sfp224-200g' ? 'developing' : 'user-supplied', id);
    assert.equal(i.verification, 'unverified', id);
  }
});

test('catalog size: 168 non-DDR rows (144 baseline + 6 OSFP + 18 user-supplied) + 34 DDR rates × 6 channel counts', () => {
  assert.equal(INTERFACES.length, 144 + OSFP_IDS.length + USER_FF_IDS.length + 34 * 6);
  assert.equal(INTERFACES.length, 372);
});

// ------------------------------------------------------------ search

const idx = buildIndex(INTERFACES);
const ids = (q) => search(idx, q).map((i) => i.id);

test('search: "<rate> <N> channels" finds exactly that configuration', () => {
  assert.deepEqual(ids('DDR5-6400 8 channels'), ['ddr5-6400-8ch']);
  assert.deepEqual(ids('ddr5 6400 8 channel'), ['ddr5-6400-8ch']);
  assert.deepEqual(ids('ddr5-6400 8ch'), ['ddr5-6400-8ch']);
  assert.deepEqual(ids('ddr5 6400 12 channels'), ['ddr5-6400-12ch']);
  assert.deepEqual(ids('ddr5 6400 1 channel'), ['ddr5-6400']);
  assert.deepEqual(ids('ddr4-3200 16-channel'), ['ddr4-3200-16ch']);
});

test('search: dual / quad / octa channel and single channel names', () => {
  assert.deepEqual(ids('ddr5 6400 dual channel'), ['ddr5-6400-2ch']);
  assert.deepEqual(ids('ddr4 3200 quad channel'), ['ddr4-3200-4ch']);
  assert.deepEqual(ids('quad-channel ddr4-3200'), ['ddr4-3200-4ch']);
  assert.deepEqual(ids('ddr5 6400 octa channel'), ['ddr5-6400-8ch']);
  assert.deepEqual(ids('ddr5 6400 single channel'), ['ddr5-6400']);
  assert.equal(ids('dual channel').filter((id) => /^ddr/.test(id)).length, 34);
  // Plain rate queries still list the 1-channel row first.
  assert.equal(ids('ddr5 6400')[0], 'ddr5-6400');
  assert.ok(ids('ddr5 6400').includes('ddr5-6400-16ch'));
});

test('search: channel phrasing does not disturb other families', () => {
  assert.ok(ids('thunderbolt 2 channels').includes('tb2'));
  assert.ok(ids('pcie4x4').includes('pcie4-x4'));
  assert.ok(!ids('ddr5 6400 8 channels').some((id) => id.startsWith('lpddr')));
});
