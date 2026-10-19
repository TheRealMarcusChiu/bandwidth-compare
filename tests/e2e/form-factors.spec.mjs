import { test, expect } from '@playwright/test';

// Ethernet transceiver form-factor guide: a separate page. Only its MSA-verified OSFP
// capacities are also comparator entries; every other guide row stays out of the comparator.
const TOTAL = 30;
const OSFP_NAMES = [
  'OSFP56 / OSFP400 module (400 Gb/s, 8×50G)', 'OSFP112 / OSFP800 module (800 Gb/s, 8×100G)', 'OSFP224 / OSFP1600 module (1.6 Tb/s, 8×200G)',
  'OSFP-XD module (800 Gb/s, 16×50G)', 'OSFP-XD module (1.6 Tb/s, 16×100G)', 'OSFP-XD module (3.2 Tb/s, 8×200G)',
];
const GROUPS = [['SFP', 6], ['SFP-DD / DSFP', 3], ['QSFP', 6], ['QSFP-DD', 4], ['OSFP', 4], ['Legacy', 7]];

const consoleErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errs = [];
  consoleErrors.set(page, errs);
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
});
test.afterEach(async ({ page }) => {
  expect(consoleErrors.get(page), 'console errors').toEqual([]);
});

const rows = (page) => page.locator('#ff-table tbody tr:not(.ff-group)');
const visibleNames = (page) => page.locator('#ff-table tbody:not([hidden]) tr:not([hidden]) th[scope="row"] .ff-name').allTextContents();

test('guide lists every form factor in its group with six semantic columns', async ({ page }) => {
  await page.goto('/form-factors.html');
  await expect(page).toHaveTitle(/form factors/i);
  await expect(page.locator('#ff-table caption')).toContainText(/form factors/i);
  await expect(page.locator('#ff-table thead th[scope="col"]')).toHaveText([
    'Form factor', 'Ethernet data rate', 'Fiber/medium', 'Representative reach', 'Module-dependent details', 'Typical connector',
  ]);
  await expect(rows(page)).toHaveCount(TOTAL);
  const groups = page.locator('#ff-table tbody');
  await expect(groups).toHaveCount(GROUPS.length);
  for (const [i, [label, n]] of GROUPS.entries()) {
    const g = groups.nth(i);
    await expect(g.locator('th[scope="rowgroup"]')).toHaveText(label);
    await expect(g.locator('tr:not(.ff-group)')).toHaveCount(n);
  }
  await expect(page.locator('#ff-count')).toHaveText(`${TOTAL} form factors`);
  // OSFP-XD shows the MSA mapping, including the 8×200G caveat.
  const xd = page.locator('#ff-table tr', { has: page.locator('.ff-name', { hasText: /^OSFP-XD$/ }) });
  await expect(xd).toContainText('3.2T = 8×200G');
  await expect(xd).toContainText('not 16×200G');
  await expect(xd.locator('.ff-status')).toHaveText('OSFP MSA: rate & lanes');
  // Unknown values are labelled, not blank.
  const cxp = page.locator('#ff-table tr', { has: page.locator('.ff-name', { hasText: /^CXP$/ }) });
  await expect(cxp.locator('td').first()).toHaveText(/Not source-verified in this update/);
  // Visible provenance and caveats with the official links.
  const notes = page.locator('#ff-sources');
  await expect(notes.locator('a[href="https://www.osfpmsa.org/"]')).toHaveCount(1);
  await expect(notes.locator('a[href="https://www.snia.org/technology-communities/sff/specifications"]')).toHaveCount(1);
  await expect(notes).toContainText(/QSFP-DD MSA.*inaccessible/i);
  await expect(page.locator('#ff-caveats')).toContainText(/illustrative/i);
});

