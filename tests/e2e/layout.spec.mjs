// Viewport-bound layout + mobile picker sheet. These tests create their own
// contexts at fixed sizes, so they run once (in the "desktop" project) instead
// of once per project.
import { test, expect } from '@playwright/test';

const PHONES = [
  { name: '375x667', viewport: { width: 375, height: 667 } },
  { name: '390x844', viewport: { width: 390, height: 844 } },
  { name: '360x740', viewport: { width: 360, height: 740 } },
];
const DESKTOPS = [
  { name: '1366x768', viewport: { width: 1366, height: 768 } },
  { name: '1440x900', viewport: { width: 1440, height: 900 } },
];
const CASES = {
  default: '/',
  'long-mixed-asym': '/?a=lpddr5x-10700&b=tb5-boost',
  'unverified-connector-gbps': '/?a=ddr5-mrdimm-12800&b=m2-nvme-pcie5-x4&u=Gbps',
  extreme: '/?a=hbm4-samsung-max&b=usb1-low',
  'long-usb-vs-unverified': '/?a=usb-5g&b=eth-1600g',
  'hbm4e-long-labels': '/?a=hbm4e-samsung-max&b=hbm4e-samsung-sample',
  'hbm4e-extreme': '/?a=hbm4e-samsung-max&b=usb1-low',
  'roadmap-vs-hdmi22': '/?a=pcie8-x16&b=hdmi22-frl&u=Gbps',
  'ddr-channels-unverified': '/?a=ddr5-9200-16ch&b=ddr3-1600-12ch',
  'raw-ddr-hbm4e': '/?a=ddr5-9200-16ch&b=hbm4e-samsung-max&m=raw',
  'raw-long-mixed-asym': '/?a=lpddr5x-10700&b=tb5-boost&m=raw&u=Gbps',
  'adjusted-unavailable-flag': '/?a=pcie8-x16&b=dp21-uhbr13-5',
  'raw-unavailable-flag-unverified': '/?a=eth-1600g&b=usb4v2-120&m=raw',
  'raw-long-ddr-extreme': '/?a=ddr5-9200-16ch&b=usb1-low&m=raw',
  'adjusted-long-ddr-three-flags': '/?a=ddr5-9200-16ch&b=sata3',
};

test.beforeEach(({}, info) => { test.skip(info.project.name !== 'desktop', 'fixed-size contexts; run once'); });

