import {
  INTERFACES, BY_ID, BASES, STATUSES, STATUS_SHORT, VERIFICATION, CATEGORIES, SOURCES, DEFAULT_A, DEFAULT_B,
} from './data.js';
import {
  UNITS, valueIn, formatValue, humanScale, formatRatio, compare, ratioSentence, ratioShort,
  parseState, serializeState, buildIndex, search, SORTS, DEFAULT_SORT, sortItems,
} from './compare.js';
import { MODES, viewOf } from './mode.js';
import { Combobox } from './combobox.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'role' || k === 'title' || k === 'href' || k === 'rel' || k === 'target' || k === 'type' || k === 'scope') n.setAttribute(k, v);
    else n[k] = v;
  }
  n.append(...kids.filter((k) => k != null));
  return n;
};

const index = buildIndex(INTERFACES);
const parsed = parseState(location.search, BY_ID, { a: DEFAULT_A, b: DEFAULT_B });
const state = { a: parsed.a, b: parsed.b, unit: parsed.unit, mode: parsed.mode };
/** Display view of a catalog entry in the selected mode. Everything shown goes through this. */
const V = (item) => viewOf(item, state.mode);
const modeLabel = () => MODES[state.mode].label;

// ------------------------------------------------------------ pickers

const unitLabel = () => UNITS[state.unit].label;
const meta = (item) => {
  const v = V(item);
  return `${formatValue(valueIn(v, state.unit))} ${unitLabel()} · ${BASES[v.basis].short}`;
};

const pickers = {
  a: new Combobox($('.picker[data-side="a"] .cb'), { index, renderMeta: meta, onSelect: (i) => set({ a: i.id }) }),
  b: new Combobox($('.picker[data-side="b"] .cb'), { index, renderMeta: meta, onSelect: (i) => set({ b: i.id }) }),
};

function set(patch) {
  Object.assign(state, patch);
  history.replaceState(null, '', serializeState(state) + location.hash);
  render();
}

// ------------------------------------------------------------ render

// Compact flags only: basis + width always, status/verification only when they are a caveat.
// Full wording lives in Comparison details.
function badges(item) {
  const basis = BASES[item.basis];
  const status = STATUS_SHORT[item.status];
  return el('ul', { class: 'badges', 'aria-label': 'Attributes' },
    el('li', { class: `badge badge-basis basis-${item.basis}`, title: basis.description }, el('b', { text: basis.short }), ` ${basis.label}`),
    el('li', { class: 'badge', title: 'Width' }, item.width.label),
    status ? el('li', { class: `badge status-${item.status}`, title: STATUSES[item.status] }, status) : null,
    item.verification === 'unverified' ? el('li', { class: 'badge badge-warn', title: VERIFICATION.unverified }, 'Unverified') : null,
  );
}

const reverseText = (item) =>
  `${formatValue(state.unit === 'Gbps' ? item.asymmetric.reverseMbps / 1000 : item.asymmetric.reverseMbps / 8000)} ${unitLabel()}`;

function renderSide(node, item, side) {
  const v = formatValue(valueIn(item, state.unit));
  const hs = humanScale(item.GBps);
  const num = el('span', { class: 'num', text: v });
  num.style.setProperty('--chars', String(Math.max(v.length, 4)));
  node.replaceChildren(...[
    el('p', { class: 'side-tag' }, el('span', { class: `dot dot-${side}`, 'aria-hidden': 'true' }), `${side.toUpperCase()} · ${item.family}`),
    el('h3', { class: 'side-name', text: item.name }),
    el('p', { class: 'value' }, num, el('span', { class: 'unit', text: unitLabel() })),
    hs ? el('p', { class: 'human', text: `= ${hs}` }) : null,
    item.asymmetric ? el('p', { class: 'asym' }, `Reverse direction: ${reverseText(item)}`) : null,
    badges(item),
  ].filter(Boolean));
}

