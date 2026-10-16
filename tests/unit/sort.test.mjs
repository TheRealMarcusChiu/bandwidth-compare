import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACES, BY_ID } from '../../js/data.js';
import { SORTS, DEFAULT_SORT, sortItems, buildIndex, search, valueIn } from '../../js/compare.js';

const ids = (items) => items.map((i) => i.id);
const fx = (id, name, family, GBps) => Object.freeze({ id, name, family, GBps, Gbps: GBps * 8 });

test('sort options: original first, all seven keys, labelled', () => {
  assert.equal(DEFAULT_SORT, 'original');
  assert.deepEqual(Object.keys(SORTS), [
    'original', 'bandwidth-desc', 'bandwidth-asc', 'name-asc', 'name-desc', 'family-asc', 'family-desc',
  ]);
  for (const label of Object.values(SORTS)) assert.equal(typeof label, 'string');
});

test('original order returns a copy in catalog order', () => {
  const out = sortItems(INTERFACES, 'original');
  assert.deepEqual(ids(out), ids(INTERFACES));
  assert.notEqual(out, INTERFACES);
});

test('unknown sort key falls back to original order', () => {
  assert.deepEqual(ids(sortItems(INTERFACES, 'bogus')), ids(INTERFACES));
});

test('never mutates the base catalog or the input array', () => {
  const before = ids(INTERFACES);
  const input = [...INTERFACES];
  for (const key of Object.keys(SORTS)) {
    const out = sortItems(input, key);
    assert.notEqual(out, input, key);
    assert.equal(out.length, input.length, key);
  }
  assert.deepEqual(ids(input), before);
  assert.deepEqual(ids(INTERFACES), before);
  assert.ok(Object.isFrozen(INTERFACES));
});

test('bandwidth highest first is monotonic on underlying GB/s', () => {
  const out = sortItems(INTERFACES, 'bandwidth-desc');
  for (let k = 1; k < out.length; k++) assert.ok(out[k - 1].GBps >= out[k].GBps, `${out[k - 1].id} before ${out[k].id}`);
  assert.equal(out[0].id, 'hbm4-samsung-max');
  assert.equal(out.at(-1).id, 'usb1-low');
});

test('bandwidth lowest first is monotonic on underlying GB/s', () => {
  const out = sortItems(INTERFACES, 'bandwidth-asc');
  for (let k = 1; k < out.length; k++) assert.ok(out[k - 1].GBps <= out[k].GBps, `${out[k - 1].id} before ${out[k].id}`);
  assert.equal(out[0].id, 'usb1-low');
  assert.equal(out.at(-1).id, 'hbm4-samsung-max');
});

test('bandwidth is numeric, not formatted-string order', () => {
  // As strings "1,177.6" < "819.2" < "9"; numerically 9 < 819.2 < 1177.6.
  const items = [fx('x', 'X', 'F', 819.2), fx('y', 'Y', 'F', 1177.6), fx('z', 'Z', 'F', 9)];
  assert.deepEqual(ids(sortItems(items, 'bandwidth-asc')), ['z', 'x', 'y']);
  assert.deepEqual(ids(sortItems(items, 'bandwidth-desc')), ['y', 'x', 'z']);
});

test('bandwidth order is identical in both units', () => {
  for (const key of ['bandwidth-desc', 'bandwidth-asc']) {
    const out = sortItems(INTERFACES, key);
    const sign = key === 'bandwidth-desc' ? -1 : 1;
    for (const unit of ['GBps', 'Gbps']) {
      for (let k = 1; k < out.length; k++) {
        assert.ok(sign * (valueIn(out[k], unit) - valueIn(out[k - 1], unit)) >= 0, `${key} ${unit} at ${k}`);
      }
    }
  }
});

