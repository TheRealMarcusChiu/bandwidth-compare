// User-supplied, unverified transceiver form-factor rates in the comparator catalog.
// The 18 non-MSA guide rows (js/form-factors.js) that give an explicit numeric rate are
// comparator entries, compared exactly as supplied. DSFP and the seven legacy names give
// no rate, so they stay guide-only. The six OSFP MSA rows (tests/unit/osfp.test.mjs)
// remain the only source-verified transceiver entries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INTERFACES, BY_ID, SOURCES, STATUSES, STATUS_SHORT, VERIFICATION } from '../../js/data.js';
import { FORM_FACTORS } from '../../js/form-factors.js';
import { buildIndex, search } from '../../js/compare.js';
import { viewOf } from '../../js/mode.js';

const get = (id) => {
  const i = BY_ID.get(id);
  assert.ok(i, `missing interface ${id}`);
  return i;
};
const idx = buildIndex(INTERFACES);
const ids = (q) => search(idx, q).map((i) => i.id);
const read = (p) => readFile(new URL(`../../${p}`, import.meta.url), 'utf8');

// [id, family, guide row name, Gb/s as supplied, lane mapping as supplied in the guide or null]
export const USER_ROWS = [
  ['sfp-1g', 'SFP', 'SFP', 1, null],
  ['sfp-plus-10g', 'SFP', 'SFP+', 10, null],
  ['sfp28-25g', 'SFP', 'SFP28', 25, null],
  ['sfp56-50g', 'SFP', 'SFP56', 50, null],
  ['sfp112-100g', 'SFP', 'SFP112', 100, null],
  ['sfp224-200g', 'SFP', 'SFP224', 200, null],
  ['sfp-dd56-100g', 'SFP-DD', 'SFP-DD56', 100, [2, 50]],
  ['sfp-dd112-200g', 'SFP-DD', 'SFP-DD112', 200, [2, 100]],
  ['qsfp-4g', 'QSFP', 'QSFP', 4, null],
  ['qsfp-plus-40g', 'QSFP', 'QSFP+', 40, null],
  ['qsfp28-100g', 'QSFP', 'QSFP28', 100, null],
  ['qsfp56-200g', 'QSFP', 'QSFP56', 200, null],
  ['qsfp112-400g', 'QSFP', 'QSFP112', 400, null],
  ['qsfp224-800g', 'QSFP', 'QSFP224 / QSFP800', 800, [4, 200]],
  ['qsfp-dd-200g', 'QSFP-DD', 'QSFP-DD (200G)', 200, null],
  ['qsfp-dd-400g', 'QSFP-DD', 'QSFP-DD (400G)', 400, null],
  ['qsfp-dd-800g', 'QSFP-DD', 'QSFP-DD800', 800, null],
  ['qsfp-dd-1600g', 'QSFP-DD', 'QSFP-DD1600', 1600, null],
];
const USER_IDS = USER_ROWS.map(([id]) => id);
const OSFP_IDS = ['osfp-400g', 'osfp-800g', 'osfp-1-6t', 'osfp-xd-800g', 'osfp-xd-1-6t', 'osfp-xd-3-2t'];
const RATELESS = ['DSFP', 'XFP', 'XENPAK / X2', 'CFP', 'CFP2', 'CFP4', 'CPAK', 'CXP'];

const EXPECTED_NAMES = [
  'SFP module (1 Gb/s, user-supplied)',
  'SFP+ module (10 Gb/s, user-supplied)',
  'SFP28 module (25 Gb/s, user-supplied)',
  'SFP56 module (50 Gb/s, user-supplied)',
  'SFP112 module (100 Gb/s, user-supplied)',
  'SFP224 module (200 Gb/s, developing, user-supplied)',
  'SFP-DD56 module (100 Gb/s, user-supplied)',
  'SFP-DD112 module (200 Gb/s, user-supplied)',
  'QSFP module (4 Gb/s, user-supplied)',
  'QSFP+ module (40 Gb/s, user-supplied)',
  'QSFP28 module (100 Gb/s, user-supplied)',
  'QSFP56 module (200 Gb/s, user-supplied)',
  'QSFP112 module (400 Gb/s, user-supplied)',
  'QSFP224 / QSFP800 module (800 Gb/s, user-supplied)',
  'QSFP-DD module (200 Gb/s, user-supplied)',
  'QSFP-DD module (400 Gb/s, user-supplied)',
  'QSFP-DD800 module (800 Gb/s, user-supplied)',
  'QSFP-DD1600 module (1.6 Tb/s, user-supplied)',
];

