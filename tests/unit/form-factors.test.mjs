// Ethernet transceiver form-factor guide (docs/transceiver-form-factors-audit.md).
// The guide is separate from the bandwidth catalog: a form factor is not a link rate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  FORM_FACTORS, FF_GROUPS, FF_COLUMNS, FF_SOURCES, FF_STATUS, NOT_VERIFIED, AUDIT_DATE,
  cellText, filterFormFactors,
} from '../../js/form-factors.js';
import { INTERFACES } from '../../js/data.js';
import { buildIndex, search } from '../../js/compare.js';

const root = new URL('../../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const get = (name) => {
  const r = FORM_FACTORS.find((f) => f.name === name);
  assert.ok(r, `missing form factor ${name}`);
  return r;
};
const names = (q) => filterFormFactors(FORM_FACTORS, q).map((f) => f.name);
const allText = (r) => FF_COLUMNS.map((c) => cellText(r, c.key)).join(' | ');

const EXPECTED = {
  sfp: ['SFP', 'SFP+', 'SFP28', 'SFP56', 'SFP112', 'SFP224'],
  'sfp-dd': ['SFP-DD56', 'SFP-DD112', 'DSFP'],
  qsfp: ['QSFP', 'QSFP+', 'QSFP28', 'QSFP56', 'QSFP112', 'QSFP224 / QSFP800'],
  'qsfp-dd': ['QSFP-DD (200G)', 'QSFP-DD (400G)', 'QSFP-DD800', 'QSFP-DD1600'],
  osfp: ['OSFP56 / OSFP400', 'OSFP112 / OSFP800', 'OSFP224 / OSFP1600', 'OSFP-XD'],
  legacy: ['XFP', 'XENPAK / X2', 'CFP', 'CFP2', 'CFP4', 'CPAK', 'CXP'],
};
const TOTAL = Object.values(EXPECTED).flat().length;

// ------------------------------------------------------------ shape

test('six columns in the agreed order', () => {
  assert.deepEqual(FF_COLUMNS.map((c) => c.label), [
    'Form factor', 'Ethernet data rate', 'Fiber/medium', 'Representative reach', 'Module-dependent details', 'Typical connector',
  ]);
});

test('exact rows and group counts, in order', () => {
  assert.deepEqual(Object.keys(FF_GROUPS), Object.keys(EXPECTED));
  for (const [g, list] of Object.entries(EXPECTED)) {
    assert.deepEqual(FORM_FACTORS.filter((f) => f.group === g).map((f) => f.name), list, g);
  }
  assert.equal(FORM_FACTORS.length, TOTAL);
  assert.equal(TOTAL, 30);
  assert.equal(new Set(FORM_FACTORS.map((f) => f.id)).size, TOTAL, 'unique ids');
  assert.ok(Object.isFrozen(FORM_FACTORS) && FORM_FACTORS.every(Object.isFrozen));
});

test('every cell is filled: a value or the conspicuous not-verified note, never blank or invented', () => {
  assert.match(NOT_VERIFIED, /Not source-verified in this update; consult the exact/);
  for (const r of FORM_FACTORS) {
    assert.ok(FF_STATUS[r.status], `${r.name}: status`);
    assert.ok(r.sources.length && r.sources.every((s) => FF_SOURCES[s]), `${r.name}: sources`);
    for (const c of FF_COLUMNS) {
      const t = cellText(r, c.key);
      assert.ok(t && t.trim() && t.trim() !== '-', `${r.name}: ${c.key} empty`);
    }
  }
});

// ------------------------------------------------------------ supplied examples

test('SFP family carries the supplied media, reach and connectors, labelled unverified', () => {
  const sfp = get('SFP');
  assert.equal(sfp.rate, '1G');
  assert.match(sfp.reach, /MMF 550 m/);
  assert.match(sfp.reach, /SMF 10–80 km \(specialty longer\)/);
  assert.match(sfp.reach, /copper 100 m/);
  assert.match(sfp.connector, /Duplex LC/);
  assert.match(sfp.connector, /simplex LC \(BiDi\)/);
  assert.match(sfp.connector, /RJ45/);
  const plus = get('SFP+');
  assert.equal(plus.rate, '10G');
  assert.match(plus.reach, /300 m OM3 \/ 400 m OM4/);
  assert.match(plus.reach, /10\/40\/80 km \(specialty 120 km\)/);
  assert.match(plus.reach, /RJ45 commonly 30–100 m/);
  const s28 = get('SFP28');
  assert.equal(s28.rate, '25G');
  assert.match(s28.reach, /70 m OM3 \/ 100 m OM4/);
  assert.match(s28.reach, /10\/25\/40 km/);
  assert.equal(get('SFP56').rate, '50G');
  assert.match(get('SFP56').reach, /MMF 70–100 m; SMF 10–40 km/);
  assert.equal(get('SFP112').rate, '100G');
  assert.match(get('SFP112').reach, /500 m \/ 2 km \/ 10 km/);
  for (const n of ['SFP', 'SFP+', 'SFP28', 'SFP56', 'SFP112']) {
    const r = get(n);
    assert.equal(r.status, 'user-supplied', n);
    assert.ok(r.sources.includes('user-note'), n);
    assert.match(r.connector, /LC/, n);
  }
});

