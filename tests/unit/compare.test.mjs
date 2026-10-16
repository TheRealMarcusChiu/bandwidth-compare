import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACES, BY_ID, DEFAULT_A, DEFAULT_B } from '../../js/data.js';
import {
  compare, formatValue, formatRatio, humanScale, parseState, serializeState, buildIndex, search, valueIn, ratioSentence, ratioShort,
} from '../../js/compare.js';

const g = (id) => BY_ID.get(id);
const D = { a: DEFAULT_A, b: DEFAULT_B };

test('default comparison: PCIe 4.0 x4 vs SATA III', () => {
  const c = compare(g('pcie4-x4'), g('sata3'));
  assert.equal(c.faster, 'a');
  assert.ok(Math.abs(c.ratio - 13.128205128205128) < 1e-12);
  assert.equal(formatRatio(c.ratio), '13.1×');
  assert.equal(c.widthA, 100);
  assert.ok(Math.abs(c.widthB - (0.6 / 7.876923076923077) * 100) < 1e-9);
  assert.equal(c.mixedBasis, false); // both encoding-adjusted
  assert.equal(c.same, false);
});

test('ratio is symmetric under swap; widths swap', () => {
  const ab = compare(g('ddr5-6400'), g('usb2'));
  const ba = compare(g('usb2'), g('ddr5-6400'));
  assert.equal(ab.ratio, ba.ratio);
  assert.equal(ab.widthA, ba.widthB);
  assert.equal(ab.faster, 'a');
  assert.equal(ba.faster, 'b');
});

test('identical selection', () => {
  const c = compare(g('sata3'), g('sata3'));
  assert.equal(c.same, true);
  assert.equal(c.ratio, 1);
  assert.equal(c.faster, 'equal');
  assert.equal(c.widthA, 100);
  assert.equal(c.widthB, 100);
  assert.match(ratioSentence(g('sata3'), g('sata3'), c), /Same interface/);
});

test('equal values on different interfaces', () => {
  const c = compare(g('tb3'), g('tb4'));
  assert.equal(c.same, false);
  assert.equal(c.equalValue, true);
  assert.equal(c.faster, 'equal');
});

test('extreme difference keeps exact proportional widths (no minimum)', () => {
  const c = compare(g('hbm4-samsung-max'), g('usb1-low'));
  assert.equal(c.ratio, 3328 / 0.0001875);
  assert.ok(c.widthB > 0 && c.widthB < 1e-5);
  assert.equal(c.widthB, (0.0001875 / 3328) * 100);
  assert.equal(formatRatio(c.ratio), '17,749,333×');
});

test('mixed basis detection', () => {
  assert.equal(compare(g('pcie6-x4'), g('pcie5-x4')).mixedBasis, true);
  assert.equal(compare(g('ddr4-3200'), g('usb4-40')).mixedBasis, true);
  assert.equal(compare(g('sas3'), g('sata3')).mixedBasis, true);
  assert.equal(compare(g('hbm3'), g('gddr6')).mixedBasis, false);
});

test('unverified and asymmetric flags', () => {
  assert.equal(compare(g('ddr5-9200'), g('sata3')).anyUnverified, true);
  assert.equal(compare(g('ddr5-6400'), g('sata3')).anyUnverified, false);
  assert.equal(compare(g('tb5-boost'), g('tb5')).anyAsymmetric, true);
});

test('ratio sentence never mentions real throughput', () => {
  const s = ratioSentence(g('pcie4-x4'), g('sata3'), compare(g('pcie4-x4'), g('sata3')));
  assert.equal(s, 'PCIe 4.0 x4 lists 13.1× the figure of SATA III (6 Gb/s).');
  assert.doesNotMatch(s, /faster in practice|real|actual/i);
});

test('number formatting', () => {
  assert.equal(formatValue(3328), '3,328');
  assert.equal(formatValue(2995.2), '2,995.2');
  assert.equal(formatValue(819.2), '819.2');
  assert.equal(formatValue(7.876923076923077), '7.877');
  assert.equal(formatValue(0.6), '0.6');
  assert.equal(formatValue(0.0001875), '0.0001875');
  assert.equal(formatValue(25.6), '25.6');
  assert.equal(formatRatio(1.25), '1.25×');
  assert.equal(formatRatio(2), '2×');
  assert.equal(formatRatio(125.56), '125.6×');
});