// ------------------------------------------------------------ rows, rates, conversions

test('18 user-supplied transceiver entries: exact ids, families, rates and Gb/s ÷ 8 conversions', () => {
  assert.equal(USER_ROWS.length, 18);
  for (const [id, family, , gbps] of USER_ROWS) {
    const i = get(id);
    assert.equal(i.family, family, id);
    assert.equal(i.category, 'network', id);
    assert.equal(i.basis, 'advertised-link', id);
    assert.equal(i.Gbps, gbps, id);
    assert.equal(i.GBps, gbps / 8, `${id}: exact Gb/s ÷ 8`);
    assert.equal(i.bitsPerSecond, gbps * 1e9, id);
    assert.deepEqual(i.efficiency, [1, 1], `${id}: no coding or overhead factor inferred`);
    assert.equal(i.encoding, undefined, `${id}: no line code claimed`);
    assert.equal(i.perLane, null, `${id}: no per-lane rate claimed`);
    assert.equal(i.connectorOf, undefined, id);
    assert.equal(i.asymmetric, null, id);
    assert.equal(i.formula, `${gbps} Gb/s nominal rate as supplied ÷ 8`, id);
    assert.ok(Object.isFrozen(i), id);
  }
  // Exact conversions spelled out, including the unusual QSFP 4G figure, kept as supplied.
  const GB = Object.fromEntries(USER_IDS.map((id) => [id, get(id).GBps]));
  assert.deepEqual(GB, {
    'sfp-1g': 0.125, 'sfp-plus-10g': 1.25, 'sfp28-25g': 3.125, 'sfp56-50g': 6.25, 'sfp112-100g': 12.5,
    'sfp224-200g': 25, 'sfp-dd56-100g': 12.5, 'sfp-dd112-200g': 25,
    'qsfp-4g': 0.5, 'qsfp-plus-40g': 5, 'qsfp28-100g': 12.5, 'qsfp56-200g': 25, 'qsfp112-400g': 50, 'qsfp224-800g': 100,
    'qsfp-dd-200g': 25, 'qsfp-dd-400g': 50, 'qsfp-dd-800g': 100, 'qsfp-dd-1600g': 200,
  });
  assert.equal(get('qsfp-4g').Gbps, 4, 'QSFP 4G is not "corrected"');
  assert.deepEqual(USER_IDS.map((id) => get(id).name), EXPECTED_NAMES);
});

test('each entry matches its guide row: same name and the same supplied rate', () => {
  const toGbps = (rate) => (rate.endsWith('T') ? Number(rate.slice(0, -1)) * 1000 : Number(rate.slice(0, -1)));
  for (const [id, , name, gbps] of USER_ROWS) {
    const row = FORM_FACTORS.find((f) => f.name === name);
    assert.ok(row, `guide row ${name}`);
    assert.notEqual(row.status, 'msa-verified', name);
    assert.equal(toGbps(row.rate), gbps, `${id} rate equals the guide's ${row.rate}`);
  }
  // Every non-MSA guide row with a rate is promoted, and nothing else.
  const numeric = FORM_FACTORS.filter((f) => f.status !== 'msa-verified' && f.rate !== null).map((f) => f.name);
  assert.deepEqual(numeric, USER_ROWS.map(([, , n]) => n));
  // Contiguous, after the OSFP rows, in guide order.
  const at = INTERFACES.findIndex((i) => i.id === 'sfp-1g');
  assert.deepEqual(INTERFACES.slice(at).map((i) => i.id), USER_IDS);
  assert.ok(INTERFACES.findIndex((i) => i.id === 'osfp-xd-3-2t') === at - 1);
});

// ------------------------------------------------------------ provenance and status

test('provenance: user-seed only, unverified, user-supplied status (SFP224 stays developing)', () => {
  for (const [id] of USER_ROWS) {
    const i = get(id);
    assert.deepEqual(i.sources, ['user-seed'], `${id}: no extra source citations`);
    assert.equal(i.verification, 'unverified', id);
    assert.equal(i.status, id === 'sfp224-200g' ? 'developing' : 'user-supplied', id);
  }
  assert.equal(STATUSES['user-supplied'], 'User-supplied form-factor rate (not independently verified)');
  assert.equal(STATUS_SHORT['user-supplied'], 'User-supplied');
  assert.equal(VERIFICATION.unverified, 'User-supplied, unverified');
  assert.equal(SOURCES['user-seed'].kind, 'user');
  // The new status is used by these rows only.
  assert.deepEqual(INTERFACES.filter((i) => i.status === 'user-supplied').map((i) => i.id), USER_IDS.filter((id) => id !== 'sfp224-200g'));
});