test('bandwidth ties break by natural name A–Z in both directions', () => {
  const items = [fx('b10', 'Link 10', 'F', 5), fx('b9', 'Link 9', 'F', 5), fx('big', 'Big', 'F', 50), fx('b2', 'link 2', 'F', 5)];
  assert.deepEqual(ids(sortItems(items, 'bandwidth-desc')), ['big', 'b2', 'b9', 'b10']);
  assert.deepEqual(ids(sortItems(items, 'bandwidth-asc')), ['b2', 'b9', 'b10', 'big']);
  // Real tie: Thunderbolt 3 and 4 are both 5 GB/s.
  const real = ids(sortItems(INTERFACES, 'bandwidth-desc'));
  assert.ok(real.indexOf('tb3') < real.indexOf('tb4'));
  const realAsc = ids(sortItems(INTERFACES, 'bandwidth-asc'));
  assert.ok(realAsc.indexOf('tb3') < realAsc.indexOf('tb4'));
});

test('name sorts are natural and case-insensitive', () => {
  const items = [fx('a', 'PCIe 4.0 x16', 'P', 1), fx('b', 'PCIe 4.0 x4', 'P', 1), fx('c', 'pcie 4.0 x8', 'P', 1), fx('d', 'DDR5-10400', 'D', 1), fx('e', 'DDR5-9200', 'D', 1)];
  assert.deepEqual(ids(sortItems(items, 'name-asc')), ['e', 'd', 'b', 'c', 'a']);
  assert.deepEqual(ids(sortItems(items, 'name-desc')), ['a', 'c', 'b', 'd', 'e']);
});

test('name sorts are exact reverses on the real catalog (names are unique)', () => {
  const asc = ids(sortItems(INTERFACES, 'name-asc'));
  assert.deepEqual(ids(sortItems(INTERFACES, 'name-desc')), [...asc].reverse());
});

test('family sorts group families; ties break by natural name A–Z', () => {
  const items = [
    fx('u10', 'USB 10', 'USB', 1), fx('d2', 'DDR 2', 'DDR', 1), fx('u9', 'USB 9', 'USB', 1),
    fx('d10', 'DDR 10', 'DDR', 1), fx('h', 'HBM', 'HBM', 1),
  ];
  assert.deepEqual(ids(sortItems(items, 'family-asc')), ['d2', 'd10', 'h', 'u9', 'u10']);
  assert.deepEqual(ids(sortItems(items, 'family-desc')), ['u9', 'u10', 'h', 'd2', 'd10']);
  for (const key of ['family-asc', 'family-desc']) {
    const fams = sortItems(INTERFACES, key).map((i) => i.family);
    const seen = new Set();
    let prev = null;
    for (const f of fams) {
      if (f !== prev) { assert.ok(!seen.has(f), `${key}: family ${f} split`); seen.add(f); prev = f; }
    }
  }
});

test('sorting is deterministic regardless of input order', () => {
  const shuffled = [...INTERFACES].reverse();
  for (const key of Object.keys(SORTS).filter((k) => k !== 'original')) {
    assert.deepEqual(ids(sortItems(shuffled, key)), ids(sortItems(INTERFACES, key)), key);
  }
});

test('sorting combines with search: same set, sorted order', () => {
  const idx = buildIndex(INTERFACES);
  const hits = search(idx, 'pcie x16');
  assert.ok(hits.length > 3);
  const out = sortItems(hits, 'bandwidth-desc');
  assert.deepEqual(new Set(ids(out)), new Set(ids(hits)));
  assert.equal(out[0].id, 'pcie7-x16');
  for (let k = 1; k < out.length; k++) assert.ok(out[k - 1].GBps >= out[k].GBps);
  // PCIe 3.0 x16 and 4.0 x8 tie on 15.75 GB/s, but x8 isn't in this result set; search stays intact.
  assert.ok(out.every((i) => /x16/.test(i.width.label) || /x16/i.test(i.name)));
  assert.equal(BY_ID.get('pcie7-x16').GBps, 256);
});
