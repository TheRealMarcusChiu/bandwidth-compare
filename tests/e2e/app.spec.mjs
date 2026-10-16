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
// Narrow/touch layouts turn each combobox into a full-screen picker sheet opened by its button.
const sheetMode = (page) => page.evaluate(() => document.documentElement.classList.contains('is-sheet-mode'));
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
  // Honest proportional bars (polled: widths animate in).
  const width = (sel) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().width);
  await expect.poll(async () => (await width('#bar-b')) / (await width('#bar-a'))).toBeCloseTo(0.6 / 7.876923, 2);
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
  // Desktop: click the field itself. Sheet mode: the field is behind the full-width picker button.
  if (await sheetMode(page)) await page.locator('.picker[data-side="a"] .cb-toggle').click();
  else await page.locator('#cb-a').click();
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
  const sheet = await sheetMode(page);
  if (sheet) await page.locator('.picker[data-side="a"] .cb-toggle').click();
  else await page.locator('#cb-a').click();
  await page.locator('#cb-a').fill('qqqqzzz');
  await expect(page.locator('#lb-a .cb-empty')).toContainText('Nothing matches');
  await expect(page.locator('#lb-a [role="option"]')).toHaveCount(0);
  await page.keyboard.press('Enter'); // no-op
  await expect(page.locator('#lb-a')).toBeVisible();
  // The sheet covers the whole screen, so "outside" is its Cancel button.
  if (sheet) await page.locator('.picker[data-side="a"] .cb-cancel').click();
  else await page.mouse.click(5, 600);
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

test('HBM4E: searchable, exact per-stack figure, long name not clipped', async ({ page }) => {
  await page.goto('/');
  await page.locator('#cb-a').focus();
  await page.keyboard.type('hbm4e 16');
  await expect(page.locator('#lb-a [role="option"]')).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.locator('#cb-a')).toHaveValue('HBM4E (Samsung maximum, 16 Gb/s)');
  await expect(page).toHaveURL(/a=hbm4e-samsung-max/);
  await expect(page.locator('#side-a .num')).toHaveText('4,096');
  await expect(page.locator('#side-a .badges')).toContainText('Vendor claim');
  // The visible control is the input on desktop and the trigger button in sheet mode.
  const visible = (await sheetMode(page)) ? page.locator('.picker[data-side="a"] .cb-toggle') : page.locator('#cb-a');
  await expect(visible).toBeVisible();
  if (await sheetMode(page)) await expect(visible).toContainText('HBM4E (Samsung maximum, 16 Gb/s)');
  const clipped = await visible.evaluate((e) => e.scrollWidth > e.clientWidth + 1);
  expect(clipped).toBe(false);
  await page.goto('/?a=hbm4e-samsung-max&b=hbm4-jedec');
  await expect(page.locator('#ratio-num')).toHaveText('2×');
  await page.goto('/?a=hbm4e-samsung-max&b=usb1-low');
  await expect(page.locator('#ratio-num')).toHaveText('21,845,333×');
});

test('unverified data is labeled', async ({ page }) => {
  await page.goto('/?a=ddr5-9200&b=eth-1600g');
  // Compact flags next to the values…
  await expect(page.locator('#side-a .badge-warn')).toHaveText('Unverified');
  await expect(page.locator('#side-a .badge-warn')).toHaveAttribute('title', 'User-supplied, unverified');
  await expect(page.locator('#side-b .badge-warn')).toHaveText('Unverified');
  await expect(page.locator('#side-b .badges')).toContainText('Not ratified');
  await expect(page.locator('#notices')).toContainText('Unverified figure');
  // …and the full wording in Comparison details.
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-a .badge-warn')).toHaveText('User-supplied, unverified');
  await expect(page.locator('#detail-b')).toContainText('In development, not ratified');
  await expect(page.locator('#notice-details')).toContainText('not been checked against a source');
});

