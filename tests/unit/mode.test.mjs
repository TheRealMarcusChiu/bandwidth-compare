import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACES, BY_ID } from '../../js/data.js';
import { MODES, DEFAULT_MODE, modeSupport, viewOf } from '../../js/mode.js';

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing ${id}`);
  return i;
};
const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} ${a} ≠ ${b}`);

test('two modes, encoding-adjusted is the default', () => {
  assert.deepEqual(Object.keys(MODES).sort(), ['adjusted', 'raw']);
  assert.equal(DEFAULT_MODE, 'adjusted');
  assert.equal(MODES.adjusted.label, 'Encoding-adjusted');
  assert.equal(MODES.raw.label, 'Raw signaling');
});

test('PCIe 3.0 x4: adjusted 128/130, raw line rate', () => {
  const p = get('pcie3-x4');
  const adj = viewOf(p, 'adjusted');
  const raw = viewOf(p, 'raw');
  close(adj.GBps, (8 * 4 * 128) / 130 / 8);
  close(adj.Gbps, (8 * 4 * 128) / 130);
  assert.equal(adj.basis, 'encoding-adjusted');
  assert.equal(adj.formula, '8 GT/s × 4 lanes × 128/130 ÷ 8');
  close(raw.GBps, 4);
  close(raw.Gbps, 32);
  assert.equal(raw.basis, 'raw-signaling');
  assert.equal(raw.formula, '8 GT/s × 4 lanes ÷ 8 (raw, 128b/130b not subtracted)');
  // Width and lanes are untouched by the mode.
  assert.deepEqual(raw.width, p.width);
  assert.deepEqual(raw.perLane, p.perLane);
  assert.equal(modeSupport(p), 'reversible');
  assert.ok(adj.modeApplied && raw.modeApplied);
  assert.match(adj.modeNote, /128b\/130b line code subtracted/);
  assert.match(adj.modeNote, /not usable throughput/);
  assert.match(raw.modeNote, /128b\/130b line code not subtracted/);
});

test('SATA III: adjusted 8/10, raw 6 Gb/s', () => {
  const s = get('sata3');
  close(viewOf(s, 'adjusted').GBps, 0.6);
  close(viewOf(s, 'raw').GBps, 0.75);
  close(viewOf(s, 'raw').Gbps, 6);
  assert.equal(viewOf(s, 'raw').formula, '6 Gb/s ÷ 8 (raw, 8b/10b not subtracted)');
});

test('every encoding-adjusted entry reverses to its bitsPerSecond and back', () => {
  const adjusted = INTERFACES.filter((i) => i.basis === 'encoding-adjusted');
  // PCIe 1–5 (25), SATA (3), U.2/U.3/M.2 NVMe gen 3–5 (9), M.2 SATA, SD UHS-II/III (4), SD Express (4).
  assert.equal(adjusted.length, 25 + 3 + 9 + 1 + 4 + 4);
  for (const i of adjusted) {
    assert.equal(modeSupport(i), 'reversible', i.id);
    const raw = viewOf(i, 'raw');
    close(raw.GBps, i.bitsPerSecond / 8e9, i.id);
    close(raw.Gbps, i.bitsPerSecond / 1e9, i.id);
    assert.equal(raw.basis, 'raw-signaling', i.id);
    assert.ok(!raw.formula.includes(`× ${i.efficiency[0]}/${i.efficiency[1]}`), `${i.id}: factor removed from raw formula`);
    assert.match(raw.formula, /\(raw, .+ not subtracted\)$/, i.id);
    assert.equal(viewOf(i, 'adjusted').GBps, i.GBps, i.id);
    assert.equal(viewOf(i, 'adjusted').formula, i.formula, i.id);
    // Lane widths, channels and asymmetry are never touched.
    assert.deepEqual(raw.width, i.width, i.id);
    assert.equal(raw.asymmetric, i.asymmetric, i.id);
  }
});

test('memory is identical in both modes and keeps its basis', () => {
  const mem = INTERFACES.filter((i) => i.category === 'memory');
  assert.ok(mem.length > 100);
  for (const i of mem) {
    for (const mode of ['raw', 'adjusted']) {
      const v = viewOf(i, mode);
      assert.equal(v.GBps, i.GBps, i.id);
      assert.equal(v.Gbps, i.Gbps, i.id);
      assert.equal(v.basis, 'memory-theoretical', i.id);
      assert.equal(v.formula, i.formula, i.id);
      assert.equal(v.channels, i.channels, i.id);
      assert.deepEqual(v.width, i.width, i.id);
    }
    assert.equal(modeSupport(i), 'memory', i.id);
    assert.match(viewOf(i, 'raw').modeNote, /same in both modes/);
  }
  // Long DDR channel variant and HBM4E explicitly.
  close(viewOf(get('ddr5-9200-16ch'), 'raw').GBps, (9200 * 1024) / 8000);
  close(viewOf(get('hbm4e-samsung-max'), 'raw').GBps, 4096);
});