async function open(browser, baseURL, { viewport, phone }, url = '/') {
  const ctx = await browser.newContext({
    baseURL, viewport,
    ...(phone ? { isMobile: true, hasTouch: true, deviceScaleFactor: 3 } : {}),
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForTimeout(600); // bar width transition
  return { ctx, page, errors };
}

async function expectFits(page, label) {
  const m = await page.evaluate(() => {
    const c = document.querySelector('#compare').getBoundingClientRect();
    return {
      bottom: c.bottom, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth,
      num: parseFloat(getComputedStyle(document.querySelector('#side-a .num')).fontSize),
      ratio: parseFloat(getComputedStyle(document.querySelector('#ratio-num')).fontSize),
      badge: Math.min(...[...document.querySelectorAll('#compare .badge')].map((b) => parseFloat(getComputedStyle(b).fontSize))),
      // Nothing inside the compact comparison may be cut off horizontally.
      clipped: [...document.querySelectorAll('#compare *')].filter((e) => {
        const cs = getComputedStyle(e);
        return e.offsetParent && e.clientWidth > 1 && e.scrollWidth > e.clientWidth + 1 && cs.overflowX !== 'visible' && !e.matches('.cb-input, .cb-list, .vh, .vh *');
      }).map((e) => e.className || e.tagName),
    };
  });
  expect(m.bottom, `${label}: compact comparison ends inside the first viewport`).toBeLessThanOrEqual(m.ih);
  expect(m.sw, `${label}: no horizontal overflow`).toBeLessThanOrEqual(m.iw);
  expect(m.num, `${label}: value legible`).toBeGreaterThanOrEqual(26);
  expect(m.ratio, `${label}: ratio legible`).toBeGreaterThanOrEqual(28);
  expect(m.badge, `${label}: badges legible`).toBeGreaterThanOrEqual(11);
  expect(m.clipped, `${label}: nothing clipped`).toEqual([]);
  for (const sel of ['#cb-a', '#cb-b', '#swap', '.seg-mode', '#ratio-num', '#bar-a', '#side-a .num', '#side-b .num', '#side-a .badge-basis', '#side-b .badge-basis']) {
    await expect(page.locator(sel).first(), `${label}: ${sel}`).toBeVisible();
  }
}

for (const [group, sizes, phone] of [['phone', PHONES, true], ['desktop', DESKTOPS, false]]) {
  for (const size of sizes) {
    test(`fits first viewport: ${group} ${size.name}`, async ({ browser, baseURL }) => {
      const { ctx, page, errors } = await open(browser, baseURL, { ...size, phone });
      for (const [name, url] of Object.entries(CASES)) {
        await page.goto(url);
        await page.waitForTimeout(550);
        await expectFits(page, `${size.name} ${name}`);
        if (!name.endsWith('extreme')) await page.screenshot({ path: `/tmp/bandwidth-fit-${size.name}-${name}.png` });
      }
      expect(errors).toEqual([]);
      await ctx.close();
    });
  }
}

test('comparison details: collapsed by default, holds formulas, notes and full caveats', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 375, height: 667 }, phone: true }, '/?a=ddr5-mrdimm-12800&b=tb5-boost');
  const details = page.locator('#cmp-details');
  await expect(details).not.toHaveAttribute('open', '');
  // Verbose text is not in the compact comparison.
  await expect(page.locator('#compare .formula')).toHaveCount(0);
  await expect(page.locator('#compare')).not.toContainText('120 Gb/s transmit');
  await expect(page.locator('#compare')).not.toContainText('Underlying link');
  // Compact caveats stay visible.
  await expect(page.locator('#side-a .badge-warn')).toHaveText('Unverified');
  await expect(page.locator('#side-a .badges')).toContainText('Not ratified');
  await expect(page.locator('#side-b .asym')).toContainText('Reverse direction: 5 GB/s');
  await expect(page.locator('#notices')).toContainText('Mixed basis');
  await expect(page.locator('#notices')).toContainText('Unverified figure');
  await expect(page.locator('#notices')).toContainText('Asymmetric link');
  // Details sit between the comparison and the catalog.
  const order = await page.evaluate(() => ['#compare', '#cmp-details', '#catalog'].map((s) => document.querySelector(s).getBoundingClientRect().top));
  expect(order[0]).toBeLessThan(order[1]);
  expect(order[1]).toBeLessThan(order[2]);

  await page.locator('#cmp-details summary').click();
  await expect(details).toHaveAttribute('open', '');
  await expect(page.locator('#detail-a .formula')).toContainText('GB/s');
  await expect(page.locator('#detail-a')).toContainText('DDR5 MRDIMM-12800 (host channel)');
  await expect(page.locator('#detail-a')).toContainText('In development, not ratified');
  await expect(page.locator('#detail-a')).toContainText('User-supplied, unverified');
  await expect(page.locator('#detail-a')).toContainText('Theoretical memory peak');
  await expect(page.locator('#detail-b')).toContainText('Advertised link rate');
  await expect(page.locator('#detail-b')).toContainText('120 Gb/s transmit with 40 Gb/s receive');
  await expect(page.locator('#ratio-full')).toHaveText('DDR5 MRDIMM-12800 (host channel) lists 6.83× the figure of Thunderbolt 5 Bandwidth Boost (120 Gb/s).');
  await expect(page.locator('#notice-details')).toContainText('The ratio compares different kinds of number');
  await expect(page.locator('#notice-details')).toContainText('not been checked against a source');
  await expect(page.locator('#cmp-details')).toContainText('Linear scale');
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
  await page.screenshot({ path: '/tmp/bandwidth-details-375x667.png', fullPage: true });
  expect(errors).toEqual([]);
  await ctx.close();
});