test('the six OSFP MSA entries remain the only source-verified transceiver entries', () => {
  const transceivers = INTERFACES.filter((i) => i.category === 'network' && i.family !== 'Ethernet');
  assert.deepEqual(transceivers.map((i) => i.id), [...OSFP_IDS, ...USER_IDS]);
  assert.deepEqual(transceivers.filter((i) => i.verification === 'sourced').map((i) => i.id), OSFP_IDS);
  assert.deepEqual(INTERFACES.filter((i) => i.sources.includes('osfp-msa')).map((i) => i.id), OSFP_IDS);
  for (const id of USER_IDS) assert.notEqual(get(id).status, 'connector', id);
});

test('notes: from the site owner’s guide, not verified, no PHY/payload/reach/medium/availability claim', () => {
  for (const [id] of USER_ROWS) {
    const n = get(id).notes;
    assert.match(n, /site owner’s transceiver form-factor guide/, id);
    assert.match(n, /not independently verified/, id);
    assert.match(n, /not a verified Ethernet PHY or standard/, id);
    assert.match(n, /not payload throughput/, id);
    assert.match(n, /no reach, medium or production-availability claim/, id);
    assert.match(n, /compared exactly as supplied/, id);
    assert.match(n, /No coding or overhead adjustment is inferred/, id);
    assert.doesNotMatch(n, /\bratified\b|IEEE|MSA (states|publishes)/, `${id}: no standards claim`);
  }
  const sfp224 = get('sfp224-200g');
  assert.match(sfp224.notes, /Developing generation: current production\/availability status not independently verified/);
  assert.match(sfp224.name, /developing/);
  assert.match(get('qsfp-4g').notes, /4 Gb\/s figure is reproduced exactly as supplied/);
});

test('lane mappings: only where the guide supplies one, visibly unverified; otherwise "not source-verified"', () => {
  for (const [id, , , , lanes] of USER_ROWS) {
    const i = get(id);
    if (lanes) {
      const [n, g] = lanes;
      assert.equal(i.width.count, n, id);
      assert.equal(i.width.label, `${n} × ${g}G lanes (unverified)`, id);
      assert.match(i.notes, new RegExp(`Lane mapping as supplied in the guide, unverified: ${n} × ${g}G electrical lanes\\.`), id);
    } else {
      assert.equal(i.width.count, 1, `${id}: one module, no lane count guessed`);
      assert.equal(i.width.label, 'Lane mapping not source-verified', id);
      assert.match(i.notes, /Lane mapping not source-verified\./, id);
      assert.doesNotMatch(`${i.name} ${i.formula} ${i.aliases.join(' ')}`, /\d\s*[×x]\s*\d/, `${id}: no lane split asserted`);
    }
  }
  assert.deepEqual(USER_ROWS.filter((r) => r[4]).map(([id]) => id), ['sfp-dd56-100g', 'sfp-dd112-200g', 'qsfp224-800g']);
});

test('display modes leave the nominal rate as supplied', () => {
  for (const id of USER_IDS) {
    for (const mode of ['raw', 'adjusted']) {
      const v = viewOf(get(id), mode);
      assert.equal(v.GBps, get(id).GBps, `${id} ${mode}`);
      assert.equal(v.basis, 'advertised-link', `${id} ${mode}`);
    }
  }
});

// ------------------------------------------------------------ search