test('SFP224 is emerging, module-dependent, no family-wide reach; production status not verified', () => {
  const r = get('SFP224');
  assert.equal(r.rate, '200G');
  assert.equal(r.status, 'developing');
  assert.match(r.reach, /No single family-wide reach/);
  assert.match(r.details, /Emerging/);
  assert.match(r.details, /Module-dependent/i);
  for (const text of [r.details, FF_STATUS.developing.long]) {
    assert.match(text, /production\/availability status (was )?not independently verified/i);
    assert.doesNotMatch(text, /not an established production standard|established production|in production|not in production/i);
  }
});

test('SFP-DD lane counts as supplied; DSFP left unverified', () => {
  assert.equal(get('SFP-DD56').rate, '100G');
  assert.match(get('SFP-DD56').details, /2×50G electrical lanes/);
  assert.equal(get('SFP-DD112').rate, '200G');
  assert.match(get('SFP-DD112').details, /2×100G electrical lanes; module-dependent/);
  const d = get('DSFP');
  assert.equal(d.status, 'not-verified');
  for (const k of ['rate', 'medium', 'reach', 'connector']) assert.equal(d[k], null, `DSFP ${k}`);
});

test('QSFP rates as supplied; QSFP 4G and QSFP224 4×200G flagged as not independently verified', () => {
  assert.deepEqual(EXPECTED.qsfp.map((n) => get(n).rate), ['4G', '40G', '100G', '200G', '400G', '800G']);
  assert.match(get('QSFP').details, /not independently verified/i);
  assert.match(get('QSFP224 / QSFP800').details, /4×200G electrical lanes/);
  assert.match(get('QSFP224 / QSFP800').details, /not independently verified/i);
  for (const n of EXPECTED.qsfp) assert.equal(get(n).status, 'user-supplied', n);
});

test('QSFP-DD generations: never MSA-verified, lane mapping conspicuously unverified', () => {
  assert.deepEqual(EXPECTED['qsfp-dd'].map((n) => get(n).rate), ['200G', '400G', '800G', '1.6T']);
  for (const n of EXPECTED['qsfp-dd']) {
    const r = get(n);
    assert.equal(r.status, 'user-supplied', n);
    assert.match(r.details, /lane mapping not source-verified/i, n);
    assert.doesNotMatch(r.details, /\d×\d/, `${n}: no lane split asserted`);
  }
  assert.equal(FF_SOURCES['qsfp-dd-msa'].status, 'inaccessible');
});

// ------------------------------------------------------------ OSFP (primary MSA)

test('OSFP: MSA-verified 8-lane mappings; 112/224 are lane signaling classes, not module rates', () => {
  const cases = [['OSFP56 / OSFP400', '400G', '8×50G'], ['OSFP112 / OSFP800', '800G', '8×100G'], ['OSFP224 / OSFP1600', '1.6T', '8×200G']];
  for (const [n, rate, lanes] of cases) {
    const r = get(n);
    assert.equal(r.status, 'msa-verified', n);
    assert.equal(r.rate, rate, n);
    assert.match(r.details, new RegExp(`${lanes} electrical lanes`), n);
    assert.deepEqual(r.sources, ['osfp-msa'], n);
    // Verification covers rate and lanes only: media, reach and connector stay open.
    for (const k of ['medium', 'reach', 'connector']) assert.equal(r[k], null, `${n} ${k}`);
  }
  assert.match(get('OSFP112 / OSFP800').details, /lane signaling class, not the aggregate module rate/);
  assert.match(get('OSFP224 / OSFP1600').details, /lane signaling class, not the aggregate module rate/);
});

test('OSFP-XD: 16 lanes, MSA mapping 16×50G / 16×100G / 8×200G (3.2T is never 16×200G)', () => {
  const r = get('OSFP-XD');
  assert.equal(r.status, 'msa-verified');
  assert.equal(r.rate, '800G; 1.6T; 3.2T');
  assert.match(r.details, /16 electrical lanes/);
  assert.match(r.details, /800G = 16×50G/);
  assert.match(r.details, /1\.6T = 16×100G/);
  assert.match(r.details, /3\.2T = 8×200G/);
  assert.match(r.details, /not 16×200G/);
  for (const f of FORM_FACTORS) assert.doesNotMatch(allText(f).replace(/not 16×200G/g, ''), /16×200G/, f.name);
  const s = FF_SOURCES['osfp-msa'];
  assert.equal(s.url, 'https://www.osfpmsa.org/');
  assert.equal(s.status, 'verified');
});