test('connector underlying link lives in details and still switches the side', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 1366, height: 768 } }, '/?a=pcie4-x4&b=u2-nvme-pcie5-x4');
  await expect(page.locator('#side-b .badges')).toContainText('Connector');
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-b')).toContainText('Connector / form factor');
  await page.locator('#detail-b [data-goto]').click();
  await expect(page.locator('#cb-b')).toHaveValue('PCIe 5.0 x4');
  expect(errors).toEqual([]);
  await ctx.close();
});

// ------------------------------------------------------------ mobile picker sheet

const PHONE = { viewport: { width: 375, height: 667 }, phone: true };
const sheet = (page, side) => page.locator(`.picker[data-side="${side}"] .cb`);
const trigger = (page, side) => page.locator(`.picker[data-side="${side}"] .cb-toggle`);
const focusedId = (page) => page.evaluate(() => document.activeElement?.id || document.activeElement?.className || '');

async function expectSheetOpen(page, side) {
  await expect(sheet(page, side)).toHaveAttribute('role', 'dialog');
  await expect(sheet(page, side)).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator(`#cb-${side}`)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('html')).toHaveClass(/cb-lock/);
  const box = await sheet(page, side).boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBe(0);
  expect(box.width).toBe(vp.width);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 0.5);
}

async function expectSheetClosed(page, side, value) {
  await expect(page.locator(`#cb-${side}`)).toHaveAttribute('aria-expanded', 'false');
  await expect(sheet(page, side)).not.toHaveAttribute('role', 'dialog');
  await expect(page.locator('html')).not.toHaveClass(/cb-lock/);
  await expect(page.locator(`#cb-${side}`)).toHaveValue(value);
  await expect(trigger(page, side)).toContainText(value);
}

