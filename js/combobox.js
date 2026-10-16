// Accessible type-to-filter combobox (WAI-ARIA 1.2 combobox + listbox pattern).
// Keyboard: ↓/↑ move, Alt+↓ open, Enter select, Esc close/restore, Tab leaves.
//
// Sheet mode (narrow or short touch screens): the closed combobox shows a full-width
// button with the full name. Tapping it opens the same input + listbox as a full-screen
// modal dialog sized to the visual viewport, without focusing the input (no keyboard).
// Tapping the search field is a deliberate search. Picking or cancelling closes the
// sheet and, after touch, blurs the input so the on-screen keyboard goes away.

import { search } from './compare.js';

let uid = 0;

const SHEET_QUERY = '(max-width: 760px), (pointer: coarse) and (max-height: 500px)';
const sheetMedia = typeof matchMedia === 'function' ? matchMedia(SHEET_QUERY) : null;
export const isSheetMode = () => Boolean(sheetMedia && sheetMedia.matches);
const syncMode = () => document.documentElement.classList.toggle('is-sheet-mode', isSheetMode());
syncMode();
sheetMedia?.addEventListener('change', syncMode);

// Last pointer type, so selection can dismiss the on-screen keyboard after touch only.
let lastPointer = '';
document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; }, true);
const viaTouch = () => lastPointer === 'touch' || lastPointer === 'pen';