test('units', () => {
  assert.equal(valueIn(g('sata3'), 'GBps'), 0.6);
  assert.equal(valueIn(g('sata3'), 'Gbps'), 4.8); // post-8b/10b bits, not the 6 Gb/s line rate
  assert.equal(valueIn(g('usb4-40'), 'Gbps'), 40);
  assert.equal(humanScale(0.0001875), '187.5 kB/s');
  assert.equal(humanScale(0.06), '60 MB/s');
  assert.equal(humanScale(5), null);
});

test('URL state parsing', () => {
  assert.deepEqual(parseState('', BY_ID, D), { a: 'pcie4-x4', b: 'sata3', unit: 'GBps', mode: 'adjusted', errors: [] });
  assert.deepEqual(parseState('?a=hbm3&b=ddr5-6400&u=Gbps', BY_ID, D), { a: 'hbm3', b: 'ddr5-6400', unit: 'Gbps', mode: 'adjusted', errors: [] });
  const bad = parseState('?a=nope&b=%3Cscript%3E&u=bogus', BY_ID, D);
  assert.equal(bad.a, 'pcie4-x4');
  assert.equal(bad.b, 'sata3');
  assert.equal(bad.unit, 'GBps');
  assert.deepEqual(bad.errors.map((e) => e.key), ['a', 'b', 'u']);
  assert.equal(parseState('?a=HBM3', BY_ID, D).a, 'hbm3'); // case-insensitive
  assert.equal(parseState('?a=' + 'x'.repeat(500), BY_ID, D).errors[0].value.length, 64);
});

test('URL state round trip', () => {
  for (const s of [{ a: 'hbm3', b: 'sata3', unit: 'GBps' }, { a: 'tb5-boost', b: 'usb4v2-120', unit: 'Gbps' }]) {
    const q = serializeState(s);
    const back = parseState(q, BY_ID, D);
    assert.deepEqual({ a: back.a, b: back.b, unit: back.unit }, s);
  }
  assert.equal(serializeState({ a: 'pcie4-x4', b: 'sata3', unit: 'GBps' }), '?a=pcie4-x4&b=sata3');
});

test('search', () => {
  const idx = buildIndex(INTERFACES);
  const ids = (q) => search(idx, q).map((i) => i.id);
  assert.equal(search(idx, '').length, INTERFACES.length);
  assert.ok(ids('pcie4x4').includes('pcie4-x4'));
  assert.ok(ids('pcie 4.0 x4').includes('pcie4-x4'));
  assert.ok(ids('gen4 x4').includes('pcie4-x4'));
  assert.ok(ids('sata 3').includes('sata3'));
  assert.ok(ids('u.2').includes('u2-nvme-pcie4-x4'));
  assert.ok(ids('ddr3l').includes('ddr3-1600'));
  assert.ok(ids('usb 3.2 gen 2x2').includes('usb32-gen2x2'));
  assert.ok(ids('hbm4').includes('hbm4-samsung-max'));
  assert.deepEqual(ids('zzzz-not-real'), []);
  // family groups stay contiguous
  const fams = search(idx, 'nvme').map((i) => i.family);
  const seen = new Set();
  let prev = null;
  for (const f of fams) {
    if (f !== prev) { assert.ok(!seen.has(f), `family ${f} split`); seen.add(f); prev = f; }
  }
});

test('compact ratio line names sides by letter, never by (possibly long) name', () => {
  const ab = compare(g('pcie4-x4'), g('sata3'));
  assert.equal(ratioShort(ab), 'A lists 13.1× the figure of B');
  assert.equal(ratioShort(compare(g('sata3'), g('pcie4-x4'))), 'B lists 13.1× the figure of A');
  assert.equal(ratioShort(compare(g('tb3'), g('tb4'))), 'A and B list the same figure');
  assert.equal(ratioShort(compare(g('sata3'), g('sata3'))), 'Same interface on both sides');
  const ext = ratioShort(compare(g('lpddr5x-10700'), g('usb1-low')));
  assert.match(ext, /^A lists [\d,]+× the figure of B$/);
  assert.doesNotMatch(ext, /LPDDR|USB/);
});