function renderDetail(node, item, side) {
  const basis = BASES[item.basis];
  const row = (term, ...desc) => [el('dt', { text: term }), el('dd', {}, ...desc)];
  const via = item.connectorOf && BY_ID.get(item.connectorOf);
  node.replaceChildren(
    el('h3', { class: 'detail-name' }, el('span', { class: `dot dot-${side}`, 'aria-hidden': 'true' }), `${side.toUpperCase()} · ${item.name}`),
    el('dl', { class: 'detail-list' }, ...[
      row('Value', `${formatValue(item.GBps)} GB/s = ${formatValue(item.Gbps)} Gb/s`),
      row('Figures', item.modeNote),
      row('Formula', el('code', { class: 'formula', text: `${item.formula} = ${formatValue(item.GBps)} GB/s` })),
      row('Basis', el('span', { class: `badge badge-basis basis-${item.basis}`, text: basis.short }), ` ${basis.label}. ${basis.description}`),
      row('Width', item.width.label),
      item.channels ? row('Channels', `${item.channels} × ${item.channelBits}-bit channel${item.channels === 1 ? '' : 's'} (${item.width.count}-bit aggregate)`) : null,
      item.encoding ? row('Encoding', item.encoding) : null,
      item.asymmetric ? row('Reverse direction', reverseText(item)) : null,
      row('Status', STATUSES[item.status]),
      row('Verification', el('span', { class: `badge ${item.verification === 'unverified' ? 'badge-warn' : 'badge-ok'}`, text: VERIFICATION[item.verification] })),
      item.notes ? row('Notes', item.notes) : null,
      row(item.sources.length === 1 ? 'Source' : 'Sources', ...item.sources.flatMap((id, k) => {
        const s = SOURCES[id];
        const title = s.url
          ? el('a', { href: s.url, rel: 'noopener noreferrer', target: '_blank', text: s.title })
          : el('span', { text: s.title });
        return [k ? '; ' : null, el('span', { class: 'detail-src' }, title, el('span', { class: 'src-meta', text: ` ${s.publisher} · ${s.kind}` }))].filter(Boolean);
      })),
      via ? row('Underlying link', el('button', { type: 'button', class: 'link', 'data-goto': via.id, 'data-side': side, text: `${via.name} → set as ${side.toUpperCase()}` })) : null,
    ].filter(Boolean).flat()),
  );
}

function renderBar(side, item, pct) {
  $(`#bar-name-${side}`).textContent = `: ${item.name}`;
  $(`#bar-val-${side}`).textContent = `${formatValue(valueIn(item, state.unit))} ${unitLabel()}`;
  const bar = $(`#bar-${side}`);
  bar.style.width = `${pct}%`;
  const tiny = $(`#bar-tiny-${side}`);
  const trackW = bar.parentElement.clientWidth || 1;
  const px = (trackW * pct) / 100;
  if (px < 1) {
    tiny.hidden = false;
    tiny.textContent = `${formatPct(pct)} of ${side === 'a' ? 'B' : 'A'}: under one pixel, not drawn`;
  } else {
    tiny.hidden = true;
  }
}

const PCT = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2, maximumFractionDigits: 20 });
function formatPct(p) {
  return `${PCT.format(p)}%`;
}

function render() {
  // The pickers hold catalog entries; everything displayed uses the mode's view.
  pickers.a.setSelected(BY_ID.get(state.a));
  pickers.b.setSelected(BY_ID.get(state.b));
  const a = V(BY_ID.get(state.a));
  const b = V(BY_ID.get(state.b));
  const cmp = compare(a, b);

  pickers.a.refresh();
  pickers.b.refresh();

  renderSide($('#side-a'), a, 'a');
  renderSide($('#side-b'), b, 'b');
  renderDetail($('#detail-a'), a, 'a');
  renderDetail($('#detail-b'), b, 'b');

  const rn = $('#ratio-num');
  rn.textContent = cmp.same || cmp.equalValue ? '1×' : formatRatio(cmp.ratio);
  rn.classList.toggle('is-even', cmp.same || cmp.equalValue);
  rn.style.setProperty('--chars', String(Math.max(rn.textContent.length, 4)));
  $('#ratio-text').textContent = ratioShort(cmp);
  $('#ratio-mode').textContent = `${modeLabel()} figures:`;
  $('#ratio-full').textContent = ratioSentence(a, b, cmp);

  renderBar('a', a, cmp.widthA);
  renderBar('b', b, cmp.widthB);
  $('#bars').setAttribute('aria-label',
    `Bar comparison, ${modeLabel().toLowerCase()}: ${a.name} ${formatValue(valueIn(a, state.unit))} ${unitLabel()}, ${b.name} ${formatValue(valueIn(b, state.unit))} ${unitLabel()}.`);

  // Each notice: a short visible flag in the comparison, the full explanation in details.
  const notes = [];
  if (cmp.same) notes.push(['info', 'Identical selection', 'Pick a different interface on either side to compare.']);
  if (cmp.mixedBasis) {
    notes.push(['warn', 'Mixed basis: not like for like',
      `A is ${BASES[a.basis].label.toLowerCase()}; B is ${BASES[b.basis].label.toLowerCase()}. The ratio compares different kinds of number.`]);
  }
  // Sides the selected mode cannot apply to (memory never counts). The compact flag is
  // skipped when "Mixed basis" already flags the comparison; details always explain.
  const fixed = [['A', a], ['B', b]].filter(([, v]) => !v.modeApplied && v.modeSupport !== 'memory' && !(cmp.same && v === b));
  if (fixed.length) {
    const what = state.mode === 'raw' ? 'raw signaling' : 'encoding adjustment';
    notes.push(['info', `${fixed.map(([s]) => s).join(', ')}: ${what} unavailable`,
      fixed.map(([s, v]) => `${s}: ${v.modeNote}`).join(' '), cmp.mixedBasis]);
  }
  if (cmp.anyAsymmetric) notes.push(['info', 'Asymmetric link', 'Only the faster direction is compared. Directions are never added together.']);
  if (cmp.anyUnverified) notes.push(['warn', 'Unverified figure', 'At least one side is user-supplied seed data that has not been checked against a source.']);
  if (!cmp.same && cmp.ratio >= 1000) notes.push(['info', 'Extreme difference', 'At linear scale the smaller bar may be too short to see. The numbers above are exact.']);
  $('#notices').replaceChildren(...notes.filter(([, , , detailsOnly]) => !detailsOnly)
    .map(([kind, title]) => el('p', { class: `flag flag-${kind}`, role: 'note', text: title })));
  $('#notice-details').replaceChildren(...notes.map(([kind, title, body]) =>
    el('div', { class: `notice notice-${kind}` }, el('p', { class: 'notice-title', text: `${title}.` }), el('p', { class: 'notice-body', text: body }))));

  document.querySelectorAll('input[name="unit"]').forEach((r) => { r.checked = r.value === state.unit; });
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === state.mode; });
  $('#cat-unit').textContent = unitLabel();
  renderCatalog();
  document.title = `${a.name} vs ${b.name} · BANDWIDTH / compare`;
}