test('mobile picker: tap browses in a full-screen sheet without the keyboard, tap picks', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  // Closed: the trigger shows the full name and is a comfortable target.
  const tb = await trigger(page, 'a').boundingBox();
  expect(tb.height).toBeGreaterThanOrEqual(44);
  await expect(trigger(page, 'a')).toContainText('PCIe 4.0 x4');

  await trigger(page, 'a').tap();
  await expectSheetOpen(page, 'a');
  expect(await focusedId(page)).not.toBe('cb-a'); // browsing: no on-screen keyboard
  await expect(page.locator('.picker[data-side="a"] .cb-cancel')).toBeVisible();
  await expect(page.locator('#cb-a')).toHaveAttribute('placeholder', 'Search interfaces');
  const fs = await page.locator('#cb-a').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(fs).toBeGreaterThanOrEqual(16);
  // The current selection is marked and scrolled into view.
  await expect(page.locator('#lb-a .is-current')).toBeInViewport();

  // Options: big targets, full names (no truncation), inside the viewport.
  const opts = await page.locator('#lb-a [role="option"]').evaluateAll((os) => os.map((o) => {
    const n = o.querySelector('.cb-name');
    const r = o.getBoundingClientRect();
    return { h: r.height, right: r.right, cut: n.scrollWidth > n.clientWidth + 1 || getComputedStyle(n).textOverflow === 'ellipsis' };
  }));
  expect(opts.length).toBeGreaterThan(100);
  for (const o of opts) {
    expect(o.h).toBeGreaterThanOrEqual(44);
    expect(o.cut).toBe(false);
    expect(o.right).toBeLessThanOrEqual(375);
  }
  await expect(page.locator('#lb-a [role="option"]', { hasText: 'LPDDR5X (10.7 Gb/s)-10700 (64-bit normalized)' })).toHaveCount(1);

  // Scrolling the list never scrolls the page behind it.
  const list = page.locator('#lb-a');
  const [sh, ch] = await list.evaluate((l) => [l.scrollHeight, l.clientHeight]);
  expect(sh).toBeGreaterThan(ch);
  const before = await list.evaluate((l) => l.scrollTop);
  const lb = await list.boundingBox();
  await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => list.evaluate((l) => l.scrollTop)).not.toBe(before);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.screenshot({ path: '/tmp/bandwidth-sheet-375x667.png' });

  const hbm = page.locator('#lb-a [role="option"]', { hasText: /^HBM3E/ });
  await hbm.scrollIntoViewIfNeeded();
  await hbm.tap();
  await expectSheetClosed(page, 'a', 'HBM3E');
  expect(await focusedId(page)).not.toBe('cb-a');
  await expect(page.locator('#side-a .num')).toHaveText('1,177.6');
  await expect(page).toHaveURL(/a=hbm3e/);
  // Back on the comparison, which is fully visible.
  const bottom = await page.locator('#compare').evaluate((e) => e.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(667);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mobile picker: HBM4E search shows full long labels and picks', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  await trigger(page, 'a').tap();
  await page.locator('#cb-a').tap();
  await page.keyboard.type('hbm4e');
  const opts = page.locator('#lb-a [role="option"]');
  await expect(opts).toHaveCount(2);
  const cut = await opts.evaluateAll((os) => os.map((o) => {
    const n = o.querySelector('.cb-name');
    return n.scrollWidth > n.clientWidth + 1 || getComputedStyle(n).textOverflow === 'ellipsis' || o.getBoundingClientRect().right > innerWidth;
  }));
  expect(cut).toEqual([false, false]);
  await opts.filter({ hasText: 'HBM4E (Samsung maximum, 16 Gb/s)' }).tap();
  await expectSheetClosed(page, 'a', 'HBM4E (Samsung maximum, 16 Gb/s)');
  await expect(page.locator('#side-a .num')).toHaveText('4,096');
  await expect(page.locator('#side-a .badges')).toContainText('Vendor claim');
  await page.waitForTimeout(550);
  await expectFits(page, 'hbm4e picked');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mobile picker: deliberate search on B filters, tap picks and dismisses the keyboard', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  await trigger(page, 'b').tap();
  await expectSheetOpen(page, 'b');
  await page.locator('#cb-b').tap();
  expect(await focusedId(page)).toBe('cb-b');
  await page.keyboard.type('usb4 40');
  await expect(page.locator('#lb-b [role="option"]')).toHaveCount(1);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('80');
  await expect(page.locator('#lb-b [role="option"]').first()).toContainText('USB4 80Gbps');
  await page.locator('#lb-b [role="option"]').first().tap();
  await expectSheetClosed(page, 'b', 'USB4 80Gbps (v2.0, symmetric)');
  expect(await focusedId(page)).not.toBe('cb-b'); // keyboard dismissed
  await expect(page.locator('#side-b .num')).toHaveText('10');
  // Empty state inside the sheet.
  await trigger(page, 'b').tap();
  await page.locator('#cb-b').tap();
  await page.keyboard.type('qqqqzzz');
  await expect(page.locator('#lb-b .cb-empty')).toContainText('Nothing matches');
  await page.locator('.picker[data-side="b"] .cb-cancel').tap();
  await expectSheetClosed(page, 'b', 'USB4 80Gbps (v2.0, symmetric)');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mobile picker: cancel and Escape restore the name; focus is trapped and restored', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  await trigger(page, 'a').tap();
  await page.locator('#cb-a').tap();
  await page.keyboard.type('ddr');
  await expect(page.locator('#lb-a [role="option"]').first()).toContainText('DDR');
  await page.locator('.picker[data-side="a"] .cb-cancel').tap();
  await expectSheetClosed(page, 'a', 'PCIe 4.0 x4');
  expect(await focusedId(page)).not.toBe('cb-a');

  // Keyboard path (hardware keyboard on a narrow window): focus opens the sheet for search.
  await page.locator('#cb-b').focus();
  await expectSheetOpen(page, 'b');
  expect(await focusedId(page)).toBe('cb-b');
  await page.keyboard.press('Tab');
  await expect(page.locator('.picker[data-side="b"] .cb-cancel')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#cb-b')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.picker[data-side="b"] .cb-cancel')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#cb-b')).toBeFocused();
  await page.keyboard.type('hbm4');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await expectSheetClosed(page, 'b', 'SATA III (6 Gb/s)');
  await expect(page.locator('#cb-b')).toBeFocused(); // focus returns to the combobox
  // Arrows + Enter still pick from the keyboard.
  await page.keyboard.type('sas 24g');
  await page.keyboard.press('Enter');
  await expectSheetClosed(page, 'b', 'SAS-4 "24G" (22.5 Gbaud)');
  await expect(page.locator('#cb-b')).toBeFocused();
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mobile picker: sheet follows the visual viewport (on-screen keyboard)', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  await trigger(page, 'a').tap();
  await page.locator('#cb-a').tap();
  await page.setViewportSize({ width: 375, height: 380 }); // keyboard takes ~290px
  await expect.poll(async () => (await sheet(page, 'a').boundingBox()).height).toBeLessThanOrEqual(380.5);
  const lb = await page.locator('#lb-a').boundingBox();
  expect(lb.height).toBeGreaterThan(150); // list still usable above the keyboard
  await expect(page.locator('#cb-a')).toBeInViewport();
  await expect(page.locator('.picker[data-side="a"] .cb-cancel')).toBeInViewport();
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mobile: units, swap and touch targets; no horizontal overflow', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE, '/?a=tb5-boost&b=lpddr5x-10700');
  await page.locator('label:has(input[value="Gbps"])').tap();
  await expect(page.locator('#side-a .num')).toHaveText('120');
  await expect(page.locator('#side-a .asym')).toContainText('Reverse direction: 40 Gb/s');
  await page.locator('#swap').tap();
  await expect(page.locator('#cb-a')).toHaveValue('LPDDR5X (10.7 Gb/s)-10700 (64-bit normalized)');
  await expect(trigger(page, 'b')).toContainText('Thunderbolt 5 Bandwidth Boost (120 Gb/s)');
  await expect(page).toHaveURL(/a=lpddr5x-10700&b=tb5-boost&u=Gbps/);
  await page.waitForTimeout(550);
  await expectFits(page, 'after swap');
  for (const sel of ['.picker[data-side="a"] .cb-toggle', '.picker[data-side="b"] .cb-toggle', '#swap', '#share', 'label:has(input[value="Gbps"])', 'label:has(input[value="GBps"])', '#cmp-details summary']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.height, sel).toBeGreaterThanOrEqual(44);
    expect(box.width, sel).toBeGreaterThanOrEqual(44);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('short landscape phone: normal page scroll, picker sheet still fits', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 740, height: 360 }, phone: true }, '/?a=lpddr5x-10700&b=tb5-boost');
  const [sh, ih, sw, iw] = await page.evaluate(() => [document.documentElement.scrollHeight, innerHeight, document.documentElement.scrollWidth, innerWidth]);
  expect(sh).toBeGreaterThan(ih); // content scrolls rather than being clipped
  expect(sw).toBeLessThanOrEqual(iw);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.evaluate(() => scrollTo(0, 0));
  await trigger(page, 'b').tap();
  await expectSheetOpen(page, 'b');
  await page.locator('.picker[data-side="b"] .cb-cancel').tap();
  await expectSheetClosed(page, 'b', 'Thunderbolt 5 Bandwidth Boost (120 Gb/s)');
  await page.screenshot({ path: '/tmp/bandwidth-landscape-740x360.png' });
  expect(errors).toEqual([]);
  await ctx.close();
});