test('search filters across cells, announces the count and shows a no-results state', async ({ page }) => {
  await page.goto('/form-factors.html');
  const q = page.locator('#ff-q');
  const count = page.locator('#ff-count');
  await expect(count).toHaveAttribute('aria-live', 'polite');
  for (const [term, expected] of [['SFP112', ['SFP112']], ['osfp-xd', ['OSFP-XD']], ['QSFP-DD1600', ['QSFP-DD1600']], ['OM4', ['SFP+', 'SFP28']]]) {
    await q.fill(term);
    expect(await visibleNames(page)).toEqual(expected);
    await expect(count).toHaveText(`${expected.length} of ${TOTAL} form factors`);
    await expect(page.locator('#ff-empty')).toBeHidden();
  }
  // Groups without a match are hidden entirely.
  await q.fill('SFP112');
  await expect(page.locator('#ff-table tbody:not([hidden])')).toHaveCount(1);
  await q.fill('nonexistent-zzz');
  await expect(page.locator('#ff-empty')).toBeVisible();
  await expect(page.locator('#ff-empty')).toContainText('nonexistent-zzz');
  await expect(count).toHaveText(`0 of ${TOTAL} form factors`);
  await expect(page.locator('#ff-scroll')).toBeHidden();
  await q.fill('');
  await expect(rows(page).filter({ visible: true })).toHaveCount(TOTAL);
  await expect(page.locator('#ff-empty')).toBeHidden();
});

test('keyboard: Tab reaches search, typing filters, Escape clears, the table region is focusable', async ({ page }) => {
  await page.goto('/form-factors.html');
  const q = page.locator('#ff-q');
  for (let i = 0; i < 10 && !(await q.evaluate((e) => e === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(q).toBeFocused();
  await page.keyboard.type('qsfp-dd');
  expect(await visibleNames(page)).toEqual(['QSFP-DD (200G)', 'QSFP-DD (400G)', 'QSFP-DD800', 'QSFP-DD1600']);
  await page.keyboard.press('Escape');
  await expect(q).toHaveValue('');
  await expect(page.locator('#ff-count')).toHaveText(`${TOTAL} form factors`);
  await page.keyboard.press('Tab');
  await expect(page.locator('#ff-scroll')).toBeFocused();
  await expect(page.locator('#ff-scroll')).toHaveAttribute('role', 'region');
});

test('comparator links to the guide; only the MSA-verified OSFP capacities reach the comparator', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#count')).toHaveText('354');
  await page.locator('#catalog summary').click();
  await page.locator('#cat-q').fill('osfp');
  await expect(page.locator('#cat-body .cat-name')).toHaveText(OSFP_NAMES);
  await expect(page.locator('#catalog-count')).toHaveText('6 of 354');
  await page.locator('#cat-q').fill('qsfp-dd1600');
  await expect(page.locator('#cat-empty')).toBeVisible();
  const link = page.locator('a[href="form-factors.html"]');
  await expect(link).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/\/form-factors\.html$/);
  await expect(rows(page)).toHaveCount(TOTAL);
  await page.locator('a[href="./"]').first().click();
  await expect(page.locator('#side-a .num')).toHaveText('7.877');
});

test('comparator: OSFP-XD 3.2T is selectable with its MSA source; QSFP-DD1600 is not', async ({ page }) => {
  await page.goto('/');
  // Default selection is unchanged by the additions.
  await expect(page.locator('#cb-a')).toHaveValue('PCIe 4.0 x4');
  await expect(page.locator('#cb-b')).toHaveValue('SATA III (6 Gb/s)');
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=sata3$/);
  await expect(page.locator('#count')).toHaveText('354');
  const sheet = await page.evaluate(() => document.documentElement.classList.contains('is-sheet-mode'));
  const open = async () => {
    if (sheet) await page.locator('.picker[data-side="b"] .cb-toggle').click();
    else await page.locator('#cb-b').click();
    await expect(page.locator('#lb-b')).toBeVisible();
  };
  // An unverified guide family is not a selectable result.
  await open();
  await page.locator('#cb-b').fill('QSFP-DD1600');
  await expect(page.locator('#lb-b .cb-empty')).toContainText('Nothing matches');
  await expect(page.locator('#lb-b [role="option"]')).toHaveCount(0);
  await page.locator('#cb-b').fill('osfp-xd');
  await expect(page.locator('#lb-b [role="option"]')).toHaveCount(3);
  await page.locator('#cb-b').fill('osfp-xd 3.2t');
  const opts = page.locator('#lb-b [role="option"]');
  await expect(opts).toHaveCount(1);
  await expect(opts).toContainText('OSFP-XD module (3.2 Tb/s, 8×200G)');
  await opts.click();
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=osfp-xd-3-2t$/);
  await expect(page.locator('#cb-b')).toHaveValue('OSFP-XD module (3.2 Tb/s, 8×200G)');
  await expect(page.locator('#side-b .num')).toHaveText('400');
  await expect(page.locator('#side-b .unit')).toHaveText('GB/s');
  await expect(page.locator('#side-b .side-tag')).toHaveText('B · OSFP-XD');
  await expect(page.locator('#side-b .badges')).toContainText('Connector');
  await expect(page.locator('#side-b .badges')).toContainText('8 × 200G lanes');
  await expect(page.locator('#side-b .badges')).not.toContainText('Unverified');
  await page.locator('#cmp-details summary').click();
  const d = page.locator('#detail-b');
  await expect(d).toContainText('Value400 GB/s = 3,200 Gb/s');
  await expect(d).toContainText('StatusConnector / form factor');
  await expect(d).toContainText('Cited source');
  await expect(d).toContainText('not 16 × 200G');
  await expect(d).toContainText('not usable payload');
  const src = d.locator('.detail-src a[href="https://www.osfpmsa.org/"]');
  await expect(src).toHaveCount(1);
  await expect(src).toContainText('OSFP MSA');
  await expect(d.locator('.detail-src')).toContainText('primary');
  // The methodology source list carries it too.
  await expect(page.locator('#sources a[href="https://www.osfpmsa.org/"]')).toHaveCount(1);
});