export class Combobox {
  /**
   * @param {HTMLElement} root  container holding input.cb-input, button.cb-toggle, ul.cb-list, .cb-status
   * @param {object} opts
   * @param {Array} opts.index         search index from buildIndex()
   * @param {(item) => string} opts.renderMeta  right-hand meta text per option
   * @param {(item) => void} opts.onSelect
   */
  constructor(root, { index, renderMeta, onSelect }) {
    this.root = root;
    this.index = index;
    this.renderMeta = renderMeta;
    this.onSelect = onSelect;
    this.input = root.querySelector('.cb-input');
    this.toggle = root.querySelector('.cb-toggle');
    this.list = root.querySelector('.cb-list');
    this.status = root.querySelector('.cb-status');
    this.cancel = root.querySelector('.cb-cancel');
    this.title = root.querySelector('.cb-title');
    this.triggerText = root.querySelector('.cb-trigger-text');
    this.toggleLabel = this.toggle.getAttribute('aria-label');
    this.sheet = false;
    this.syncViewport = () => {
      const vv = window.visualViewport;
      this.root.style.setProperty('--vv-h', `${vv ? vv.height : window.innerHeight}px`);
      this.root.style.setProperty('--vv-top', `${vv ? vv.offsetTop : 0}px`);
    };
    this.prefix = `cbo${++uid}`;
    this.selected = null;
    this.results = [];
    this.active = -1;
    this.open = false;

    this.input.addEventListener('input', () => this.filter(this.input.value, true));
    // On the root so keys also work while the sheet itself (not the input) has focus.
    this.root.addEventListener('keydown', (e) => {
      if (e.target === this.cancel && (e.key === 'Enter' || e.key === ' ')) return;
      this.onKey(e);
    });
    this.input.addEventListener('focus', () => {
      this.input.select();
      // Keyboard focus on the hidden sheet-mode input opens the sheet for searching.
      if (isSheetMode() && !this.open && !this.restoring) this.show('');
    });
    this.input.addEventListener('click', () => { if (!this.open) this.show(''); });
    this.input.addEventListener('blur', () => {
      // Defer so a click on an option (which keeps focus) still lands first.
      setTimeout(() => { if (!this.sheet && !this.root.contains(document.activeElement)) this.close(true); }, 0);
    });
    this.toggle.addEventListener('click', () => {
      if (this.open) this.close(true);
      else if (isSheetMode()) this.show('', 'browse');
      else { this.show(''); this.input.focus({ preventScroll: true }); }
    });
    this.cancel.addEventListener('click', () => this.close(true));
    sheetMedia?.addEventListener('change', () => { if (this.open) this.close(true); });
    this.list.addEventListener('pointerdown', (e) => e.preventDefault()); // keep input focus
    this.root.addEventListener('pointerdown', (e) => {
      if (this.sheet && (e.pointerType === 'touch' || e.pointerType === 'pen')) this.touched = true;
    });
    this.list.addEventListener('click', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li) this.choose(this.results[Number(li.dataset.i)]);
    });
    this.list.addEventListener('pointermove', (e) => {
      const li = e.target.closest('[role="option"]');
      if (li && Number(li.dataset.i) !== this.active) this.setActive(Number(li.dataset.i), false);
    });
    document.addEventListener('pointerdown', (e) => {
      if (this.open && !this.root.contains(e.target)) this.close(true);
    });
  }

  setSelected(item) {
    this.selected = item;
    // Never clobber text the user is typing into an open list.
    if (!this.open) this.input.value = item ? item.name : '';
    this.triggerText.textContent = item ? item.name : '';
    this.toggle.setAttribute('aria-label', item ? `${this.toggleLabel} (current: ${item.name})` : this.toggleLabel);
  }

  /** Re-render visible list (e.g. after a unit change). */
  refresh() { if (this.open) this.render(); }

  /** @param {'keyboard'|'browse'} via  browse = opened by the button: no input focus, no keyboard */
  show(query, via = 'keyboard') {
    this.filter(query, false, via);
  }

  filter(query, typed, via = 'keyboard') {
    this.results = search(this.index, query);
    const selIdx = this.selected ? this.results.indexOf(this.selected) : -1;
    this.active = this.results.length ? (typed || selIdx < 0 ? 0 : selIdx) : -1;
    if (!this.open && isSheetMode()) this.enterSheet(via);
    this.open = true;
    this.root.classList.add('is-open');
    this.input.setAttribute('aria-expanded', 'true');
    this.list.hidden = false;
    this.render();
    const n = this.results.length;
    this.status.textContent = n ? `${n} result${n === 1 ? '' : 's'}` : 'No matches';
  }

  close(restore) {
    if (!this.open) { if (restore) this.setSelected(this.selected); return; }
    this.open = false;
    this.root.classList.remove('is-open');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.list.hidden = true;
    this.list.replaceChildren();
    if (restore) this.setSelected(this.selected);
    if (this.sheet) this.exitSheet();
  }

  choose(item) {
    if (!item) return;
    const wasSheet = this.sheet;
    this.close(false);
    this.setSelected(item);
    this.onSelect(item);
    if (!wasSheet && viaTouch()) this.input.blur(); // dismiss the on-screen keyboard
  }

  enterSheet(via) {
    this.sheet = true;
    this.sheetVia = via;
    this.touched = via === 'browse' && viaTouch();
    this.root.classList.add('is-sheet');
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-labelledby', this.title.id);
    this.root.tabIndex = -1;
    document.documentElement.classList.add('cb-lock');
    this.syncViewport();
    window.visualViewport?.addEventListener('resize', this.syncViewport);
    window.visualViewport?.addEventListener('scroll', this.syncViewport);
    window.addEventListener('resize', this.syncViewport);
    if (via === 'browse') {
      this.input.value = '';
      this.root.focus({ preventScroll: true });
    }
  }

  exitSheet() {
    this.sheet = false;
    this.root.classList.remove('is-sheet');
    for (const a of ['role', 'aria-modal', 'aria-labelledby', 'tabindex']) this.root.removeAttribute(a);
    document.documentElement.classList.remove('cb-lock');
    window.visualViewport?.removeEventListener('resize', this.syncViewport);
    window.visualViewport?.removeEventListener('scroll', this.syncViewport);
    window.removeEventListener('resize', this.syncViewport);
    // Return focus to the picker. After touch (or a button-opened browse) land on the
    // button, never the input, so no keyboard pops up over the comparison.
    if (this.sheetVia === 'browse' || this.touched) {
      this.input.blur();
      this.toggle.focus({ preventScroll: true });
    } else if (document.activeElement !== this.input) {
      this.restoring = true;
      this.input.focus({ preventScroll: true });
      this.restoring = false;
    }
  }

  /** Sheet focus trap: Tab cycles between the search field and Cancel. */
  trapTab(e) {
    e.preventDefault();
    const order = [this.input, this.cancel];
    const i = order.indexOf(document.activeElement);
    const next = i < 0 ? (e.shiftKey ? 1 : 0) : (i + (e.shiftKey ? -1 : 1) + order.length) % order.length;
    order[next].focus();
  }

  onKey(e) {
    const n = this.results.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open || e.altKey) { if (!this.open) this.show(''); return; }
        if (n) this.setActive((this.active + 1) % n);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.open) { this.show(''); return; }
        if (n) this.setActive((this.active - 1 + n) % n);
        break;
      case 'PageDown':
        if (this.open && n) { e.preventDefault(); this.setActive(Math.min(n - 1, this.active + 8)); }
        break;
      case 'PageUp':
        if (this.open && n) { e.preventDefault(); this.setActive(Math.max(0, this.active - 8)); }
        break;
      case 'Enter':
        if (this.open) {
          e.preventDefault();
          if (this.active >= 0) this.choose(this.results[this.active]);
        }
        break;
      case 'Escape':
        if (this.open) {
          e.preventDefault();
          this.close(true);
          if (document.activeElement === this.input) this.input.select();
        }
        break;
      case 'Tab':
        if (this.sheet) this.trapTab(e);
        else this.close(true);
        break;
      default:
    }
  }

  /** @param {boolean|'center'} scroll */
  setActive(i, scroll = true) {
    const prev = this.list.querySelector('[aria-selected="true"]');
    if (prev) prev.setAttribute('aria-selected', 'false');
    this.active = i;
    const li = this.list.querySelector(`[data-i="${i}"]`);
    if (!li) return;
    li.setAttribute('aria-selected', 'true');
    this.input.setAttribute('aria-activedescendant', li.id);
    if (scroll) this.scrollToOption(li, scroll === 'center');
  }

  // Scroll only the list (scrollIntoView could also move the page behind the sheet).
  scrollToOption(li, center) {
    const l = this.list.getBoundingClientRect();
    const r = li.getBoundingClientRect();
    const head = 32; // sticky family header
    if (center) this.list.scrollTop += r.top - l.top - (l.height - r.height) / 2;
    else if (r.top < l.top + head) this.list.scrollTop -= l.top + head - r.top;
    else if (r.bottom > l.bottom) this.list.scrollTop += r.bottom - l.bottom;
  }

  render() {
    const frag = document.createDocumentFragment();
    if (!this.results.length) {
      const empty = document.createElement('li');
      empty.className = 'cb-empty';
      empty.setAttribute('role', 'presentation');
      empty.textContent = `Nothing matches “${this.input.value.trim()}”. Try “pcie 4”, “ddr5” or “usb4”.`;
      frag.append(empty);
      this.list.replaceChildren(frag);
      this.input.removeAttribute('aria-activedescendant');
      return;
    }
    let group = null;
    let groupList = null;
    this.results.forEach((item, i) => {
      if (!group || group !== item.family) {
        group = item.family;
        const g = document.createElement('li');
        g.setAttribute('role', 'group');
        const gid = `${this.prefix}-g${i}`;
        g.setAttribute('aria-labelledby', gid);
        const h = document.createElement('div');
        h.className = 'cb-group';
        h.id = gid;
        h.setAttribute('role', 'presentation');
        h.textContent = item.family;
        groupList = document.createElement('ul');
        groupList.setAttribute('role', 'presentation');
        g.append(h, groupList);
        frag.append(g);
      }
      const li = document.createElement('li');
      li.id = `${this.prefix}-o${i}`;
      li.dataset.i = String(i);
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === this.active ? 'true' : 'false');
      if (item === this.selected) li.classList.add('is-current');
      const name = document.createElement('span');
      name.className = 'cb-name';
      name.textContent = item.name;
      const meta = document.createElement('span');
      meta.className = 'cb-meta';
      meta.textContent = this.renderMeta(item);
      li.append(name, meta);
      groupList.append(li);
    });
    this.list.replaceChildren(frag);
    if (this.active >= 0) this.setActive(this.active, this.sheet && !this.input.value ? 'center' : true);
  }
}