// ------------------------------------------------------------ DDR channel configurations

test('DDR channels: phone picker finds, picks and compares channel variants; swap and link', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE);
  await trigger(page, 'a').tap();
  await expectSheetOpen(page, 'a');
  await page.locator('#cb-a').tap();
  await page.keyboard.type('DDR5-6400 8 channels');
  const optsA = page.locator('#lb-a [role="option"]');
  await expect(optsA).toHaveCount(1);
  await expect(optsA.first().locator('.cb-name')).toHaveText('DDR5-6400 · 8 channels');
  await optsA.first().tap();
  await expectSheetClosed(page, 'a', 'DDR5-6400 · 8 channels');
  await expect(page.locator('#side-a .side-name')).toHaveText('DDR5-6400 · 8 channels');
  await expect(page.locator('#side-a .num')).toHaveText('409.6');
  await expect(page.locator('#side-a .badges')).toContainText('512-bit (8 × 64)');

  await trigger(page, 'b').tap();
  await page.locator('#cb-b').tap();
  await page.keyboard.type('ddr5 6400 dual channel');
  await expect(page.locator('#lb-b [role="option"]')).toHaveCount(1);
  await page.locator('#lb-b [role="option"]').first().tap();
  await expectSheetClosed(page, 'b', 'DDR5-6400 · 2 channels');
  await expect(page.locator('#side-b .num')).toHaveText('102.4');
  await expect(page.locator('#ratio-num')).toHaveText('4×');
  await expect(page.locator('#ratio-text')).toHaveText('A lists 4× the figure of B');
  await expect(page.locator('#notices')).not.toContainText('Mixed basis');
  await expect(page).toHaveURL(/\?a=ddr5-6400-8ch&b=ddr5-6400-2ch$/);
  await page.waitForTimeout(550);
  await expectFits(page, 'ddr channels picked');

  await page.locator('#swap').tap();
  await expect(page).toHaveURL(/\?a=ddr5-6400-2ch&b=ddr5-6400-8ch$/);
  await expect(trigger(page, 'a')).toContainText('DDR5-6400 · 2 channels');
  await expect(page.locator('#ratio-text')).toHaveText('B lists 4× the figure of A');

  // The shared URL reproduces the comparison.
  await page.goto(page.url());
  await expect(page.locator('#cb-a')).toHaveValue('DDR5-6400 · 2 channels');
  await expect(page.locator('#cb-b')).toHaveValue('DDR5-6400 · 8 channels');
  await expect(page.locator('#url-notice')).toBeHidden();
  await page.screenshot({ path: '/tmp/bandwidth-ddr-channels-375x667.png' });
  expect(errors).toEqual([]);
  await ctx.close();
});

