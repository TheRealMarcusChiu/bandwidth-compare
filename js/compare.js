// Pure comparison logic: no DOM. Shared by the app and the node tests.

export const UNITS = {
  GBps: { label: 'GB/s', long: 'gigabytes per second (decimal, 10^9 bytes)' },
  Gbps: { label: 'Gb/s', long: 'gigabits per second (10^9 bits)' },
};
export const DEFAULT_UNIT = 'GBps';

const NF = (opts) => new Intl.NumberFormat('en-US', opts);
const NF_INT1 = NF({ maximumFractionDigits: 1 });
const NF_INT0 = NF({ maximumFractionDigits: 0 });

/** Value of an interface in the chosen unit. */
export function valueIn(item, unit) {
  return unit === 'Gbps' ? item.Gbps : item.GBps;
}

/** Bold-number formatting: 4 significant digits, thousands separators above 1000. */
export function formatValue(v) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  if (Math.abs(v) >= 1000) return NF_INT1.format(v);
  return String(Number(v.toPrecision(4)));
}

/** Human-scale hint for very small figures (decimal units). */
export function humanScale(GBps) {
  const Bps = GBps * 1e9;
  if (GBps >= 0.1) return null;
  if (Bps >= 1e6) return `${formatValue(Bps / 1e6)} MB/s`;
  if (Bps >= 1e3) return `${formatValue(Bps / 1e3)} kB/s`;
  return `${formatValue(Bps)} B/s`;
}

export function formatRatio(r) {
  if (!Number.isFinite(r)) return '—';
  if (r < 10) return `${Number(r.toFixed(2))}×`;
  if (r < 1000) return `${Number(r.toFixed(1))}×`;
  return `${NF_INT0.format(r)}×`;
}

/**
 * Compare two interfaces.
 * Ratio is always larger ÷ smaller, computed on GB/s (unit-independent).
 * Bar widths are exact linear percentages of the larger value: no minimum width.
 */
export function compare(a, b) {
  const same = a.id === b.id;
  const va = a.GBps;
  const vb = b.GBps;
  const max = Math.max(va, vb);
  const min = Math.min(va, vb);
  const ratio = min > 0 ? max / min : Infinity;
  const equalValue = va === vb;
  const faster = equalValue ? 'equal' : va > vb ? 'a' : 'b';
  return {
    same,
    equalValue,
    faster,
    ratio,
    widthA: max > 0 ? (va / max) * 100 : 0,
    widthB: max > 0 ? (vb / max) * 100 : 0,
    mixedBasis: a.basis !== b.basis,
    anyUnverified: a.verification === 'unverified' || b.verification === 'unverified',
    anyAsymmetric: Boolean(a.asymmetric || b.asymmetric),
  };
}

/** Sentence describing the comparison. Never claims real throughput. */
export function ratioSentence(a, b, cmp) {
  if (cmp.same) return 'Same interface on both sides.';
  if (cmp.equalValue) return `${a.name} and ${b.name} have the same listed figure.`;
  const [hi, lo] = cmp.faster === 'a' ? [a, b] : [b, a];
  return `${hi.name} lists ${formatRatio(cmp.ratio)} the figure of ${lo.name}.`;
}

// ------------------------------------------------------------ URL state

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Parse ?a=&b=&u= into a valid state. Unknown IDs fall back to defaults and are
 * reported so the UI can tell the user.
 */
export function parseState(search, byId, defaults) {
  const params = new URLSearchParams(search);
  const errors = [];
  const pick = (key, fallback) => {
    const raw = params.get(key);
    if (raw === null || raw === '') return fallback;
    const id = raw.trim().toLowerCase();
    if (ID_RE.test(id) && byId.has(id)) return id;
    errors.push({ key, value: raw.slice(0, 64) });
    return fallback;
  };
  const a = pick('a', defaults.a);
  const b = pick('b', defaults.b);
  const rawUnit = params.get('u');
  let unit = DEFAULT_UNIT;
  if (rawUnit !== null) {
    if (rawUnit in UNITS) unit = rawUnit;
    else errors.push({ key: 'u', value: rawUnit.slice(0, 16) });
  }
  return { a, b, unit, errors };
}

export function serializeState({ a, b, unit }) {
  const p = new URLSearchParams({ a, b });
  if (unit !== DEFAULT_UNIT) p.set('u', unit);
  return `?${p.toString()}`;
}

// ------------------------------------------------------------ search

const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
const words = (s) => s.toLowerCase().replace(/[^a-z0-9.+]+/g, ' ').trim();

export function buildIndex(items) {
  return items.map((item) => {
    const hay = [item.name, item.family, item.id, item.width?.label ?? '', ...item.aliases].join(' | ');
    return { item, words: words(hay), compact: compact(hay) };
  });
}

/**
 * Every query token must appear in either the spaced or the compacted haystack,
 * so "pcie4x4", "pcie 4 x4", "gen4 x4" and "u.2" all work.
 * Results keep catalog order so family groups stay contiguous.
 */
export function search(index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return index.map((e) => e.item);
  const tokens = words(q).split(/\s+/).filter(Boolean);
  const cq = compact(q);
  return index
    .filter(
      (e) =>
        (cq && e.compact.includes(cq)) ||
        tokens.every((t) => e.words.includes(t) || e.compact.includes(compact(t))),
    )
    .map((e) => e.item);
}
