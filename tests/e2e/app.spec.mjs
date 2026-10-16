import { test, expect } from '@playwright/test';

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

const valueA = (page) => page.locator('#side-a .num');
const valueB = (page) => page.locator('#side-b .num');

test('defaults: PCIe 4.0 x4 vs SATA III with ratio and bars', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#cb-a')).toHaveValue('PCIe 4.0 x4');
  await expect(page.locator('#cb-b')).toHaveValue('SATA III (6 Gb/s)');
  await expect(valueA(page)).toHaveText('7.877');
  await expect(valueB(page)).toHaveText('0.6');
  await expect(page.locator('#ratio-num')).toHaveText('13.1×');
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=sata3$/);
  await expect(page.locator('#side-a .badge-basis')).toContainText('Encoding-adjusted');
  await expect(page.locator('#side-a .badges')).toContainText('x4');
  // Same basis: no mixed-basis notice.
  await expect(page.locator('#notices')).not.toContainText('Mixed basis');
  // Honest proportional bars.
  const wa = await page.locator('#bar-a').evaluate((e) => e.getBoundingClientRect().width);
  const wb = await page.locator('#bar-b').evaluate((e) => e.getBoundingClientRect().width);
  expect(wb / wa).toBeCloseTo(0.6 / 7.876923, 2);
});

test('keyboard: type to filter, arrows, Enter on side A', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('#cb-a');
  await input.focus();
  await page.keyboard.type('ddr5 6400');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#lb-a [role="option"]').first()).toContainText('DDR5-6400');
  await page.keyboard.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('DDR5-6400');
  await expect(valueA(page)).toHaveText('51.2');
  await expect(page).toHaveURL(/a=ddr5-6400/);
  // DDR (memory) vs SATA (encoding): mixed basis notice is shown.
  await expect(page.locator('#notices')).toContainText('Mixed basis');
});

test('keyboard: ArrowDown moves active option, Escape restores on side B', async ({ page }) => {
  await page.goto('/');
  const input = page.locator('#cb-b');
  await input.focus();
  await page.keyboard.type('usb4');
  const opts = page.locator('#lb-b [role="option"]');
  await expect(opts).toHaveCount(4);
  await expect(opts.nth(0)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(opts.nth(1)).toHaveAttribute('aria-selected', 'true');
  const active = await input.getAttribute('aria-activedescendant');
  expect(active).toBe(await opts.nth(1).getAttribute('id'));
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp'); // wraps to last
  await expect(opts.nth(3)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(input).toHaveValue('SATA III (6 Gb/s)');
  // Re-open and pick with Enter
  await page.keyboard.type('usb4 40');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('USB4 40Gbps (v1.0)');
  await expect(valueB(page)).toHaveText('5');
  await expect(page.locator('#side-b .badge-basis')).toContainText('Advertised link rate');
});

test('mouse: click to open, filter and choose on both sides', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cb-a').click();
  await expect(page.locator('#lb-a')).toBeVisible();
  await page.locator('#cb-a').fill('hbm3e');
  await page.locator('#lb-a [role="option"]', { hasText: 'HBM3E' }).click();
  await expect(valueA(page)).toHaveText('1,177.6');

  await page.locator('.picker[data-side="b"] .cb-toggle').click();
  await expect(page.locator('#lb-b')).toBeVisible();
  await page.locator('#cb-b').fill('gddr6w');
  await page.locator('#lb-b [role="option"]').first().click();
  await expect(valueB(page)).toHaveText('176');
  await expect(page.locator('#ratio-num')).toHaveText('6.69×');
});

test('empty state and outside click dismiss', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cb-a').click();
  await page.locator('#cb-a').fill('qqqqzzz');
  await expect(page.locator('#lb-a .cb-empty')).toContainText('Nothing matches');
  await expect(page.locator('#lb-a [role="option"]')).toHaveCount(0);
  await page.keyboard.press('Enter'); // no-op
  await page.mouse.click(5, 600);
  await expect(page.locator('#lb-a')).toBeHidden();
  await expect(page.locator('#cb-a')).toHaveValue('PCIe 4.0 x4');
});

test('swap exchanges sides and URL', async ({ page }) => {
  await page.goto('/?a=hbm3&b=ddr4-3200');
  await page.locator('#swap').click();
  await expect(page.locator('#cb-a')).toHaveValue('DDR4-3200');
  await expect(page.locator('#cb-b')).toHaveValue('HBM3');
  await expect(valueA(page)).toHaveText('25.6');
  await expect(page).toHaveURL(/a=ddr4-3200&b=hbm3/);
  await expect(page.locator('#ratio-num')).toHaveText('32×');
});

test('unit toggle switches to Gb/s and persists in URL', async ({ page }) => {
  await page.goto('/');
  await page.locator('label:has(input[value="Gbps"])').click();
  await expect(page.locator('#side-a .unit')).toHaveText('Gb/s');
  await expect(valueA(page)).toHaveText('63.02');
  await expect(valueB(page)).toHaveText('4.8');
  await expect(page.locator('#ratio-num')).toHaveText('13.1×'); // unit-independent
  await expect(page).toHaveURL(/u=Gbps/);
  await page.reload();
  await expect(page.locator('input[value="Gbps"]')).toBeChecked();
  await expect(valueA(page)).toHaveText('63.02');
});