test('DDR channels: legacy share links still resolve to the 1-channel row', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 1366, height: 768 } }, '/?a=ddr5-6400&b=ddr4-3200');
  await expect(page.locator('#url-notice')).toBeHidden();
  await expect(page.locator('#cb-a')).toHaveValue('DDR5-6400 · 1 channel');
  await expect(page.locator('#cb-b')).toHaveValue('DDR4-3200 · 1 channel');
  await expect(page.locator('#side-a .num')).toHaveText('51.2');
  await expect(page.locator('#side-b .num')).toHaveText('25.6');
  await expect(page).toHaveURL(/\?a=ddr5-6400&b=ddr4-3200$/);
  // An id that never existed is still rejected.
  await page.goto('/?a=ddr5-6400-3ch&b=sata3');
  await expect(page.locator('#url-notice')).toContainText('ddr5-6400-3ch');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('DDR channels: desktop combobox, details explain channels and the DDR5 subchannel convention', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 1366, height: 768 } });
  const input = page.locator('#cb-a');
  await input.click();
  await input.fill('quad channel ddr4 3200');
  await expect(page.locator('#lb-a [role="option"]')).toHaveCount(1);
  await expect(page.locator('#lb-a [role="option"]').first()).toContainText('DDR4-3200 · 4 channels');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('DDR4-3200 · 4 channels');
  await expect(page.locator('#side-a .num')).toHaveText('102.4');
  await expect(page).toHaveURL(/a=ddr4-3200-4ch/);

  await page.goto('/?a=ddr5-6400-8ch&b=ddr5-6400');
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-a')).toContainText('8 × 64-bit channels (512-bit aggregate)');
  await expect(page.locator('#detail-b')).toContainText('1 × 64-bit channel (64-bit aggregate)');
  await expect(page.locator('#detail-a .formula')).toHaveText('6400 MT/s × 64 bits × 8 channels ÷ 8 = 409.6 GB/s');
  await expect(page.locator('#detail-a')).toContainText('two 32-bit subchannels, counted once');
  await expect(page.locator('#detail-a')).toContainText('Theoretical 8-channel configuration');
  await expect(page.locator('#detail-a')).toContainText('Not a claim that any processor supports 8 channels');
  await expect(page.locator('#ratio-full')).toHaveText('DDR5-6400 · 8 channels lists 8× the figure of DDR5-6400 · 1 channel.');
  // Non-DDR rows get no channel row.
  await page.goto('/?a=lpddr5-6400&b=hbm3');
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-a')).not.toContainText('Channels');
  expect(errors).toEqual([]);
  await ctx.close();
});