test('catalog filters and sets selections', async ({ page }) => {
  await page.goto('/');
  await page.locator('#catalog summary').click();
  await page.locator('#cat-q').fill('u.2');
  await expect(page.locator('#cat-body tr:not(.cat-fam)')).toHaveCount(3);
  await page.locator('button[aria-label="Set U.2 NVMe · PCIe 5.0 x4 as B"]').click();
  await expect(page.locator('#cb-b')).toHaveValue('U.2 NVMe · PCIe 5.0 x4');
  await expect(page.locator('#side-b .badges')).toContainText('Connector');
  await page.locator('#cmp-details summary').click();
  await expect(page.locator('#detail-b')).toContainText('Connector / form factor');
  await expect(page.locator('#detail-b')).toContainText('Underlying link');
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

// ------------------------------------------------------------ catalog sort

const catIds = (page) => page.locator('#cat-body .mini[data-set="a"]').evaluateAll((bs) => bs.map((b) => b.dataset.id));
const catNums = (page) => page.locator('#cat-body td.num-col').evaluateAll((tds) => tds.map((td) => Number(td.textContent.replace(/,/g, ''))));
const famHeads = (page) => page.locator('#cat-body tr.cat-fam th').allTextContents();

async function openCatalog(page, url = '/') {
  await page.goto(url);
  await page.locator('#catalog summary').click();
  return page.getByLabel('Sort by');
}

test('catalog sort: accessible select with all options, original by default', async ({ page }) => {
  const sort = await openCatalog(page);
  await expect(sort).toBeVisible();
  await expect(sort).toHaveJSProperty('tagName', 'SELECT');
  await expect(sort).toHaveValue('original');
  await expect(sort.locator('option')).toHaveText([
    'Original order', 'Bandwidth: highest first', 'Bandwidth: lowest first',
    'Name: A–Z', 'Name: Z–A', 'Family: A–Z', 'Family: Z–A',
  ]);
  const original = await catIds(page);
  expect(original[0]).toBe('hbm1');
  await sort.selectOption('name-asc');
  expect(await catIds(page)).not.toEqual(original);
  await sort.selectOption('original');
  expect(await catIds(page)).toEqual(original);
  await expect(page.locator('.cat thead th[aria-sort]')).toHaveCount(0);
});

test('catalog sort: bandwidth numeric in both directions, unit toggle keeps order', async ({ page }) => {
  const sort = await openCatalog(page);
  await sort.selectOption('bandwidth-desc');
  const desc = await catIds(page);
  expect(desc[0]).toBe('hbm4e-samsung-max');
  expect(desc.at(-1)).toBe('usb1-low');
  const nums = await catNums(page);
  for (let k = 1; k < nums.length; k++) expect(nums[k - 1]).toBeGreaterThanOrEqual(nums[k]);
  expect(desc.indexOf('tb3')).toBeLessThan(desc.indexOf('tb4')); // tie → name A–Z
  await expect(page.locator('#cat-unit')).toHaveAttribute('aria-sort', 'descending');
  // Flat list: no family group rows, family shown inline instead.
  expect(await famHeads(page)).toEqual([]);
  await expect(page.locator('#cat-body .cat-fam-inline').first()).toHaveText('HBM');

  await page.locator('label:has(input[value="Gbps"])').click();
  await expect(page.locator('#cat-unit')).toHaveText('Gb/s');
  await expect(sort).toHaveValue('bandwidth-desc');
  expect(await catIds(page)).toEqual(desc);
  const gb = await catNums(page);
  for (let k = 1; k < gb.length; k++) expect(gb[k - 1]).toBeGreaterThanOrEqual(gb[k]);

  await sort.selectOption('bandwidth-asc');
  const asc = await catIds(page);
  expect(asc[0]).toBe('usb1-low');
  expect(asc.indexOf('tb3')).toBeLessThan(asc.indexOf('tb4'));
  await expect(page.locator('#cat-unit')).toHaveAttribute('aria-sort', 'ascending');
  await page.locator('label:has(input[value="GBps"])').click();
  expect(await catIds(page)).toEqual(asc);
});

test('catalog sort: names natural A–Z / Z–A, families grouped', async ({ page }) => {
  const sort = await openCatalog(page);
  await sort.selectOption('name-asc');
  const names = await page.locator('#cat-body .cat-name').allTextContents();
  const coll = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
  expect(names).toEqual([...names].sort(coll.compare));
  expect(names.indexOf('PCIe 4.0 x4')).toBeLessThan(names.indexOf('PCIe 4.0 x16'));
  await expect(page.locator('.cat thead th').first()).toHaveAttribute('aria-sort', 'ascending');
  await sort.selectOption('name-desc');
  expect(await page.locator('#cat-body .cat-name').allTextContents()).toEqual([...names].reverse());
  await expect(page.locator('.cat thead th').first()).toHaveAttribute('aria-sort', 'descending');

  await sort.selectOption('family-asc');
  const fa = await famHeads(page);
  expect(fa).toEqual([...new Set(fa)]); // each family appears once
  expect(fa).toEqual([...fa].sort(coll.compare));
  await expect(page.locator('#cat-body .cat-fam-inline')).toHaveCount(0);
  await sort.selectOption('family-desc');
  expect(await famHeads(page)).toEqual([...fa].reverse());
});

test('catalog sort: combines with search and chips, persists across selections', async ({ page }) => {
  const sort = await openCatalog(page);
  await sort.selectOption('bandwidth-desc');
  await page.locator('#cat-q').fill('pcie x16');
  const hits = await catIds(page);
  expect(hits[0]).toBe('pcie8-x16');
  const nums = await catNums(page);
  for (let k = 1; k < nums.length; k++) expect(nums[k - 1]).toBeGreaterThanOrEqual(nums[k]);

  // Setting A and B from the catalog keeps sort and filter.
  await page.locator(`#cat-body .mini[data-set="a"][data-id="${hits.at(-1)}"]`).click();
  await page.locator(`#cat-body .mini[data-set="b"][data-id="${hits[0]}"]`).click();
  await expect(page.locator('#cb-b')).toHaveValue('PCIe 8.0 x16 (target)');
  await expect(sort).toHaveValue('bandwidth-desc');
  await expect(page.locator('#cat-q')).toHaveValue('pcie x16');
  expect(await catIds(page)).toEqual(hits);
  await expect(page.locator(`#cat-body .mini[data-set="b"][data-id="pcie8-x16"]`)).toHaveAttribute('aria-pressed', 'true');

  // Swap and chip changes keep the sort.
  await page.locator('#swap').click();
  expect(await catIds(page)).toEqual(hits);
  await page.locator('#cat-q').fill('');
  await page.locator('.chip[data-cat="network"]').click();
  const net = await catIds(page);
  expect(net).toHaveLength(14);
  expect(net[0]).toBe('eth-1600g');
  await expect(sort).toHaveValue('bandwidth-desc');
  await page.locator('#cat-q').fill('nothing-here-at-all');
  await expect(page.locator('#cat-empty')).toBeVisible();
  await expect(page.locator('#catalog-count')).toHaveText(/^0 of \d+$/);
});

test('catalog sort does not reorder the comparator dropdowns', async ({ page }) => {
  await page.goto('/');
  await page.locator('.picker[data-side="a"] .cb-toggle').click();
  const before = await page.locator('#lb-a [role="option"]').allTextContents();
  await page.keyboard.press('Escape');
  await page.locator('#catalog summary').click();
  await page.getByLabel('Sort by').selectOption('name-desc');
  await page.locator('.picker[data-side="a"] .cb-toggle').click();
  expect(await page.locator('#lb-a [role="option"]').allTextContents()).toEqual(before);
});

test('catalog sort: compact, fits the viewport and is keyboard operable', async ({ page }) => {
  const sort = await openCatalog(page);
  await page.locator('#cat-q').focus();
  await page.keyboard.press('Tab');
  await expect(sort).toBeFocused();
  const box = await sort.boundingBox();
  const vw = page.viewportSize().width;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw);
  if (vw > 760) {
    // Desktop: sits on the same row as the filter field.
    const q = await page.locator('#cat-q').boundingBox();
    expect(Math.abs(q.y - box.y)).toBeLessThan(4);
    expect(box.width).toBeLessThan(320);
  }
  await sort.selectOption('bandwidth-desc');
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw).toBeLessThanOrEqual(iw);
  const [cs, cw] = await page.locator('.cat-wrap').evaluate((e) => [e.scrollWidth, e.clientWidth]);
  expect(cs).toBeLessThanOrEqual(cw);
  // Dark theme: select uses the surface colour, not a light UA default.
  const bg = await sort.evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(bg).toBe('rgb(18, 20, 18)');
  await page.screenshot({ path: `/tmp/bandwidth-sort-${test.info().project.name}.png`, fullPage: false });
});