test('share URL restores state; copy link button', async ({ page, context, browserName }) => {
  await page.goto('/?a=tb5-boost&b=usb4v2-80&u=Gbps');
  await expect(page.locator('#cb-a')).toHaveValue('Thunderbolt 5 Bandwidth Boost (120 Gb/s)');
  await expect(valueA(page)).toHaveText('120');
  await expect(valueB(page)).toHaveText('80');
  await expect(page.locator('#side-a .asym')).toContainText('Reverse direction: 40 Gb/s');
  await expect(page.locator('#notices')).toContainText('Asymmetric link');
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#share').click();
  await expect(page.locator('#toast')).toContainText(/Link copied|Copy this link/);
});

test('invalid URL ids fall back with a notice', async ({ page }) => {
  await page.goto('/?a=not-a-thing&b=%3Cimg%20src%3Dx%3E&u=furlongs');
  await expect(page.locator('#url-notice')).toBeVisible();
  await expect(page.locator('#url-notice')).toContainText('Unknown interface “not-a-thing”');
  await expect(page.locator('#url-notice')).toContainText('Unknown unit');
  await expect(page.locator('#url-notice img')).toHaveCount(0); // rendered as text
  await expect(page.locator('#cb-a')).toHaveValue('PCIe 4.0 x4');
  await expect(page.locator('#cb-b')).toHaveValue('SATA III (6 Gb/s)');
  await expect(page).toHaveURL(/\?a=pcie4-x4&b=sata3$/);
});

test('identical selection', async ({ page }) => {
  await page.goto('/?a=sata3&b=sata3');
  await expect(page.locator('#ratio-num')).toHaveText('1×');
  await expect(page.locator('#notices')).toContainText('Identical selection');
});

test('extreme difference: exact ratio, sub-pixel bar not padded', async ({ page }) => {
  await page.goto('/?a=hbm4-samsung-max&b=usb1-low');
  await expect(page.locator('#ratio-num')).toHaveText('17,749,333×');
  const w = await page.locator('#bar-b').evaluate((e) => e.getBoundingClientRect().width);
  expect(w).toBeLessThan(1);
  await expect(page.locator('#bar-tiny-b')).toBeVisible();
  await expect(page.locator('#bar-tiny-b')).toContainText('under one pixel');
  await expect(page.locator('#notices')).toContainText('Mixed basis');
  await expect(page.locator('#side-b .human')).toHaveText('= 187.5 kB/s');
});

test('unverified data is labeled', async ({ page }) => {
  await page.goto('/?a=ddr5-9200&b=eth-1600g');
  await expect(page.locator('#side-a .badge-warn')).toHaveText('User-supplied, unverified');
  await expect(page.locator('#side-b .badges')).toContainText('In development, not ratified');
  await expect(page.locator('#notices')).toContainText('Unverified figure');
});

test('catalog filters and sets selections', async ({ page }) => {
  await page.goto('/');
  await page.locator('#catalog summary').click();
  await page.locator('#cat-q').fill('u.2');
  await expect(page.locator('#cat-body tr:not(.cat-fam)')).toHaveCount(3);
  await page.locator('button[aria-label="Set U.2 NVMe · PCIe 5.0 x4 as B"]').click();
  await expect(page.locator('#cb-b')).toHaveValue('U.2 NVMe · PCIe 5.0 x4');
  await expect(page.locator('#side-b .badges')).toContainText('Connector / form factor');
  await page.locator('#cat-q').fill('');
  await page.locator('.chip[data-cat="network"]').click();
  await expect(page.locator('#cat-body tr:not(.cat-fam)')).toHaveCount(14);
  await page.locator('#cat-q').fill('nothing-here-at-all');
  await expect(page.locator('#cat-empty')).toBeVisible();
});

test('methodology lists bases and source links', async ({ page }) => {
  await page.goto('/');
  await page.locator('#method summary').click();
  await expect(page.locator('#bases dt')).toHaveCount(4);
  const links = page.locator('#sources a');
  expect(await links.count()).toBeGreaterThan(20);
  for (const href of await links.evaluateAll((as) => as.map((a) => a.href))) expect(href).toMatch(/^https:\/\//);
});

test('no horizontal overflow, touch targets', async ({ page }) => {
  for (const q of ['/', '/?a=hbm4-samsung-max&b=usb1-low', '/?a=ddr5-mrdimm-12800&b=sd-express-pcie4-x2&u=Gbps']) {
    await page.goto(q);
    await page.locator('#catalog summary').click();
    await page.locator('#method summary').click();
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(sw, `overflow on ${q}`).toBeLessThanOrEqual(iw);
    const [cs, cw] = await page.locator('.cat-wrap').evaluate((e) => [e.scrollWidth, e.clientWidth]);
    expect(cs, `catalog table clipped on ${q}`).toBeLessThanOrEqual(cw);
  }
  for (const sel of ['#cb-a', '#cb-b', '#swap', '#share']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.height, sel).toBeGreaterThanOrEqual(44);
  }
});

test('no remote requests', async ({ page }) => {
  const remote = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1') && !r.url().startsWith('data:')) remote.push(r.url()); });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(remote).toEqual([]);
});

test('screenshots', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/bandwidth-${info.project.name}.png` });
});
