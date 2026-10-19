// Ethernet transceiver form-factor guide. Separate from the bandwidth catalog (js/data.js):
// a form factor is a module/cage shape, not a link standard or rate.
// The MSA-verified OSFP rows below are the only source-verified transceiver entries in
// the comparator (one per OSFP MSA rate/lane mapping, defined in js/data.js).
// The other rows with a numeric rate are also comparator entries, as user-supplied,
// unverified figures compared exactly as supplied. DSFP and the seven legacy names have
// no numeric rate, so they stay guide-only. Provenance: docs/transceiver-form-factors-audit.md.

export const AUDIT_DATE = '2026-10-18';

/** Shown in place of any value the audit could not tie to a source. Never inferred. */
export const NOT_VERIFIED = 'Not source-verified in this update; consult the exact MSA or module datasheet.';

export const FF_COLUMNS = Object.freeze([
  { key: 'name', label: 'Form factor' },
  { key: 'rate', label: 'Ethernet data rate' },
  { key: 'medium', label: 'Fiber/medium' },
  { key: 'reach', label: 'Representative reach' },
  { key: 'details', label: 'Module-dependent details' },
  { key: 'connector', label: 'Typical connector' },
].map(Object.freeze));

export const FF_GROUPS = Object.freeze({
  sfp: 'SFP',
  'sfp-dd': 'SFP-DD / DSFP',
  qsfp: 'QSFP',
  'qsfp-dd': 'QSFP-DD',
  osfp: 'OSFP',
  legacy: 'Legacy',
});

export const FF_STATUS = Object.freeze({
  'msa-verified': { short: 'OSFP MSA: rate & lanes', long: 'Rate and electrical-lane mapping match the OSFP MSA FAQ (fetched 2026-10-18). Media, reach and connector are not covered.' },
  'user-supplied': { short: 'User-supplied, unverified', long: 'Values come from the site owner’s notes and were not independently verified against an MSA or datasheet.' },
  developing: { short: 'Developing, unverified', long: 'Emerging generation. Values are user-supplied and module-dependent; current production/availability status not independently verified.' },
  'not-verified': { short: 'Not source-verified', long: 'Named for completeness. No value was source-verified in this update.' },
});

export const FF_SOURCES = Object.freeze({
  'osfp-msa': {
    title: 'OSFP MSA, official site and FAQ', publisher: 'OSFP MSA', url: 'https://www.osfpmsa.org/',
    status: 'verified', note: 'Fetched and read 2026-10-18. Source of the OSFP and OSFP-XD rate/lane mappings.',
  },
  'snia-sff-index': {
    title: 'SFF Specifications', publisher: 'SNIA', url: 'https://www.snia.org/technology-communities/sff/specifications',
    status: 'index-only', note: 'Official SFF specification index (HTTP 200 on 2026-10-18). The fetch did not expose document content, so it is not cited as proof of any figure.',
  },
  'qsfp-dd-msa': {
    title: 'QSFP-DD MSA', publisher: 'QSFP-DD MSA', url: 'https://www.qsfp-dd.com/',
    status: 'inaccessible', note: 'Timed out during the 2026-10-18 audit, including likely specification paths. QSFP-DD values are not verified against it.',
  },
  'user-note': {
    title: 'Site owner’s form-factor notes', publisher: 'User-supplied', url: null,
    status: 'unverified', note: 'Rates, media, reach examples and connectors as supplied. Reach figures are illustrative; vendor datasheets could not be retrieved (HTTP 403).',
  },
});

const ff = (group, name, fields) => Object.freeze({
  id: name.toLowerCase().replace(/[^a-z0-9+]+/g, '-').replace(/\+/g, 'plus').replace(/^-|-$/g, ''),
  group,
  name,
  rate: null, medium: null, reach: null, details: null, connector: null,
  aliases: [],
  ...fields,
  sources: Object.freeze(fields.sources),
});

const USER = ['user-note'];
const QDD_LANES = 'Lane mapping not source-verified in this update; consult the exact QSFP-DD MSA document or module datasheet.';
const QDD = ['user-note', 'qsfp-dd-msa'];