// ------------------------------------------------------------ catalog

const catState = { q: '', cat: 'all', sort: DEFAULT_SORT };
// Only these orders keep families contiguous, so only they get family header rows.
const GROUPED_SORTS = new Set(['original', 'family-asc', 'family-desc']);
const SORT_COLUMN = { bandwidth: '#cat-unit', name: '.cat thead th:first-child' };

function renderChips() {
  const chips = $('#cat-chips');
  const all = [['all', 'All'], ...Object.entries(CATEGORIES)];
  chips.replaceChildren(...all.map(([key, label]) =>
    el('button', { type: 'button', class: 'chip', 'data-cat': key, 'aria-pressed': String(key === catState.cat), text: label })));
}

function renderCatalog() {
  const rows = sortItems(search(index, catState.q).filter((i) => catState.cat === 'all' || i.category === catState.cat).map(V), catState.sort);
  const grouped = GROUPED_SORTS.has(catState.sort);
  $('#cat-empty').hidden = rows.length > 0;
  const body = $('#cat-body');
  let fam = null;
  const trs = [];
  for (const item of rows) {
    if (grouped && item.family !== fam) {
      fam = item.family;
      trs.push(el('tr', { class: 'cat-fam' }, el('th', { scope: 'rowgroup', colSpan: 5, text: fam })));
    }
    const isA = item.id === state.a;
    const isB = item.id === state.b;
    trs.push(el('tr', { class: isA || isB ? 'is-picked' : '' },
      el('th', { scope: 'row' }, el('span', { class: 'cat-name', text: item.name }),
        grouped ? null : el('span', { class: 'cat-fam-inline', text: item.family }),
        item.verification === 'unverified' ? el('span', { class: 'cat-flag', title: VERIFICATION.unverified, text: 'unverified' }) : null,
        el('span', { class: `cat-basis-inline badge badge-basis basis-${item.basis}`, title: BASES[item.basis].label, text: `${BASES[item.basis].short} · ${item.width.label}` })),
      el('td', { text: item.width.label }),
      el('td', {}, el('span', { class: `badge badge-basis basis-${item.basis}`, title: BASES[item.basis].label, text: BASES[item.basis].short })),
      el('td', { class: 'num-col', text: formatValue(valueIn(item, state.unit)) }),
      el('td', { class: 'cat-act' },
        el('button', { type: 'button', class: 'mini', 'data-set': 'a', 'data-id': item.id, 'aria-label': `Set ${item.name} as A`, 'aria-pressed': String(isA), text: 'A' }),
        el('button', { type: 'button', class: 'mini', 'data-set': 'b', 'data-id': item.id, 'aria-label': `Set ${item.name} as B`, 'aria-pressed': String(isB), text: 'B' })),
    ));
  }
  body.replaceChildren(...trs);
  const [col, dir] = catState.sort.split('-');
  document.querySelectorAll('.cat thead th[aria-sort]').forEach((th) => th.removeAttribute('aria-sort'));
  if (SORT_COLUMN[col]) $(SORT_COLUMN[col]).setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
  $('#cat-caption').textContent = `All interfaces, ${modeLabel().toLowerCase()} figures in the selected unit, ${catState.sort === DEFAULT_SORT ? 'in catalog order' : `sorted by ${SORTS[catState.sort].toLowerCase()}`}`;
  $('#catalog-count').textContent = rows.length === INTERFACES.length ? `${INTERFACES.length} interfaces` : `${rows.length} of ${INTERFACES.length}`;
}