test('phone width: no body-level horizontal overflow; the table scrolls inside its region', async ({ browser, baseURL }) => {
  for (const [width, height] of [[375, 667], [360, 740]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(`${baseURL}/form-factors.html`);
    await expect(rows(page)).toHaveCount(TOTAL);
    const [dw, bw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth]);
    expect(dw, `document overflow at ${width}`).toBeLessThanOrEqual(iw);
    expect(bw, `body overflow at ${width}`).toBeLessThanOrEqual(iw);
    const region = page.locator('#ff-scroll');
    const box = await region.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width + 0.5);
    const [sw, cw] = await region.evaluate((e) => [e.scrollWidth, e.clientWidth]);
    expect(sw, 'table scrolls inside its own region').toBeGreaterThan(cw);
    // Form-factor names stay pinned while the region scrolls sideways.
    await region.evaluate((e) => { e.scrollLeft = 300; });
    const nameBox = await page.locator('#ff-table tbody tr:not(.ff-group) th[scope="row"]').first().boundingBox();
    expect(nameBox.x).toBeGreaterThanOrEqual(box.x - 0.5);
    expect((await page.locator('#ff-q').boundingBox()).height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `/tmp/bandwidth-form-factors-${width}x${height}.png`, fullPage: false });
    expect(errs).toEqual([]);
    await ctx.close();
  }
});

test('desktop: the table region does not clip rows vertically; the page scrolls instead', async ({ browser, baseURL }) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  await page.goto(`${baseURL}/form-factors.html`);
  await expect(rows(page)).toHaveCount(TOTAL);
  const [sh, ch] = await page.locator('#ff-scroll').evaluate((e) => [e.scrollHeight, e.clientHeight]);
  expect(sh, 'no inner vertical scroll').toBeLessThanOrEqual(ch + 1);
  await ctx.close();
});

test('guide makes no remote requests', async ({ page }) => {
  const remote = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1') && !r.url().startsWith('data:')) remote.push(r.url()); });
  await page.goto('/form-factors.html');
  await page.waitForLoadState('networkidle');
  expect(remote).toEqual([]);
});