export const FORM_FACTORS = Object.freeze([
  // ---------------------------------------------------------------- SFP
  ff('sfp', 'SFP', {
    rate: '1G', medium: 'MMF, SMF, copper',
    reach: 'MMF 550 m; SMF 10–80 km (specialty longer); copper 100 m',
    details: 'Medium and reach depend on the module variant (MMF, SMF, BiDi, copper).',
    connector: 'Duplex LC; simplex LC (BiDi); RJ45 (copper)',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp', 'SFP+', {
    rate: '10G', medium: 'MMF (OM3/OM4), SMF, copper',
    reach: 'MMF 300 m OM3 / 400 m OM4; SMF 10/40/80 km (specialty 120 km); RJ45 commonly 30–100 m',
    details: 'Reach depends on the module and fiber grade.',
    connector: 'LC; RJ45 (copper)',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp', 'SFP28', {
    rate: '25G', medium: 'MMF (OM3/OM4), SMF',
    reach: 'MMF 70 m OM3 / 100 m OM4; SMF 10/25/40 km (specialty longer)',
    details: 'Reach depends on the module and fiber grade.',
    connector: 'LC',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp', 'SFP56', {
    rate: '50G', medium: 'MMF, SMF',
    reach: 'MMF 70–100 m; SMF 10–40 km',
    details: 'Reach is user-supplied and unverified; check the exact module datasheet.',
    connector: 'LC',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp', 'SFP112', {
    rate: '100G', medium: 'MMF, SMF',
    reach: 'MMF typically 50–100 m; SMF 500 m / 2 km / 10 km, module-dependent',
    details: 'Reach is user-supplied and unverified; check the exact module datasheet.',
    connector: 'LC',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp', 'SFP224', {
    rate: '200G',
    reach: 'No single family-wide reach; module-dependent.',
    details: 'Emerging generation, developing; current production/availability status not independently verified. Module-dependent.',
    status: 'developing', sources: USER,
  }),

  // ---------------------------------------------------------------- SFP-DD / DSFP
  ff('sfp-dd', 'SFP-DD56', {
    rate: '100G', details: 'Uses 2×50G electrical lanes.',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp-dd', 'SFP-DD112', {
    rate: '200G', details: 'Uses 2×100G electrical lanes; module-dependent.',
    status: 'user-supplied', sources: USER,
  }),
  ff('sfp-dd', 'DSFP', {
    details: 'Named family only. Rate, medium, reach and connector not verified in this update; see the exact MSA or module.',
    status: 'not-verified', sources: USER,
  }),

  // ---------------------------------------------------------------- QSFP
  ff('qsfp', 'QSFP', {
    rate: '4G', details: 'Rate as supplied; not independently verified.',
    status: 'user-supplied', sources: USER,
  }),
  ff('qsfp', 'QSFP+', { rate: '40G', status: 'user-supplied', sources: USER }),
  ff('qsfp', 'QSFP28', { rate: '100G', status: 'user-supplied', sources: USER }),
  ff('qsfp', 'QSFP56', { rate: '200G', status: 'user-supplied', sources: USER }),
  ff('qsfp', 'QSFP112', { rate: '400G', status: 'user-supplied', sources: USER }),
  ff('qsfp', 'QSFP224 / QSFP800', {
    rate: '800G', details: 'Uses 4×200G electrical lanes (as supplied; not independently verified).',
    status: 'user-supplied', sources: USER,
  }),

  // ---------------------------------------------------------------- QSFP-DD
  ff('qsfp-dd', 'QSFP-DD (200G)', { rate: '200G', details: QDD_LANES, status: 'user-supplied', sources: QDD }),
  ff('qsfp-dd', 'QSFP-DD (400G)', { rate: '400G', details: QDD_LANES, status: 'user-supplied', sources: QDD }),
  ff('qsfp-dd', 'QSFP-DD800', { rate: '800G', details: QDD_LANES, status: 'user-supplied', sources: QDD }),
  ff('qsfp-dd', 'QSFP-DD1600', { rate: '1.6T', details: QDD_LANES, status: 'user-supplied', sources: QDD }),

  // ---------------------------------------------------------------- OSFP (OSFP MSA FAQ)
  ff('osfp', 'OSFP56 / OSFP400', {
    rate: '400G', details: '8×50G electrical lanes (OSFP MSA).',
    status: 'msa-verified', sources: ['osfp-msa'],
  }),
  ff('osfp', 'OSFP112 / OSFP800', {
    rate: '800G', details: '8×100G electrical lanes (OSFP MSA). “112” is the lane signaling class, not the aggregate module rate.',
    status: 'msa-verified', sources: ['osfp-msa'],
  }),
  ff('osfp', 'OSFP224 / OSFP1600', {
    rate: '1.6T', details: '8×200G electrical lanes (OSFP MSA). “224” is the lane signaling class, not the aggregate module rate.',
    status: 'msa-verified', sources: ['osfp-msa'],
  }),
  ff('osfp', 'OSFP-XD', {
    rate: '800G; 1.6T; 3.2T',
    details: '16 electrical lanes. OSFP MSA mapping: 800G = 16×50G; 1.6T = 16×100G; 3.2T = 8×200G, as the MSA FAQ states it (not 16×200G).',
    status: 'msa-verified', sources: ['osfp-msa'],
  }),

  // ---------------------------------------------------------------- legacy
  ...['XFP', 'XENPAK / X2', 'CFP', 'CFP2', 'CFP4', 'CPAK', 'CXP'].map((name) =>
    ff('legacy', name, { status: 'not-verified', sources: USER })),
]);

/** Display text of one cell. Missing values show the not-verified note, never a guess. */
export function cellText(row, key) {
  return row[key] ?? NOT_VERIFIED;
}

const norm = (s) => s.toLowerCase().replace(/×/g, 'x').replace(/\s+/g, ' ');
const HAY = new WeakMap();
const hay = (row) => {
  if (!HAY.has(row)) {
    HAY.set(row, ` ${norm([...FF_COLUMNS.map((c) => cellText(row, c.key)), FF_GROUPS[row.group], FF_STATUS[row.status].short, ...row.aliases].join(' | '))}`);
  }
  return HAY.get(row);
};
const isWordChar = (ch) => /[a-z0-9]/.test(ch);

/** Does `token` start at a word boundary somewhere in `text`? ("sfp112" ≠ "qsfp112") */
function startsWord(text, token) {
  for (let i = text.indexOf(token); i !== -1; i = text.indexOf(token, i + 1)) {
    if (!isWordChar(text[i - 1] ?? ' ')) return true;
  }
  return false;
}

/**
 * Case-insensitive search across the form factor and every cell. Whitespace-separated
 * tokens are ANDed; each must start a word. Returns rows in table order.
 */
export function filterFormFactors(rows, query) {
  const tokens = norm(query || '').trim().split(' ').filter(Boolean);
  if (!tokens.length) return [...rows];
  return rows.filter((r) => tokens.every((t) => startsWord(hay(r), t)));
}
