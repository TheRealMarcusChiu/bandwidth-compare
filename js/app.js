import {
  INTERFACES, BY_ID, BASES, STATUSES, VERIFICATION, CATEGORIES, SOURCES, DEFAULT_A, DEFAULT_B,
} from './data.js';
import {
  UNITS, valueIn, formatValue, humanScale, formatRatio, compare, ratioSentence,
  parseState, serializeState, buildIndex, search,
} from './compare.js';
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
const state = { a: parsed.a, b: parsed.b, unit: parsed.unit };

// ------------------------------------------------------------ pickers

const unitLabel = () => UNITS[state.unit].label;
const meta = (item) => `${formatValue(valueIn(item, state.unit))} ${unitLabel()} · ${BASES[item.basis].short}`;

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

function badges(item) {
  const basis = BASES[item.basis];
  const list = el('ul', { class: 'badges', 'aria-label': 'Attributes' },
    el('li', { class: `badge badge-basis basis-${item.basis}`, title: basis.description }, el('b', { text: basis.short }), ` ${basis.label}`),
    el('li', { class: 'badge', title: 'Width' }, item.width.label),
    el('li', { class: `badge status-${item.status}` }, STATUSES[item.status]),
    el('li', { class: `badge ${item.verification === 'unverified' ? 'badge-warn' : 'badge-ok'}` }, VERIFICATION[item.verification]),
  );
  return list;
}

function renderSide(node, item, side) {
  const v = valueIn(item, state.unit);
  const hs = humanScale(item.GBps);
  const asym = item.asymmetric
    ? el('p', { class: 'asym' }, `Reverse direction: ${formatValue(state.unit === 'Gbps' ? item.asymmetric.reverseMbps / 1000 : item.asymmetric.reverseMbps / 8000)} ${unitLabel()}`)
    : null;
  const via = item.connectorOf && BY_ID.get(item.connectorOf)
    ? el('p', { class: 'via' }, 'Underlying link: ', el('button', { type: 'button', class: 'link', 'data-goto': item.connectorOf, 'data-side': side, text: BY_ID.get(item.connectorOf).name }))
    : null;
  node.replaceChildren(...[
    el('p', { class: 'side-tag' }, el('span', { class: `dot dot-${side}`, 'aria-hidden': 'true' }), `${side.toUpperCase()} · ${item.family}`),
    el('h2', { class: 'side-name', text: item.name }),
    el('p', { class: 'value' },
      el('span', { class: 'num', text: formatValue(v) }),
      el('span', { class: 'unit', text: unitLabel() })),
    hs ? el('p', { class: 'human', text: `= ${hs}` }) : null,
    asym,
    badges(item),
    el('p', { class: 'formula' }, el('code', { text: `${item.formula} = ${formatValue(item.GBps)} GB/s` })),
    item.encoding ? el('p', { class: 'enc' }, `Encoding: ${item.encoding}`) : null,
    item.notes ? el('p', { class: 'note', text: item.notes }) : null,
    via,
  ].filter(Boolean));
}

function renderBar(side, item, pct) {
  $(`#bar-name-${side}`).textContent = item.name;
  $(`#bar-val-${side}`).textContent = `${formatValue(valueIn(item, state.unit))} ${unitLabel()}`;
  const bar = $(`#bar-${side}`);
  bar.style.width = `${pct}%`;
  const tiny = $(`#bar-tiny-${side}`);
  const trackW = bar.parentElement.clientWidth || 1;
  const px = (trackW * pct) / 100;
  if (px < 1) {
    tiny.hidden = false;
    tiny.textContent = `${formatPct(pct)} of the longer bar: under one pixel at linear scale, so nothing is drawn.`;
  } else {
    tiny.hidden = true;
  }
}

const PCT = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2, maximumFractionDigits: 20 });
function formatPct(p) {
  return `${PCT.format(p)}%`;
}

function notice(kind, title, body) {
  return el('div', { class: `notice notice-${kind}`, role: 'note' },
    el('p', { class: 'notice-title', text: title }),
    body ? el('p', { class: 'notice-body', text: body }) : null);
}

