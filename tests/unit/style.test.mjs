// Shared site style: warm Thoughts palette, Newsreader display + JetBrains Mono body,
// self-hosted fonts under the same-origin CSP. Rendering is covered by tests/e2e/style.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const PAGES = ['index.html', 'form-factors.html'];

export const TOKENS = {
  '--bg': '#0f0c09', '--surface': '#14110b', '--surface-2': '#1a150e', '--line': '#2a2218',
  '--ink': '#ece1cf', '--ink-2': '#cdc1ab', '--ink-3': '#a99e88',
  '--accent': '#d8a942', '--accent-light': '#e6bb58', '--accent-muted': '#b78f3a',
};
const FONTS = [
  ['fonts/jetbrains-mono-latin-wght-normal.woff2', 'JetBrains Mono', 'normal'],
  ['fonts/newsreader-latin-opsz-wght-normal.woff2', 'Newsreader', 'normal'],
  ['fonts/newsreader-latin-opsz-wght-italic.woff2', 'Newsreader', 'italic'],
];

test('palette tokens match the default Thoughts design', async () => {
  const css = await read('styles.css');
  const rootBlock = css.match(/:root\s*\{([^}]*)\}/)[1];
  for (const [k, v] of Object.entries(TOKENS)) assert.match(rootBlock, new RegExp(`${k}:\\s*${v};`), k);
  // The old charcoal/lime palette is gone.
  for (const old of ['#0c0d0c', '#c4d97f', 'rgb(196 217 127', '#151715', '#869f39']) assert.ok(!css.includes(old), old);
});

test('default corner radius matches the small Thoughts cards and controls', async () => {
  const rootBlock = (await read('styles.css')).match(/:root\s*\{([^}]*)\}/)[1];
  assert.match(rootBlock, /--radius:\s*6px;/);
});

test('typography by role: two font tokens, no per-component stacks, no faux bold', async () => {
  const css = await read('styles.css');
  assert.match(css, /--display:\s*"Newsreader",[^;]*serif;/);
  assert.match(css, /--mono:\s*"JetBrains Mono",[^;]*monospace;/);
  assert.doesNotMatch(css, /--sans|Inter\b/);
  // Every font-family / font shorthand uses a token (or inherit), never a literal family list.
  // (@font-face blocks name the faces themselves and are checked below.)
  const rules = css.replace(/@font-face\s*\{[^}]*\}/g, '');
  const decls = [...rules.matchAll(/(?<![-\w])font(?:-family)?\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());
  assert.ok(decls.length > 10);
  for (const d of decls) {
    if (/^inherit$/.test(d)) continue;
    assert.match(d, /var\(--(display|mono)\)/, `font declaration without a token: ${d}`);
  }
  assert.match(css, /body\s*\{[^}]*font:[^;]*var\(--mono\)/);
  // The variable fonts span 400–600: heavier weights would be synthesized.
  for (const [, w] of css.matchAll(/font-weight:\s*(\d+)/g)) assert.ok(Number(w) <= 600, `font-weight ${w}`);
  for (const [, w] of css.matchAll(/(?<![-\w])font:\s*(\d{3})\s/g)) assert.ok(Number(w) <= 600, `font ${w}`);
});

test('self-hosted @font-face: local WOFF2, weights 400–600, swap', async () => {
  const css = await read('styles.css');
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  assert.equal(faces.length, 3);
  for (const [file, family, style] of FONTS) {
    const f = faces.find((x) => x.includes(`url("${file}")`));
    assert.ok(f, file);
    assert.match(f, new RegExp(`font-family:\\s*"${family}"`), file);
    assert.match(f, new RegExp(`font-style:\\s*${style}`), file);
    assert.match(f, /font-weight:\s*400 600/, file);
    assert.match(f, /font-display:\s*swap/, file);
    assert.match(f, /format\("woff2"\)/, file);
    const bytes = await readFile(new URL(file, root));
    assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2', `${file} is WOFF2`);
  }
  assert.match(css, /\.mark-b\s*\{[^}]*font-style:\s*italic/, 'Newsreader italic is used, not just declared');
});

test('OFL licenses ship with the fonts', async () => {
  for (const [name, holder] of [['Newsreader', 'The Newsreader Project Authors'], ['JetBrainsMono', 'The JetBrains Mono Project Authors']]) {
    const t = await read(`fonts/OFL-${name}.txt`);
    assert.ok(t.includes(holder), name);
    assert.match(t, /SIL Open Font License, Version 1\.1/);
    assert.match(t, /PERMISSION & CONDITIONS/);
  }
  assert.ok((await stat(new URL('fonts/', root))).isDirectory());
});

test('no third-party font runtime; same-origin CSP with explicit font-src', async () => {
  const csp = (h) => h.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  for (const p of [...PAGES, 'styles.css']) {
    const t = await read(p);
    assert.doesNotMatch(t, /fonts\.googleapis|fonts\.gstatic|@import/, p);
  }
  for (const p of PAGES) {
    const h = await read(p);
    const policy = csp(h);
    assert.match(policy, /default-src 'self'/, p);
    assert.match(policy, /font-src 'self'/, p);
    assert.doesNotMatch(policy, /https?:|\*/, `${p}: no remote origins`);
    assert.match(h, /<meta name="theme-color" content="#0f0c09">/, p);
  }
  // The dev server serves the font directory with the right type.
  const serve = await read('scripts/serve.mjs');
  assert.match(serve, /'\.woff2': 'font\/woff2'/);
  assert.match(serve, /allowed = new Set\(\[[^\]]*'fonts'/);
});
