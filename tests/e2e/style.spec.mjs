import { test, expect } from '@playwright/test';

// Shared site style on both pages: self-hosted fonts actually load (not just declared),
// each text role resolves to its font, the warm palette is applied and contrast holds.
const PAGES = ['/', '/form-factors.html'];
const FACES = [
  ['400 16px "JetBrains Mono"', 'JetBrains Mono', 'normal'],
  ['600 16px "JetBrains Mono"', 'JetBrains Mono', 'normal'],
  ['400 16px Newsreader', 'Newsreader', 'normal'],
  ['600 16px Newsreader', 'Newsreader', 'normal'],
  ['italic 400 16px Newsreader', 'Newsreader', 'italic'],
];

const first = (family) => family.split(',')[0].trim().replace(/^["']|["']$/g, '');

for (const path of PAGES) {
  test(`fonts load from this origin and resolve by role: ${path}`, async ({ page }) => {
    const remote = [];
    const fontResponses = [];
    page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1') && !r.url().startsWith('data:')) remote.push(r.url()); });
    page.on('response', (r) => { if (r.url().endsWith('.woff2')) fontResponses.push([new URL(r.url()).pathname, r.status(), r.headers()['content-type']]); });
    await page.goto(path);
    const loaded = await page.evaluate(async (faces) => {
      await document.fonts.ready;
      const out = [];
      for (const [spec, family, style] of faces) {
        const got = await document.fonts.load(spec, 'BANDWIDTH 0123456789 ×');
        out.push({
          spec,
          n: got.length,
          ok: got.every((f) => f.status === 'loaded' && f.family.replace(/"/g, '') === family && f.style === style),
          check: document.fonts.check(spec, 'BANDWIDTH 0123456789'),
        });
      }
      return out;
    }, FACES);
    for (const r of loaded) {
      expect(r.n, `${r.spec}: a face matched`).toBeGreaterThan(0);
      expect(r.ok, `${r.spec}: loaded`).toBe(true);
      expect(r.check, `${r.spec}: document.fonts.check`).toBe(true);
    }
    await page.waitForLoadState('networkidle');
    const files = [...new Set(fontResponses.map(([p]) => p))].sort();
    expect(files).toEqual([
      '/fonts/jetbrains-mono-latin-wght-normal.woff2',
      '/fonts/newsreader-latin-opsz-wght-italic.woff2',
      '/fonts/newsreader-latin-opsz-wght-normal.woff2',
    ]);
    for (const [p, status, type] of fontResponses) {
      expect(status, p).toBe(200);
      expect(type, p).toBe('font/woff2');
    }
    expect(remote).toEqual([]);

    // Role check: every rendered element resolves to one of the two families.
    const roles = await page.evaluate(() => {
      const fam = (el) => getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
      const all = [...document.body.querySelectorAll('*')].filter((e) => e.getClientRects().length && !['SCRIPT', 'STYLE', 'svg'].includes(e.tagName));
      return {
        stray: [...new Set(all.map(fam))].filter((f) => f !== 'JetBrains Mono' && f !== 'Newsreader'),
        body: fam(document.body),
        h1: fam(document.querySelector('h1')),
        mark: fam(document.querySelector('.mark')),
        headings: [...document.querySelectorAll('h1, h2, h3, .drawer-title')].filter((e) => !e.closest('.vh') && e.getClientRects().length).map((e) => [e.className || e.tagName, fam(e)]),
        inputs: [...document.querySelectorAll('input, button, select, td, .badge, code, th')].filter((e) => e.getClientRects().length).map(fam),
        markB: document.querySelector('.mark-b') ? getComputedStyle(document.querySelector('.mark-b')).fontStyle : 'italic',
        bg: getComputedStyle(document.body).backgroundColor,
        ink: getComputedStyle(document.body).color,
      };
    });
    expect(roles.stray, 'no element falls back to another family').toEqual([]);
    expect(roles.body).toBe('JetBrains Mono');
    expect(roles.h1).toBe('Newsreader');
    expect(roles.mark, 'site mark on both pages').toBe('Newsreader');
    for (const [name, f] of roles.headings) expect(f, `${name} heading`).toBe('Newsreader');
    expect(new Set(roles.inputs)).toEqual(new Set(['JetBrains Mono']));
    expect(roles.markB).toBe('italic');
    expect(roles.bg).toBe('rgb(15, 12, 9)');
    expect(roles.ink).toBe('rgb(236, 225, 207)');
  });
}

// WCAG relative luminance contrast, computed from the live custom properties.
function contrastScript() {
  const hex = (h) => h.trim().replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255);
  const lum = (h) => { const [r, g, b] = hex(h).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const cs = getComputedStyle(document.documentElement);
  const v = (k) => cs.getPropertyValue(k).trim();
  return { v: Object.fromEntries(['--bg', '--surface', '--surface-2', '--ink', '--ink-2', '--ink-3', '--accent', '--accent-light', '--bar-a', '--bar-b', '--warn', '--err', '--accent-ink'].map((k) => [k, v(k)])), cr: (a, b) => cr(v(a), v(b)) };
}

test('palette contrast: text AA on every surface, A/B distinct and visible', async ({ page }) => {
  await page.goto('/');
  const r = await page.evaluate(`(${contrastScript.toString()})()`);
  expect(r.v['--bg']).toBe('#0f0c09');
  expect(r.v['--accent']).toBe('#d8a942');
  const ratios = await page.evaluate(`(() => { const s = (${contrastScript.toString()})(); const out = {};
    for (const bg of ['--bg', '--surface', '--surface-2']) for (const fg of ['--ink', '--ink-2', '--ink-3', '--accent', '--accent-light', '--bar-a', '--bar-b', '--warn', '--err']) out[fg + ' on ' + bg] = s.cr(fg, bg);
    out['--accent-ink on --accent'] = s.cr('--accent-ink', '--accent');
    out['--bg on --bar-a'] = s.cr('--bg', '--bar-a');
    out['--bg on --bar-b'] = s.cr('--bg', '--bar-b');
    return out; })()`);
  for (const [pair, ratio] of Object.entries(ratios)) {
    const min = pair.startsWith('--ink on') || pair.startsWith('--ink-2 on') ? 7 : 4.5;
    expect(ratio, pair).toBeGreaterThanOrEqual(min);
  }
  expect(r.v['--bar-a']).not.toBe(r.v['--bar-b']);
  // A and B differ in hue, not only lightness, and keep their explicit letters.
  const hue = (h) => { const [rr, g, b] = h.replace('#', '').match(/../g).map((x) => parseInt(x, 16)); const mx = Math.max(rr, g, b); const mn = Math.min(rr, g, b); const d = mx - mn; if (!d) return 0; const k = mx === rr ? ((g - b) / d) % 6 : mx === g ? (b - rr) / d + 2 : (rr - g) / d + 4; return (k * 60 + 360) % 360; };
  const dh = Math.abs(hue(r.v['--bar-a']) - hue(r.v['--bar-b']));
  expect(Math.min(dh, 360 - dh)).toBeGreaterThanOrEqual(90);
  await expect(page.locator('#side-a .side-tag')).toContainText('A ·');
  await expect(page.locator('#side-b .side-tag')).toContainText('B ·');
  const [dotA, dotB, barA, barB] = await page.evaluate(() => ['#side-a .dot', '#side-b .dot', '#bar-a', '#bar-b'].map((s) => getComputedStyle(document.querySelector(s)).backgroundColor));
  expect(dotA).toBe(barA);
  expect(dotB).toBe(barB);
  expect(dotA).not.toBe(dotB);
});

test('focus ring uses the gold accent and stays visible', async ({ page }) => {
  await page.goto('/');
  await page.locator('#swap').focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineColor, parseFloat(s.outlineWidth)]; });
  expect(ring[0]).toBe('solid');
  expect(ring[1]).toBe('rgb(216, 169, 66)');
  expect(ring[2]).toBeGreaterThanOrEqual(2);
});