function render() {
  const a = BY_ID.get(state.a);
  const b = BY_ID.get(state.b);
  const cmp = compare(a, b);

  pickers.a.setSelected(a);
  pickers.b.setSelected(b);
  pickers.a.refresh();
  pickers.b.refresh();

  renderSide($('#side-a'), a, 'a');
  renderSide($('#side-b'), b, 'b');

  const rn = $('#ratio-num');
  rn.textContent = cmp.same || cmp.equalValue ? '1×' : formatRatio(cmp.ratio);
  rn.classList.toggle('is-even', cmp.same || cmp.equalValue);
  const len = rn.textContent.length;
  $('.ratio').dataset.size = len > 9 ? 'xl' : len > 6 ? 'l' : 'm';
  $('#ratio-text').textContent = ratioSentence(a, b, cmp);

  renderBar('a', a, cmp.widthA);
  renderBar('b', b, cmp.widthB);
  $('#bars').setAttribute('aria-label',
    `Bar comparison: ${a.name} ${formatValue(valueIn(a, state.unit))} ${unitLabel()}, ${b.name} ${formatValue(valueIn(b, state.unit))} ${unitLabel()}.`);

  const notes = [];
  if (cmp.same) notes.push(notice('info', 'Identical selection.', 'Pick a different interface on either side to compare.'));
  if (cmp.mixedBasis) {
    notes.push(notice('warn', 'Mixed basis: not like for like.',
      `A is ${BASES[a.basis].label.toLowerCase()}; B is ${BASES[b.basis].label.toLowerCase()}. The ratio compares different kinds of number.`));
  }
  if (cmp.anyAsymmetric) notes.push(notice('info', 'Asymmetric link.', 'Only the faster direction is compared. Directions are never added together.'));
  if (cmp.anyUnverified) notes.push(notice('warn', 'Unverified figure.', 'At least one side is user-supplied seed data that has not been checked against a source.'));
  if (!cmp.same && cmp.ratio >= 1000) notes.push(notice('info', 'Extreme difference.', 'At linear scale the smaller bar may be too short to see. The numbers above are exact.'));
  $('#notices').replaceChildren(...notes);

  document.querySelectorAll('input[name="unit"]').forEach((r) => { r.checked = r.value === state.unit; });
  $('#cat-unit').textContent = unitLabel();
  renderCatalog();
  document.title = `${a.name} vs ${b.name} · BANDWIDTH / compare`;
}

// ------------------------------------------------------------ catalog

const catState = { q: '', cat: 'all' };

function renderChips() {
  const chips = $('#cat-chips');
  const all = [['all', 'All'], ...Object.entries(CATEGORIES)];
  chips.replaceChildren(...all.map(([key, label]) =>
    el('button', { type: 'button', class: 'chip', 'data-cat': key, 'aria-pressed': String(key === catState.cat), text: label })));
}

function renderCatalog() {
  const rows = search(index, catState.q).filter((i) => catState.cat === 'all' || i.category === catState.cat);
  $('#cat-empty').hidden = rows.length > 0;
  const body = $('#cat-body');
  let fam = null;
  const trs = [];
  for (const item of rows) {
    if (item.family !== fam) {
      fam = item.family;
      trs.push(el('tr', { class: 'cat-fam' }, el('th', { scope: 'rowgroup', colSpan: 5, text: fam })));
    }
    const isA = item.id === state.a;
    const isB = item.id === state.b;
    trs.push(el('tr', { class: isA || isB ? 'is-picked' : '' },
      el('th', { scope: 'row' }, el('span', { class: 'cat-name', text: item.name }),
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
    const cmp = compare(BY_ID.get(state.a), BY_ID.get(state.b));
    renderBar('a', BY_ID.get(state.a), cmp.widthA);
    renderBar('b', BY_ID.get(state.b), cmp.widthB);
  });
});

// ------------------------------------------------------------ boot

if (parsed.errors.length) {
  const n = $('#url-notice');
  n.hidden = false;
  n.textContent = parsed.errors
    .map((e) => (e.key === 'u' ? `Unknown unit “${e.value}”, using GB/s.` : `Unknown interface “${e.value}” for ${e.key.toUpperCase()}, showing the default.`))
    .join(' ');
}
$('#count').textContent = String(INTERFACES.length);
renderChips();
renderMethod();
render();
history.replaceState(null, '', serializeState(state) + location.hash);
document.documentElement.classList.add('is-ready');