test('unsupported raw and advertised entries stay unchanged and say so honestly', () => {
  const fixed = INTERFACES.filter((i) => i.basis === 'raw-signaling' || i.basis === 'advertised-link');
  assert.ok(fixed.length > 40);
  for (const i of fixed) {
    assert.equal(modeSupport(i), 'fixed', i.id);
    for (const mode of ['raw', 'adjusted']) {
      const v = viewOf(i, mode);
      assert.equal(v.GBps, i.GBps, `${i.id} ${mode}`);
      assert.equal(v.basis, i.basis, `${i.id} ${mode}`);
      assert.equal(v.formula, i.formula, `${i.id} ${mode}`);
      assert.deepEqual(v.asymmetric, i.asymmetric, `${i.id} ${mode}`);
    }
    const adj = viewOf(i, 'adjusted');
    assert.equal(adj.modeApplied, false, i.id);
    const shown = i.basis === 'raw-signaling' ? 'Raw signaling' : 'Advertised link rate';
    assert.ok(adj.modeNote.startsWith(`Encoding adjustment unavailable; ${shown} shown.`), `${i.id}: ${adj.modeNote}`);
  }
  // Raw entries are already raw; advertised ones are not relabelled as raw.
  assert.equal(viewOf(get('dp21-uhbr20'), 'raw').modeApplied, true);
  const usb = viewOf(get('usb-5g'), 'raw');
  assert.equal(usb.modeApplied, false);
  assert.equal(usb.basis, 'advertised-link');
  assert.ok(usb.modeNote.startsWith('Raw signaling unavailable; Advertised link rate shown.'));
  // Ethernet / Thunderbolt / USB4 / 1-1 efficiency: no invented overhead in either mode.
  for (const id of ['eth-10g', 'tb5', 'usb4-40', 'sd-uhs1', 'hdmi21-frl', 'sas3']) {
    assert.equal(viewOf(get(id), 'adjusted').GBps, get(id).GBps, id);
    assert.doesNotMatch(viewOf(get(id), 'adjusted').modeNote, /line code subtracted/, id);
  }
});

test('PCIe 6.0+ stays raw: FLIT/FEC not subtracted, never called adjusted payload', () => {
  for (const id of ['pcie6-x16', 'pcie7-x4', 'pcie8-x16']) {
    const p = get(id);
    const adj = viewOf(p, 'adjusted');
    assert.equal(adj.GBps, p.GBps, id);
    assert.equal(adj.basis, 'raw-signaling', id);
    assert.equal(adj.modeApplied, false, id);
    assert.match(adj.modeNote, /^Encoding adjustment unavailable; Raw signaling shown\./, id);
    assert.match(adj.modeNote, /FLIT framing and FEC overhead are not subtracted/, id);
    assert.match(adj.modeNote, /not an adjusted payload rate/, id);
  }
});

test('views never mutate the frozen catalog, repeat toggles are stable', () => {
  const p = get('pcie4-x4');
  const before = JSON.stringify(p);
  let v;
  for (let k = 0; k < 6; k++) v = viewOf(p, k % 2 ? 'raw' : 'adjusted');
  assert.equal(JSON.stringify(p), before);
  assert.equal(v.GBps, 8); // last iteration: raw
  assert.ok(Object.isFrozen(v));
  assert.equal(viewOf(p, 'raw'), viewOf(p, 'raw'), 'cached view identity');
  close(viewOf(p, 'adjusted').GBps, 7.876923076923077);
  assert.equal(p.GBps, viewOf(p, 'adjusted').GBps);
  assert.equal(p.basis, 'encoding-adjusted');
});

test('unknown mode is treated as the default', () => {
  for (const m of ['bogus', 'toString', '__proto__', undefined]) assert.equal(viewOf(get('pcie4-x4'), m).GBps, get('pcie4-x4').GBps);
});

// ------------------------------------------------------------ comparison, sort, URL

import { compare, ratioSentence, sortItems, parseState, serializeState, valueIn } from '../../js/compare.js';
import { DEFAULT_A, DEFAULT_B } from '../../js/data.js';

const D = { a: DEFAULT_A, b: DEFAULT_B };
const pair = (a, b, mode) => [viewOf(get(a), mode), viewOf(get(b), mode)];

