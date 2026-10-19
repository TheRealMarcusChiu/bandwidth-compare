import { test, expect } from '@playwright/test';

// Ethernet transceiver form-factor guide: a separate page. Its MSA-verified OSFP capacities
// are source-verified comparator entries; its other numeric rates are user-supplied,
// unverified comparator entries; DSFP and the legacy names (no rate) stay out.
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

test('comparator links to the guide; rows with a rate reach the comparator, DSFP and legacy do not', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#count')).toHaveText('372');
  await page.locator('#catalog summary').click();
  await page.locator('#cat-q').fill('osfp');
  await expect(page.locator('#cat-body .cat-name')).toHaveText(OSFP_NAMES);
  await expect(page.locator('#catalog-count')).toHaveText('6 of 372');
  await page.locator('#cat-q').fill('qsfp-dd1600');
  await expect(page.locator('#cat-body .cat-name')).toHaveText(['QSFP-DD1600 module (1.6 Tb/s, user-supplied)']);
  await expect(page.locator('#cat-body .cat-flag')).toHaveText(['unverified']);
  await page.locator('#cat-q').fill('user-supplied');
  await expect(page.locator('#catalog-count')).toHaveText('18 of 372');
  for (const q of ['dsfp', 'xfp', 'cfp2', 'cpak', 'cxp', 'xenpak']) {
    await page.locator('#cat-q').fill(q);
    await expect(page.locator('#cat-empty'), q).toBeVisible();
  }
  const link = page.locator('a[href="form-factors.html"]');
  await expect(link).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/\/form-factors\.html$/);
  await expect(rows(page)).toHaveCount(TOTAL);
  await page.locator('a[href="./"]').first().click();
  await expect(page.locator('#side-a .num')).toHaveText('7.877');
});

test('comparator: OSFP-XD 3.2T is selectable with its MSA source; DSFP is not', async ({ page }) => {
  await page.goto('/');
  // Default selection is unchanged by the additions.
  await expect(page.locator('#cb-a')).toHaveValue('PCIe 4.0 x4');
  await expect(page.locator('#cb-b')).toHaveValue('SATA III (6 Gb/s)');
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=sata3$/);
  await expect(page.locator('#count')).toHaveText('372');
  const sheet = await page.evaluate(() => document.documentElement.classList.contains('is-sheet-mode'));
  const open = async () => {
    if (sheet) await page.locator('.picker[data-side="b"] .cb-toggle').click();
    else await page.locator('#cb-b').click();
    await expect(page.locator('#lb-b')).toBeVisible();
  };
  // A guide family without a rate is not a selectable result.
  await open();
  await page.locator('#cb-b').fill('DSFP');
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

const pickerOpener = async (page, side) => {
  const sheet = await page.evaluate(() => document.documentElement.classList.contains('is-sheet-mode'));
  return async () => {
    if (sheet) await page.locator(`.picker[data-side="${side}"] .cb-toggle`).click();
    else await page.locator(`#cb-${side}`).click();
    await expect(page.locator(`#lb-${side}`)).toBeVisible();
  };
};

test('comparator: a user-supplied form factor is selectable and shows the unverified warning and provenance', async ({ page }) => {
  await page.goto('/');
  const open = await pickerOpener(page, 'b');
  await open();
  await page.locator('#cb-b').fill('QSFP-DD1600');
  const opts = page.locator('#lb-b [role="option"]');
  await expect(opts).toHaveCount(1);
  await expect(opts).toContainText('QSFP-DD1600 module (1.6 Tb/s, user-supplied)');
  await opts.click();
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=qsfp-dd-1600g$/);
  await expect(page.locator('#cb-b')).toHaveValue('QSFP-DD1600 module (1.6 Tb/s, user-supplied)');
  // 1600 Gb/s as supplied ÷ 8, no coding adjustment.
  await expect(page.locator('#side-b .num')).toHaveText('200');
  await expect(page.locator('#side-b .side-tag')).toHaveText('B · QSFP-DD');
  const badges = page.locator('#side-b .badges');
  await expect(badges).toContainText('ADV Advertised link rate');
  await expect(badges).toContainText('Lane mapping not source-verified');
  await expect(badges.locator('.status-user-supplied')).toHaveText('User-supplied');
  await expect(badges.locator('.status-user-supplied')).toHaveAttribute('title', 'User-supplied form-factor rate (not independently verified)');
  await expect(badges.locator('.badge-warn')).toHaveText('Unverified');
  await expect(badges).not.toContainText('Connector');
  await expect(page.locator('#notices')).toContainText('Unverified figure');
  await page.locator('#cmp-details summary').click();
  const d = page.locator('#detail-b');
  await expect(d).toContainText('Value200 GB/s = 1,600 Gb/s');
  await expect(d).toContainText('1600 Gb/s nominal rate as supplied ÷ 8 = 200 GB/s');
  await expect(d).toContainText('StatusUser-supplied form-factor rate (not independently verified)');
  await expect(d.locator('.badge-warn')).toHaveText('User-supplied, unverified');
  await expect(d).toContainText('site owner’s transceiver form-factor guide');
  await expect(d).toContainText('not independently verified');
  await expect(d).toContainText('not a verified Ethernet PHY or standard');
  await expect(d).toContainText('not payload throughput');
  await expect(d).toContainText('Lane mapping not source-verified.');
  // Provenance: the site owner's seed data only, with no link and no other citation.
  const src = d.locator('.detail-src');
  await expect(src).toHaveCount(1);
  await expect(src).toContainText('Seed data supplied by the site owner (not independently checked)');
  await expect(src).toContainText('User supplied · user');
  await expect(src.locator('a')).toHaveCount(0);
  await expect(d).not.toContainText('Cited source');
});

test('comparator: SFP224 keeps its developing caveat; a guide lane mapping is shown as unverified', async ({ page }) => {
  await page.goto('/?a=sfp224-200g&b=qsfp224-800g&m=raw');
  await expect(page.locator('#cb-a')).toHaveValue('SFP224 module (200 Gb/s, developing, user-supplied)');
  await expect(page.locator('#side-a .num')).toHaveText('25');
  await expect(page.locator('#side-a .badges')).toContainText('Not ratified');
  await expect(page.locator('#side-a .badge-warn')).toHaveText('Unverified');
  await expect(page.locator('#side-b .num')).toHaveText('100');
  await expect(page.locator('#side-b .badges')).toContainText('4 × 200G lanes (unverified)');
  await expect(page.locator('#side-b .badge-warn')).toHaveText('Unverified');
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-a')).toContainText('In development, not ratified');
  await expect(page.locator('#detail-a')).toContainText('Developing generation: current production/availability status not independently verified.');
  await expect(page.locator('#detail-b')).toContainText('Lane mapping as supplied in the guide, unverified: 4 × 200G electrical lanes.');
  // Raw mode shows the same nominal figure: nothing to un-adjust.
  await page.goto('/?a=sfp224-200g&b=qsfp224-800g');
  await expect(page.locator('#side-a .num')).toHaveText('25');
  await expect(page.locator('#side-b .num')).toHaveText('100');
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