test('search: numeric guide names find their entries', () => {
  // Substring search: "sfp28" is inside "qsfp28".
  assert.deepEqual(ids('sfp28'), ['sfp28-25g', 'qsfp28-100g']);
  assert.deepEqual(ids('qsfp28'), ['qsfp28-100g']);
  assert.deepEqual(ids('sfp-dd56'), ['sfp-dd56-100g']);
  assert.deepEqual(ids('SFP-DD112'), ['sfp-dd112-200g']);
  assert.deepEqual(ids('qsfp-dd1600'), ['qsfp-dd-1600g']);
  assert.deepEqual(ids('QSFP-DD800'), ['qsfp-dd-800g']);
  assert.deepEqual(ids('QSFP-DD (200G)'), ['qsfp-dd-200g']);
  assert.deepEqual(ids('QSFP-DD (400G)'), ['qsfp-dd-400g']);
  assert.deepEqual(ids('qsfp800'), ['qsfp224-800g']);
  assert.deepEqual(ids('QSFP224'), ['qsfp224-800g']);
  assert.deepEqual(ids('sfp224'), ['osfp-1-6t', 'sfp224-200g', 'qsfp224-800g']);
  assert.deepEqual(ids('sfp224 developing'), ['sfp224-200g']);
  assert.deepEqual(ids('qsfp+'), ids('qsfp'), '"+" is punctuation to the comparator search');
  assert.deepEqual(ids('qsfp-4g'), ['qsfp-4g']);
  assert.deepEqual(ids('sfp-1g'), ['sfp-1g']);
  assert.deepEqual(ids('qsfp-dd'), ['qsfp-dd-200g', 'qsfp-dd-400g', 'qsfp-dd-800g', 'qsfp-dd-1600g']);
  assert.deepEqual(ids('qsfp'), USER_IDS.filter((id) => id.startsWith('qsfp')));
  // "sfp" is a substring of qsfp and osfp, so it reaches every transceiver row.
  assert.deepEqual(ids('sfp'), [...OSFP_IDS, ...USER_IDS]);
  assert.deepEqual(ids('user-supplied'), USER_IDS);
  // Substring search: "sfp112" is inside "osfp112"/"qsfp112".
  assert.deepEqual(ids('sfp112'), ['osfp-800g', 'sfp112-100g', 'qsfp112-400g']);
  // OSFP-only and generic Ethernet searches are not displaced.
  assert.deepEqual(ids('osfp'), OSFP_IDS);
  assert.ok(ids('25gbe').every((id) => id.startsWith('eth-')));
});

test('search: DSFP and the legacy names still return no comparator entries', () => {
  for (const f of FORM_FACTORS.filter((x) => x.rate === null)) {
    assert.ok(RATELESS.includes(f.name), f.name);
  }
  assert.deepEqual(FORM_FACTORS.filter((x) => x.rate === null).map((f) => f.name), RATELESS);
  // "X2" (XENPAK / X2) is also every PCIe/USB x2 lane width, so it is not a form-factor probe.
  for (const q of [...RATELESS.flatMap((n) => [n, ...n.split(' / ')]).filter((n) => n !== 'X2'), 'dsfp']) {
    assert.deepEqual(ids(q), [], q);
  }
  const families = new Set(INTERFACES.map((i) => i.family.toLowerCase()));
  for (const n of RATELESS.flatMap((x) => x.toLowerCase().split(' / '))) {
    assert.ok(!families.has(n), n);
    for (const i of INTERFACES) assert.ok(!i.aliases.some((a) => a.toLowerCase() === n), `${i.id} aliases ${n}`);
  }
});

// ------------------------------------------------------------ docs and pages

test('docs and pages describe the unverified rows, the OSFP-only verification and the rate-less exclusions', async () => {
  for (const p of ['index.html', 'form-factors.html', 'README.md', 'js/form-factors.js', 'docs/transceiver-form-factors-audit.md']) {
    const text = (await read(p)).replace(/\s+/g, ' ');
    assert.match(text, /user-supplied/i, `${p} mentions the user-supplied rows`);
    assert.match(text, /unverified/i, p);
    assert.match(text, /\bDSFP\b[^.]*legacy[^.]*(no|without a) (numeric )?rate|no (numeric )?rate[^.]*\bDSFP\b/i, `${p} explains the DSFP/legacy exclusion`);
    assert.match(text, /OSFP[^.]*only (source-verified|verified|entries with a cited source)|only (source-verified|verified)[^.]*OSFP/i, `${p}: OSFP is the only verified subset`);
    assert.doesNotMatch(text, /catalog has 354|\b354 entries|brings? it to 354|still 348|other guide rows remain out|remaining guide rows remain out|other guide rows \([^)]*\) remain out/i, `${p} has no stale counts/claims`);
  }
  const doc = await read('docs/transceiver-form-factors-audit.md');
  for (const [id, , name, gbps] of USER_ROWS) {
    assert.ok(doc.includes(`\`${id}\``), `audit lists ${id}`);
    assert.ok(doc.includes(`| ${name} | ${gbps} |`), `audit row for ${name} with ${gbps} Gb/s`);
  }
  assert.match(doc, /354 to 372/);
  assert.match(doc, /\b30 rows\b/);
  const readme = await read('README.md');
  assert.match(readme, /372 entries/);
  assert.match(readme, /168 non-DDR rows/);
});