test('DDR channels: catalog filter and sort show every configuration with explicit names', async ({ browser, baseURL }) => {
  for (const vp of [{ width: 1366, height: 768 }, { width: 375, height: 667 }]) {
    const { ctx, page, errors } = await open(browser, baseURL, { viewport: vp, phone: vp.width < 760 });
    await page.locator('#catalog summary').click();
    await page.locator('#cat-q').fill('ddr5-6400');
    const names = page.locator('#cat-body .cat-name');
    await expect(names).toHaveText([
      'DDR5-6400 · 1 channel', 'DDR5-6400 · 2 channels', 'DDR5-6400 · 4 channels',
      'DDR5-6400 · 8 channels', 'DDR5-6400 · 12 channels', 'DDR5-6400 · 16 channels',
      'LPDDR5-6400 (64-bit normalized)',
    ]);
    await page.getByLabel('Sort by').selectOption('bandwidth-desc');
    await expect(names.first()).toHaveText('DDR5-6400 · 16 channels');
    const nums = (await page.locator('#cat-body .num-col').allTextContents()).map((t) => Number(t.replace(/,/g, '')));
    expect(nums).toEqual([819.2, 614.4, 409.6, 204.8, 102.4, 51.2, 51.2]);
    // Tie: LPDDR5-6400 (normalized) vs DDR5-6400 · 1 channel break by name.
    await page.getByLabel('Sort by').selectOption('name-asc');
    await expect(names.nth(1)).toHaveText('DDR5-6400 · 2 channels');
    await expect(names.nth(4)).toHaveText('DDR5-6400 · 12 channels');
    await page.locator('#cat-body .mini[data-set="b"][data-id="ddr5-6400-12ch"]').click();
    await expect(page.locator('#cb-b')).toHaveValue('DDR5-6400 · 12 channels');
    await expect(page).toHaveURL(/b=ddr5-6400-12ch/);
    await page.locator('#cat-q').fill('dual channel');
    await page.locator('.chip[data-cat="memory"]').click();
    expect(await page.locator('#cat-body tr:not(.cat-fam)').count()).toBe(34);
    await expect(page.locator('#catalog-count')).toHaveText('34 of 348');
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    expect(sw).toBeLessThanOrEqual(iw);
    expect(errors).toEqual([]);
    await ctx.close();
  }
});

// ------------------------------------------------------------ raw signaling / encoding-adjusted mode

