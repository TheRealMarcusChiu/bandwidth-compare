import {
  FORM_FACTORS, FF_GROUPS, FF_COLUMNS, FF_SOURCES, FF_STATUS, cellText, filterFormFactors,
} from './form-factors.js';

const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('data-') || k.startsWith('aria-') || k === 'scope' || k === 'title' || k === 'href' || k === 'rel' || k === 'target') n.setAttribute(k, v);
    else n[k] = v;
  }
  n.append(...kids.filter((c) => c != null));
  return n;
};

const SOURCE_STATUS = {
  verified: 'fetched and read; verified for OSFP rate/lane mappings',
  'index-only': 'official index only; not proof of any figure',
  inaccessible: 'inaccessible in this audit (timed out); not verified',
  unverified: 'user-supplied; unverified',
};

const table = $('#ff-table');
const total = FORM_FACTORS.length;
const rowNodes = new Map();
const groupNodes = new Map();

function build() {
  table.querySelector('thead tr').replaceChildren(...FF_COLUMNS.map((c) => el('th', { scope: 'col', text: c.label })));
  for (const [key, label] of Object.entries(FF_GROUPS)) {
    const body = el('tbody', { 'data-group': key },
      el('tr', { class: 'ff-group' }, el('th', { scope: 'rowgroup', colSpan: FF_COLUMNS.length }, el('span', { text: label }))));
    for (const r of FORM_FACTORS.filter((f) => f.group === key)) {
      const tr = el('tr', { 'data-id': r.id },
        el('th', { scope: 'row' },
          el('span', { class: 'ff-name', text: r.name }),
          el('span', { class: `ff-status ff-status-${r.status}`, title: FF_STATUS[r.status].long, text: FF_STATUS[r.status].short })),
        ...FF_COLUMNS.slice(1).map((c) => el('td', r[c.key] == null ? { class: 'ff-unk', text: cellText(r, c.key) } : { text: cellText(r, c.key) })));
      rowNodes.set(r.id, tr);
      body.append(tr);
    }
    groupNodes.set(key, body);
    table.append(body);
  }
  $('#ff-sources').replaceChildren(...Object.values(FF_SOURCES).map((s) =>
    el('li', {},
      s.url ? el('a', { href: s.url, rel: 'noopener noreferrer', target: '_blank', text: s.title }) : el('span', { text: s.title }),
      el('span', { class: 'src-meta', text: ` ${s.publisher} · ${SOURCE_STATUS[s.status]}. ${s.note}` }))));
  $('#ff-total').textContent = String(total);
}

function render(query) {
  const hits = new Set(filterFormFactors(FORM_FACTORS, query).map((r) => r.id));
  for (const [id, tr] of rowNodes) tr.hidden = !hits.has(id);
  for (const [key, body] of groupNodes) body.hidden = !FORM_FACTORS.some((r) => r.group === key && hits.has(r.id));
  const q = query.trim();
  $('#ff-count').textContent = q ? `${hits.size} of ${total} form factors` : `${total} form factors`;
  const empty = $('#ff-empty');
  empty.hidden = hits.size > 0;
  empty.textContent = hits.size ? '' : `No form factors match “${q}”. Try a family (QSFP), a rate (400G) or a connector (LC).`;
  $('#ff-scroll').hidden = hits.size === 0;
  $('#ff-hint').hidden = hits.size === 0;
}

const input = $('#ff-q');
input.addEventListener('input', () => render(input.value));
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && input.value) {
    e.preventDefault();
    input.value = '';
    render('');
  }
});

build();
render(input.value);
