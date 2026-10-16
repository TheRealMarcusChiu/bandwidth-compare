// Display mode: raw signaling or encoding-adjusted. Pure, no DOM.
//
// The catalog is never changed. For an encoding-adjusted entry, bitsPerSecond is
// already the raw line rate and `efficiency` is its documented line code, so the
// raw view simply drops that factor. Nothing else is converted: memory has no line
// code, raw and advertised rows carry no explicit factor (a 1/1 efficiency means
// "none recorded", not "no overhead"), and lane widths, channels and asymmetry
// are never touched.

import { BASES, computeGBps } from './data.js';

export const MODES = {
  adjusted: { label: 'Encoding-adjusted', short: 'Enc-adj' },
  raw: { label: 'Raw signaling', short: 'Raw' },
};
export const DEFAULT_MODE = 'adjusted';

/** 'memory' (mode does not apply), 'reversible' (explicit line code) or 'fixed' (shown as listed). */
export function modeSupport(item) {
  if (item.basis === 'memory-theoretical') return 'memory';
  const [num, den] = item.efficiency;
  return item.basis === 'encoding-adjusted' && num !== den ? 'reversible' : 'fixed';
}

/** Raw formula: the stored formula without its line-code factor. */
function rawFormula(item) {
  const [num, den] = item.efficiency;
  return `${item.formula.replace(` × ${num}/${den}`, '')} (raw, ${item.encoding} not subtracted)`;
}

function modeNote(item, mode, support) {
  if (support === 'memory') return 'Theoretical memory peak: the same in both modes (no line code applies).';
  const enc = item.encoding;
  if (support === 'reversible') {
    return mode === 'raw'
      ? `Raw signaling: ${enc} line code not subtracted (line rate before encoding).`
      : `Encoding-adjusted: ${enc} line code subtracted (× ${item.efficiency[0]}/${item.efficiency[1]}). Packet, framing and protocol overhead remain, so this is not usable throughput.`;
  }
  const shown = BASES[item.basis].label;
  if (mode === 'raw') {
    return item.basis === 'raw-signaling'
      ? 'Raw signaling shown.'
      : `Raw signaling unavailable; ${shown} shown. No encoding factor is recorded for this figure, so none is reversed.`;
  }
  const flit = enc && enc.includes('FLIT')
    ? ' FLIT framing and FEC overhead are not subtracted; this is the raw line rate, not an adjusted payload rate.'
    : ' No encoding factor is recorded for this figure, so no overhead is assumed.';
  return `Encoding adjustment unavailable; ${shown} shown.${flit}`;
}

function build(item, mode) {
  const support = modeSupport(item);
  const view = { ...item, mode, modeSupport: support, modeNote: modeNote(item, mode, support) };
  if (support === 'reversible' && mode === 'raw') {
    Object.assign(view, {
      basis: 'raw-signaling',
      GBps: computeGBps(item.bitsPerSecond),
      Gbps: item.bitsPerSecond / 1e9,
      formula: rawFormula(item),
    });
  }
  view.modeApplied = support === 'reversible' || (support === 'fixed' && view.basis === (mode === 'raw' ? 'raw-signaling' : 'encoding-adjusted'));
  return Object.freeze(view);
}

const cache = { adjusted: new WeakMap(), raw: new WeakMap() };

/** Frozen display view of a catalog entry in a mode. Unknown modes use the default. */
export function viewOf(item, mode) {
  const m = Object.hasOwn(MODES, mode) ? mode : DEFAULT_MODE;
  let v = cache[m].get(item);
  if (!v) cache[m].set(item, (v = build(item, m)));
  return v;
}