test('ratio and bars follow the mode', () => {
  const [aAdj, bAdj] = pair('pcie4-x4', 'sata3', 'adjusted');
  const adj = compare(aAdj, bAdj);
  close(adj.ratio, (16 * 4 * 128) / 130 / 8 / 0.6);
  close(adj.widthB, (0.6 / aAdj.GBps) * 100);
  const [aRaw, bRaw] = pair('pcie4-x4', 'sata3', 'raw');
  const raw = compare(aRaw, bRaw);
  close(raw.ratio, 8 / 0.75);
  close(raw.widthB, (0.75 / 8) * 100);
  assert.equal(raw.mixedBasis, false);
  assert.equal(ratioSentence(aRaw, bRaw, raw), 'PCIe 4.0 x4 lists 10.7× the figure of SATA III (6 Gb/s).');
  assert.equal(valueIn(bRaw, 'Gbps'), 6);
  // Memory vs PCIe: only the PCIe side moves.
  const [m, p] = pair('ddr5-6400', 'pcie3-x16', 'raw');
  close(compare(m, p).ratio, 51.2 / 16);
  close(compare(...pair('ddr5-6400', 'pcie3-x16', 'adjusted')).ratio, 51.2 / ((8 * 16 * 128) / 130 / 8));
  // PCIe 4.0 x4 raw vs DisplayPort UHBR20 (raw): same basis in raw mode, mixed in adjusted.
  assert.equal(compare(...pair('pcie4-x4', 'dp21-uhbr20', 'raw')).mixedBasis, false);
  assert.equal(compare(...pair('pcie4-x4', 'dp21-uhbr20', 'adjusted')).mixedBasis, true);
});

test('bandwidth sort uses the selected mode; inputs untouched', () => {
  const items = ['sd-uhs3-fd624', 'usb-5g'].map(get);
  const order = (mode, key) => sortItems(items.map((i) => viewOf(i, mode)), key).map((i) => i.id);
  // 0.624 GB/s adjusted < USB 5Gbps 0.625 advertised < 0.78 GB/s raw.
  assert.deepEqual(order('adjusted', 'bandwidth-desc'), ['usb-5g', 'sd-uhs3-fd624']);
  assert.deepEqual(order('raw', 'bandwidth-desc'), ['sd-uhs3-fd624', 'usb-5g']);
  assert.deepEqual(order('raw', 'bandwidth-asc'), ['usb-5g', 'sd-uhs3-fd624']);
  assert.deepEqual(items.map((i) => i.id), ['sd-uhs3-fd624', 'usb-5g']);
});

test('URL mode: m=raw, default omitted, legacy and malformed links', () => {
  assert.equal(parseState('', BY_ID, D).mode, 'adjusted');
  assert.equal(parseState('?a=pcie3-x4&b=sata3', BY_ID, D).mode, 'adjusted');
  assert.deepEqual(parseState('?a=pcie3-x4&b=sata3&m=raw', BY_ID, D), { a: 'pcie3-x4', b: 'sata3', unit: 'GBps', mode: 'raw', errors: [] });
  assert.equal(parseState('?m=adjusted', BY_ID, D).mode, 'adjusted');
  assert.equal(parseState('?m=RAW', BY_ID, D).mode, 'raw');
  for (const bad of ['enc', '1', '%3Cscript%3E', 'raw%20signaling', 'x'.repeat(200)]) {
    const s = parseState(`?a=hbm3&m=${bad}`, BY_ID, D);
    assert.equal(s.mode, 'adjusted', bad);
    assert.equal(s.a, 'hbm3', bad);
    assert.deepEqual(s.errors.map((e) => e.key), ['m'], bad);
    assert.ok(s.errors[0].value.length <= 16, bad);
  }
  assert.equal(parseState('?m=', BY_ID, D).errors.length, 0);
  assert.equal(serializeState({ a: 'pcie3-x4', b: 'sata3', unit: 'GBps', mode: 'adjusted' }), '?a=pcie3-x4&b=sata3');
  assert.equal(serializeState({ a: 'pcie3-x4', b: 'sata3', unit: 'Gbps', mode: 'raw' }), '?a=pcie3-x4&b=sata3&u=Gbps&m=raw');
  assert.equal(serializeState({ a: 'pcie3-x4', b: 'sata3', unit: 'GBps' }), '?a=pcie3-x4&b=sata3');
  for (const s of [{ a: 'sata3', b: 'pcie3-x4', unit: 'Gbps', mode: 'raw' }, { a: 'hbm3', b: 'sata3', unit: 'GBps', mode: 'adjusted' }]) {
    const back = parseState(serializeState(s), BY_ID, D);
    assert.deepEqual({ a: back.a, b: back.b, unit: back.unit, mode: back.mode }, s);
  }
});