test('legacy names listed with no invented rates', () => {
  for (const n of EXPECTED.legacy) {
    const r = get(n);
    assert.equal(r.status, 'not-verified', n);
    for (const k of ['rate', 'medium', 'reach', 'details', 'connector']) assert.equal(r[k], null, `${n} ${k}`);
    assert.equal(cellText(r, 'rate'), NOT_VERIFIED);
  }
});

test('only OSFP rows claim MSA verification; nothing else is promoted', () => {
  assert.deepEqual(FORM_FACTORS.filter((f) => f.status === 'msa-verified').map((f) => f.group), Array(4).fill('osfp'));
  assert.equal(FF_SOURCES['snia-sff-index'].status, 'index-only');
  assert.equal(FF_SOURCES['snia-sff-index'].url, 'https://www.snia.org/technology-communities/sff/specifications');
  assert.equal(FF_SOURCES['user-note'].status, 'unverified');
  for (const s of Object.values(FF_SOURCES)) if (s.url) assert.match(s.url, /^https:\/\//);
  assert.equal(AUDIT_DATE, '2026-10-18');
  assert.doesNotMatch(JSON.stringify([FORM_FACTORS, FF_SOURCES]), /2021/, 'ambiguous June 03, 2021 date is not used as a source date');
});

// ------------------------------------------------------------ search

test('search: case-insensitive, word-start, across every cell', () => {
  assert.equal(names('').length, TOTAL);
  assert.equal(names('   ').length, TOTAL);
  assert.deepEqual(names('SFP112'), ['SFP112']);
  assert.deepEqual(names('sfp112'), ['SFP112']);
  assert.deepEqual(names('OSFP-XD'), ['OSFP-XD']);
  assert.deepEqual(names('osfp-xd'), ['OSFP-XD']);
  assert.deepEqual(names('QSFP-DD1600'), ['QSFP-DD1600']);
  assert.deepEqual(names('qsfp-dd'), EXPECTED['qsfp-dd']);
  assert.deepEqual(names('8×200G'), ['OSFP224 / OSFP1600', 'OSFP-XD']);
  assert.deepEqual(names('8x200g'), ['OSFP224 / OSFP1600', 'OSFP-XD'], 'x matches ×');
  assert.deepEqual(names('om4'), ['SFP+', 'SFP28']);
  assert.deepEqual(names('bidi'), ['SFP']);
  assert.deepEqual(names('rj45 10g'), ['SFP+'], 'tokens are ANDed');
  assert.deepEqual(names('3.2t'), ['OSFP-XD']);
  assert.ok(names('lc').includes('SFP56'));
  assert.deepEqual(names('nonexistent-zzz'), []);
  assert.deepEqual(names('xenpak'), ['XENPAK / X2']);
  assert.deepEqual(names('X2'), ['XENPAK / X2']);
});

// ------------------------------------------------------------ isolation from the comparator

// Comparator entries promoted from the guide: six from the msa-verified OSFP rows
// (tests/unit/osfp.test.mjs) and 18 from the user-supplied rows with a numeric rate
// (tests/unit/user-transceivers.test.mjs). DSFP and the legacy names have no rate.
const OSFP_IDS = ['osfp-400g', 'osfp-800g', 'osfp-1-6t', 'osfp-xd-800g', 'osfp-xd-1-6t', 'osfp-xd-3-2t'];
const USER_FF_IDS = [
  'sfp-1g', 'sfp-plus-10g', 'sfp28-25g', 'sfp56-50g', 'sfp112-100g', 'sfp224-200g',
  'sfp-dd56-100g', 'sfp-dd112-200g',
  'qsfp-4g', 'qsfp-plus-40g', 'qsfp28-100g', 'qsfp56-200g', 'qsfp112-400g', 'qsfp224-800g',
  'qsfp-dd-200g', 'qsfp-dd-400g', 'qsfp-dd-800g', 'qsfp-dd-1600g',
];

test('only rows with a rate are comparison entries: 6 OSFP MSA + 18 user-supplied; DSFP and legacy stay out', async () => {
  assert.equal(INTERFACES.length, 372, '348 + six OSFP MSA + 18 user-supplied entries');
  const promoted = INTERFACES.filter((i) => i.category === 'network' && i.family !== 'Ethernet');
  assert.deepEqual(promoted.map((i) => i.id), [...OSFP_IDS, ...USER_FF_IDS]);
  for (const id of OSFP_IDS) assert.deepEqual(INTERFACES.find((i) => i.id === id).sources, ['osfp-msa'], id);
  for (const id of USER_FF_IDS) assert.deepEqual(INTERFACES.find((i) => i.id === id).sources, ['user-seed'], id);
  assert.deepEqual(FORM_FACTORS.filter((f) => f.rate !== null && f.status !== 'msa-verified').length, USER_FF_IDS.length);
  // Rate-less guide names never become comparator ids, names or aliases.
  const names = (rows) => new Set(rows.flatMap((f) => [f.id, f.name.toLowerCase(), ...f.name.toLowerCase().split(' / ')]));
  const rateless = names(FORM_FACTORS.filter((f) => f.rate === null));
  assert.equal(FORM_FACTORS.filter((f) => f.rate === null).length, 8);
  const verified = names(FORM_FACTORS.filter((f) => f.status === 'msa-verified'));
  for (const i of INTERFACES) {
    for (const v of [i.id, i.name.toLowerCase(), ...(i.aliases || []).map((a) => a.toLowerCase())]) {
      assert.ok(!rateless.has(v), `${i.id} collides with rate-less form factor ${v}`);
      if (verified.has(v)) assert.ok(OSFP_IDS.includes(i.id), `${i.id} borrows OSFP name ${v}`);
    }
  }
  const idx = buildIndex(INTERFACES);
  const ids = (q) => search(idx, q).map((i) => i.id);
  for (const q of ['cfp2', 'dsfp', 'xfp', 'cxp', 'cpak', 'xenpak']) assert.deepEqual(ids(q), [], q);
  assert.deepEqual(ids('qsfp-dd1600'), ['qsfp-dd-1600g']);
  assert.deepEqual(ids('qsfp28'), ['qsfp28-100g']);
  // Substring search: "sfp" is inside "osfp" and "qsfp", so it reaches every transceiver row.
  assert.deepEqual(ids('sfp'), [...OSFP_IDS, ...USER_FF_IDS]);
  assert.deepEqual(ids('transceiver'), [...OSFP_IDS, ...USER_FF_IDS]);
  assert.deepEqual(ids('osfp'), OSFP_IDS);
  assert.deepEqual(ids('osfp-xd'), OSFP_IDS.slice(3));
  for (const p of ['js/data.js', 'js/compare.js', 'js/app.js', 'js/mode.js', 'js/combobox.js']) {
    assert.doesNotMatch(await read(p), /form-factors/, `${p} must not import the guide`);
  }
});

// ------------------------------------------------------------ page + audit doc

test('guide page: same CSP, relative (subpath-safe) assets, semantic table, linked from the comparator', async () => {
  const page = await read('form-factors.html');
  const home = await read('index.html');
  const csp = (h) => h.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  assert.equal(csp(page), csp(home));
  for (const h of [page, home]) assert.doesNotMatch(h, /(?:href|src)="\/(?!\/)/, 'no root-absolute asset paths');
  assert.match(page, /<link rel="stylesheet" href="styles\.css">/);
  assert.match(page, /<script type="module" src="js\/form-factors-page\.js"><\/script>/);
  assert.match(page, /<caption/);
  assert.match(page, /role="region"[^>]*tabindex="0"|tabindex="0"[^>]*role="region"/);
  assert.match(page, /href="\.\/"/, 'back link to the comparator');
  assert.match(home, /href="form-factors\.html"/);
  for (const u of ['https://www.osfpmsa.org/', 'https://www.snia.org/technology-communities/sff/specifications', 'https://www.qsfp-dd.com/']) {
    assert.ok(page.includes(u) || Object.values(FF_SOURCES).some((s) => s.url === u), u);
  }
});

test('audit doc stays in sync with the data', async () => {
  const doc = await read('docs/transceiver-form-factors-audit.md');
  assert.match(doc, /2026-10-18/);
  assert.match(doc, new RegExp(`\\b${TOTAL} rows\\b`));
  for (const f of FORM_FACTORS) assert.ok(doc.includes(f.name), `audit lists ${f.name}`);
  for (const [g, list] of Object.entries(EXPECTED)) assert.ok(doc.includes(`${FF_GROUPS[g]} | ${list.length}`), `group count ${g}`);
  assert.match(doc, /June 03, 2021/);
  assert.match(doc, /could not be tied to a cited source/);
  assert.match(doc, /3\.2 Tb\/s.*8×200G/);
  assert.match(doc, /not 16×200G/);
  assert.match(doc, /timed out/);
  assert.match(doc, /403/);
  assert.match(doc, /index only/i);
  for (const s of Object.values(FF_SOURCES)) if (s.url) assert.ok(doc.includes(s.url), `audit cites ${s.url}`);
});