// ------------------------------------------------------------ methodology

function renderMethod() {
  $('#bases').replaceChildren(...Object.entries(BASES).flatMap(([key, b]) => [
    el('dt', {}, el('span', { class: `badge badge-basis basis-${key}`, text: b.short }), ` ${b.label}`),
    el('dd', { text: b.description }),
  ]));
  const used = new Map();
  for (const i of INTERFACES) for (const s of i.sources) {
    if (!used.has(s)) used.set(s, new Set());
    used.get(s).add(i.family);
  }
  $('#sources').replaceChildren(...[...used.entries()].map(([id, fams]) => {
    const s = SOURCES[id];
    const title = s.url
      ? el('a', { href: s.url, rel: 'noopener noreferrer', target: '_blank', text: s.title })
      : el('span', { text: s.title });
    return el('li', {}, title,
      el('span', { class: 'src-meta', text: ` ${s.publisher} · ${s.kind} · ${[...fams].join(', ')}` }));
  }));
}

// ------------------------------------------------------------ events

$('#swap').addEventListener('click', () => set({ a: state.b, b: state.a }));

document.querySelectorAll('input[name="unit"]').forEach((r) =>
  r.addEventListener('change', () => { if (r.checked) set({ unit: r.value }); }));
document.querySelectorAll('input[name="mode"]').forEach((r) =>
  r.addEventListener('change', () => { if (r.checked) set({ mode: r.value }); }));

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2200);
}

$('#share').addEventListener('click', async () => {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied');
  } catch {
    // Clipboard blocked (insecure context or permission): fall back to a prompt-free select.
    const ta = el('textarea', { value: url, 'aria-hidden': 'true' });
    ta.className = 'vh';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    ta.remove();
    toast(ok ? 'Link copied' : `Copy this link: ${url}`);
  }
});

document.addEventListener('click', (e) => {
  const setBtn = e.target.closest('[data-set]');
  if (setBtn) {
    set({ [setBtn.dataset.set]: setBtn.dataset.id });
    toast(`${BY_ID.get(setBtn.dataset.id).name} → ${setBtn.dataset.set.toUpperCase()}`);
    return;
  }
  const go = e.target.closest('[data-goto]');
  if (go) set({ [go.dataset.side]: go.dataset.goto });
});

$('#cat-q').addEventListener('input', (e) => { catState.q = e.target.value; renderCatalog(); });
$('#cat-sort').addEventListener('change', (e) => { catState.sort = e.target.value; renderCatalog(); });
$('#cat-chips').addEventListener('click', (e) => {
  const c = e.target.closest('[data-cat]');
  if (!c) return;
  catState.cat = c.dataset.cat;
  renderChips();
  renderCatalog();
});

let resizeRaf;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const [a, b] = [V(BY_ID.get(state.a)), V(BY_ID.get(state.b))];
    const cmp = compare(a, b);
    renderBar('a', a, cmp.widthA);
    renderBar('b', b, cmp.widthB);
  });
});

// ------------------------------------------------------------ boot

if (parsed.errors.length) {
  const n = $('#url-notice');
  n.hidden = false;
  n.textContent = parsed.errors
    .map((e) => (e.key === 'u' ? `Unknown unit “${e.value}”, using GB/s.`
      : e.key === 'm' ? `Unknown mode “${e.value}”, using ${modeLabel()}.`
        : `Unknown interface “${e.value}” for ${e.key.toUpperCase()}, showing the default.`))
    .join(' ');
}
$('#count').textContent = String(INTERFACES.length);
renderChips();
$('#cat-sort').replaceChildren(...Object.entries(SORTS).map(([value, label]) => el('option', { value, text: label })));
$('#cat-sort').value = catState.sort;
renderMethod();
render();
history.replaceState(null, '', serializeState(state) + location.hash);
document.documentElement.classList.add('is-ready');
