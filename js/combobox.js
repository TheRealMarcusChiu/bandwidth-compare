// Accessible type-to-filter combobox (WAI-ARIA 1.2 combobox + listbox pattern).
// Keyboard: ↓/↑ move, Alt+↓ open, Enter select, Esc close/restore, Tab leaves.

import { search } from './compare.js';

let uid = 0;

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
    this.prefix = `cbo${++uid}`;
    this.selected = null;
    this.results = [];
    this.active = -1;
    this.open = false;

    this.input.addEventListener('input', () => this.filter(this.input.value, true));
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    this.input.addEventListener('focus', () => this.input.select());
    this.input.addEventListener('click', () => { if (!this.open) this.show(''); });
    this.input.addEventListener('blur', () => {
      // Defer so a click on an option (which keeps focus) still lands first.
      setTimeout(() => { if (!this.root.contains(document.activeElement)) this.close(true); }, 0);
    });
    this.toggle.addEventListener('click', () => {
      if (this.open) this.close(true);
      else { this.show(''); this.input.focus({ preventScroll: true }); }
    });
    this.list.addEventListener('pointerdown', (e) => e.preventDefault()); // keep input focus
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
  }

  /** Re-render visible list (e.g. after a unit change). */
  refresh() { if (this.open) this.render(); }

  show(query) {
    this.filter(query, false);
  }

  filter(query, typed) {
    this.results = search(this.index, query);
    const selIdx = this.selected ? this.results.indexOf(this.selected) : -1;
    this.active = this.results.length ? (typed || selIdx < 0 ? 0 : selIdx) : -1;
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
  }

  choose(item) {
    if (!item) return;
    this.close(false);
    this.setSelected(item);
    this.onSelect(item);
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
        if (this.open) { e.preventDefault(); this.close(true); this.input.select(); }
        break;
      case 'Tab':
        this.close(true);
        break;
      default:
    }
  }

  setActive(i, scroll = true) {
    const prev = this.list.querySelector('[aria-selected="true"]');
    if (prev) prev.setAttribute('aria-selected', 'false');
    this.active = i;
    const li = this.list.querySelector(`[data-i="${i}"]`);
    if (!li) return;
    li.setAttribute('aria-selected', 'true');
    this.input.setAttribute('aria-activedescendant', li.id);
    if (scroll) li.scrollIntoView({ block: 'nearest' });
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
    if (this.active >= 0) this.setActive(this.active);
  }
}