test('mode: phone workflow, touch-friendly switch, sheet previews, swap and link', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, PHONE, '/?a=pcie3-x4&b=ddr5-9200-16ch');
  const raw = page.locator('label:has(input[value="raw"])');
  const adj = page.locator('label:has(input[value="adjusted"])');
  for (const l of [raw, adj]) {
    const box = await l.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
  // Short visible labels; the full names stay the accessible names.
  await expect(raw).toHaveText('Raw signalingRaw');
  await expect(page.locator('.seg-mode .seg-short').first()).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Raw signaling', exact: true })).toHaveCount(1);
  await expect(page.getByRole('radio', { name: 'Encoding-adjusted', exact: true })).toBeChecked();
  await expect(page.locator('#side-a .num')).toHaveText('3.938');

  await raw.tap();
  await expect(page.locator('#side-a .num')).toHaveText('4');
  await expect(page.locator('#side-b .num')).toHaveText('1,177.6'); // memory unchanged
  await expect(page.locator('#side-a .badge-basis')).toContainText('Raw signaling');
  await expect(page).toHaveURL(/\?a=pcie3-x4&b=ddr5-9200-16ch&m=raw$/);
  await page.waitForTimeout(550);
  await expectFits(page, 'raw pcie vs long ddr');

  // The full-screen picker previews raw figures, and picking keeps the mode.
  await trigger(page, 'a').tap();
  await expectSheetOpen(page, 'a');
  await page.locator('#cb-a').tap();
  await page.keyboard.type('sata iii');
  const opt = page.locator('#lb-a [role="option"]').filter({ hasText: 'SATA III (6 Gb/s)' }).first();
  await expect(opt.locator('.cb-meta')).toHaveText('0.75 GB/s · RAW');
  await opt.tap();
  await expectSheetClosed(page, 'a', 'SATA III (6 Gb/s)');
  await expect(page.locator('#side-a .num')).toHaveText('0.75');
  await expect(page).toHaveURL(/\?a=sata3&b=ddr5-9200-16ch&m=raw$/);

  await page.locator('#swap').tap();
  await expect(page).toHaveURL(/\?a=ddr5-9200-16ch&b=sata3&m=raw$/);
  await expect(page.locator('#side-b .num')).toHaveText('0.75');
  await page.goto(page.url());
  await expect(page.getByRole('radio', { name: 'Raw signaling', exact: true })).toBeChecked();
  await expect(page.locator('#side-b .num')).toHaveText('0.75');

  await adj.tap();
  await expect(page.locator('#side-b .num')).toHaveText('0.6');
  await expect(page).toHaveURL(/\?a=ddr5-9200-16ch&b=sata3$/);
  await page.waitForTimeout(550);
  await expectFits(page, 'adjusted after toggles');
  await page.screenshot({ path: '/tmp/bandwidth-mode-375x667.png' });
  expect(errors).toEqual([]);
  await ctx.close();
});

test('mode: desktop shows full labels in the header and fits with HBM4E', async ({ browser, baseURL }) => {
  const { ctx, page, errors } = await open(browser, baseURL, { viewport: { width: 1366, height: 768 } }, '/?a=hbm4e-samsung-max&b=pcie5-x16');
  await expect(page.locator('.seg-mode .seg-long').first()).toBeVisible();
  await expect(page.locator('.seg-mode .seg-short').first()).toBeHidden();
  const [top, controls] = await page.evaluate(() => ['.top', '.controls'].map((s) => document.querySelector(s).getBoundingClientRect().height));
  expect(top).toBeLessThanOrEqual(controls + 20); // one header row on desktop
  await page.locator('label:has(input[value="raw"])').click();
  await expect(page.locator('#side-b .num')).toHaveText('64');
  await expect(page.locator('#side-a .num')).toHaveText('4,096');
  await expect(page.locator('#ratio-num')).toHaveText('64×');
  await page.waitForTimeout(550);
  await expectFits(page, 'desktop raw hbm4e');
  await page.screenshot({ path: '/tmp/bandwidth-mode-1366x768.png' });
  expect(errors).toEqual([]);
  await ctx.close();
});
