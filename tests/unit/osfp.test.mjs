// OSFP / OSFP-XD module capacities in the comparator catalog.
// The form-factor guide rows marked `msa-verified` (js/form-factors.js) are promoted,
// one entry per MSA rate/lane mapping, and are the only source-verified transceiver
// entries. The other numeric guide rows are user-supplied, unverified entries
// (tests/unit/user-transceivers.test.mjs); DSFP and the legacy names have no rate and stay out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTERFACES, BY_ID, SOURCES, STATUSES, STATUS_SHORT } from '../../js/data.js';
import { FORM_FACTORS } from '../../js/form-factors.js';
import { buildIndex, search } from '../../js/compare.js';

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing interface ${id}`);
  return i;
};
const idx = buildIndex(INTERFACES);
const ids = (q) => search(idx, q).map((i) => i.id);

// [id, family, Gb/s, lanes, lane rate]: the OSFP MSA FAQ mappings.
export const OSFP_ROWS = [
  ['osfp-400g', 'OSFP', 400, 8, '50G'],
  ['osfp-800g', 'OSFP', 800, 8, '100G'],
  ['osfp-1-6t', 'OSFP', 1600, 8, '200G'],
  ['osfp-xd-800g', 'OSFP-XD', 800, 16, '50G'],
  ['osfp-xd-1-6t', 'OSFP-XD', 1600, 16, '100G'],
  ['osfp-xd-3-2t', 'OSFP-XD', 3200, 8, '200G'],
];
const OSFP_IDS = OSFP_ROWS.map(([id]) => id);

test('six OSFP MSA module-capacity entries: exact ids, rates and lane mappings', () => {
  for (const [id, family, gbps, lanes, lane] of OSFP_ROWS) {
    const i = get(id);
    assert.equal(i.family, family, id);
    assert.equal(i.category, 'network', id);
    assert.equal(i.basis, 'advertised-link', id);
    assert.equal(i.status, 'connector', id);
    assert.equal(i.verification, 'sourced', id);
    assert.deepEqual(i.sources, ['osfp-msa'], id);
    assert.equal(i.Gbps, gbps, id);
    assert.equal(i.GBps, gbps / 8, id);
    assert.equal(i.bitsPerSecond, gbps * 1e9, id);
    assert.deepEqual(i.efficiency, [1, 1], `${id}: no overhead factor invented`);
    assert.equal(i.width.count, lanes, id);
    assert.equal(i.width.label, `${lanes} × ${lane} lanes`, id);
    assert.ok(i.formula.includes(`${lanes} × ${lane}`), `${id} formula names the lane mapping`);
    assert.match(i.formula, /÷ 8$/, id);
    assert.equal(i.connectorOf, undefined, `${id} is not a mirror of another catalog row`);
    assert.ok(Object.isFrozen(i), id);
  }
  // Contiguous, after the generic Ethernet rows.
  const at = INTERFACES.findIndex((i) => i.id === 'osfp-400g');
  assert.deepEqual(INTERFACES.slice(at, at + 6).map((i) => i.id), OSFP_IDS);
  assert.ok(INTERFACES.findIndex((i) => i.id === 'eth-1600g') < at);
});

test('OSFP-XD 3.2T is 8×200G, never 16×200G', () => {
  const i = get('osfp-xd-3-2t');
  assert.equal(i.width.count, 8);
  assert.equal(i.width.label, '8 × 200G lanes');
  assert.equal(i.GBps, 400);
  assert.match(i.name, /8×200G/);
  assert.match(i.notes, /8 × 200G/);
  assert.match(i.notes, /not 16 × 200G/);
  for (const r of INTERFACES) {
    const text = [r.name, r.formula, r.width.label, ...r.aliases, r.notes.replace(/not 16 × 200G/g, '')].join(' | ');
    assert.doesNotMatch(text, /16\s*[×x]\s*200\s*G/i, r.id);
  }
});

test('unique descriptive names, OSFP aliases, and notes that say capacity, not payload', () => {
  const names = OSFP_IDS.map((id) => get(id).name);
  assert.equal(new Set(names).size, 6);
  assert.deepEqual(names, [
    'OSFP56 / OSFP400 module (400 Gb/s, 8×50G)',
    'OSFP112 / OSFP800 module (800 Gb/s, 8×100G)',
    'OSFP224 / OSFP1600 module (1.6 Tb/s, 8×200G)',
    'OSFP-XD module (800 Gb/s, 16×50G)',
    'OSFP-XD module (1.6 Tb/s, 16×100G)',
    'OSFP-XD module (3.2 Tb/s, 8×200G)',
  ]);
  for (const id of OSFP_IDS) {
    const i = get(id);
    assert.ok(i.aliases.includes('OSFP'), id);
    if (i.family === 'OSFP-XD') assert.ok(i.aliases.includes('OSFP-XD'), id);
    assert.match(i.notes, /OSFP MSA/, id);
    assert.match(i.notes, /aggregate module capacity/i, id);
    assert.match(i.notes, /form-factor/i, id);
    assert.match(i.notes, /not usable payload/i, id);
    // The MSA covers rate and lanes only: no PHY, medium, reach or availability claim.
    assert.match(i.notes, /does not specify the Ethernet PHY/i, id);
    assert.match(i.notes, /medium|reach/i, id);
    assert.match(i.notes, /production availability/i, id);
  }
  assert.equal(STATUSES.connector, 'Connector / form factor');
  assert.equal(STATUS_SHORT.connector, 'Connector');
});

test('OSFP 1.6T module capacity is distinct from the developing IEEE 1.6 Tb/s Ethernet row', () => {
  const eth = get('eth-1600g');
  assert.equal(eth.name, 'Ethernet 1.6 Tb/s (in development)');
  assert.equal(eth.status, 'developing');
  assert.equal(eth.verification, 'unverified');
  assert.deepEqual(eth.sources, ['user-seed', 'ieee-8023dj']);
  for (const id of ['osfp-1-6t', 'osfp-xd-1-6t']) {
    const i = get(id);
    assert.notEqual(i.status, eth.status);
    assert.match(i.notes, /IEEE/, `${id} points at the IEEE PHY status`);
    assert.doesNotMatch(i.notes, /ratified (1\.6|standard)|IEEE (has )?ratified/i, id);
  }
  // Generic IEEE rows untouched.
  const ieee = INTERFACES.filter((i) => i.family === 'Ethernet');
  assert.equal(ieee.length, 14);
  for (const i of ieee) assert.ok(!i.sources.includes('osfp-msa'), i.id);
});

test('SOURCES[osfp-msa] is the primary, official MSA site', () => {
  const s = SOURCES['osfp-msa'];
  assert.ok(s);
  assert.equal(s.url, 'https://www.osfpmsa.org/');
  assert.equal(s.kind, 'primary');
  assert.match(s.publisher, /^OSFP MSA\b/);
  assert.match(s.publisher, /Oct 18, 2026/);
  assert.match(s.title, /OSFP MSA/);
  assert.match(s.title, /FAQ/);
  assert.equal(INTERFACES.filter((i) => i.sources.includes('osfp-msa')).length, 6);
});

test('only the msa-verified guide rows are source-verified, connector-status entries; rate-less families stay out', () => {
  const verified = FORM_FACTORS.filter((f) => f.status === 'msa-verified');
  assert.deepEqual(verified.map((f) => f.name), ['OSFP56 / OSFP400', 'OSFP112 / OSFP800', 'OSFP224 / OSFP1600', 'OSFP-XD']);
  assert.deepEqual(INTERFACES.filter((i) => i.status === 'connector' && i.category === 'network').map((i) => i.id), OSFP_IDS);
  const transceivers = INTERFACES.filter((i) => i.category === 'network' && i.family !== 'Ethernet');
  assert.deepEqual(transceivers.filter((i) => i.verification === 'sourced').map((i) => i.id), OSFP_IDS);
  for (const i of transceivers.filter((x) => !OSFP_IDS.includes(x.id))) {
    assert.equal(i.verification, 'unverified', i.id);
    assert.deepEqual(i.sources, ['user-seed'], i.id);
  }
  const families = new Set(INTERFACES.map((i) => i.family.toLowerCase()));
  for (const f of FORM_FACTORS.filter((x) => x.rate === null)) {
    for (const n of f.name.toLowerCase().split(' / ')) {
      assert.ok(!families.has(n), `${f.name} is not a comparator family`);
      for (const i of INTERFACES) assert.ok(!i.aliases.some((a) => a.toLowerCase() === n), `${i.id} aliases rate-less ${n}`);
    }
  }
});

test('search: OSFP names find only the six verified entries', () => {
  assert.deepEqual(ids('osfp'), OSFP_IDS);
  assert.deepEqual(ids('OSFP-XD'), ['osfp-xd-800g', 'osfp-xd-1-6t', 'osfp-xd-3-2t']);
  assert.deepEqual(ids('osfp xd 3.2t'), ['osfp-xd-3-2t']);
  assert.deepEqual(ids('osfp-xd 8x200g'), ['osfp-xd-3-2t']);
  assert.deepEqual(ids('osfp800'), ['osfp-800g']);
  assert.deepEqual(ids('OSFP400'), ['osfp-400g']);
  assert.deepEqual(ids('osfp1600'), ['osfp-1-6t']);
  assert.deepEqual(ids('osfp 1.6t'), ['osfp-1-6t', 'osfp-xd-1-6t']);
  assert.deepEqual(ids('osfp msa'), OSFP_IDS);
  // Generic Ethernet searches are not displaced.
  assert.ok(ids('1.6tbe').includes('eth-1600g'));
  assert.ok(!ids('1.6tbe').some((id) => id.startsWith('osfp')));
});

test('search: OSFP queries are not answered by the unverified rows; rate-less families never surface', () => {
  for (const q of ['osfp', 'OSFP-XD', 'osfp msa', 'osfp800', 'osfp 1.6t']) {
    assert.ok(ids(q).every((id) => OSFP_IDS.includes(id)), q);
  }
  for (const f of FORM_FACTORS.filter((x) => x.rate === null)) {
    // "X2" (XENPAK / X2) is also every PCIe/USB x2 lane width, so it is not a form-factor probe.
    for (const q of [f.name, ...f.name.split(' / ')].filter((n) => n !== 'X2')) assert.deepEqual(ids(q), [], q);
  }
  for (const q of ['dsfp', 'xfp', 'cfp2', 'cxp', 'xenpak']) assert.deepEqual(ids(q), [], q);
});

test('docs and pages: the MSA-verified OSFP subset is the only source-verified part of the comparator', async () => {
  const { readFile } = await import('node:fs/promises');
  const read = (p) => readFile(new URL(`../../${p}`, import.meta.url), 'utf8');
  const files = ['index.html', 'form-factors.html', 'README.md', 'js/form-factors.js', 'docs/transceiver-form-factors-audit.md'];
  for (const p of files) {
    const text = (await read(p)).replace(/\s+/g, ' ');
    assert.match(text, /MSA-verified OSFP/i, `${p} names the OSFP subset`);
    // No blanket "none of the guide is selectable" claims survive.
    assert.doesNotMatch(text, /none of these rows are in `INTERFACES`|nothing was added to `INTERFACES`|nothing here is\s+comparable, selectable|outside this catalog\.|still 348|numbers are never compared|Only the MSA-verified OSFP subset is in the comparator/i, p);
  }
  const doc = await read('docs/transceiver-form-factors-audit.md');
  for (const id of OSFP_IDS) assert.ok(doc.includes(`\`${id}\``), `audit lists ${id}`);
  assert.match(doc, /348 to 354/);
  assert.match(doc, /372/);
  assert.match(doc, /IEEE/);
  const readme = await read('README.md');
  assert.match(readme, /372/);
  assert.doesNotMatch(readme, /\b(348|354) (rows|interfaces|entries)\b/);
});
