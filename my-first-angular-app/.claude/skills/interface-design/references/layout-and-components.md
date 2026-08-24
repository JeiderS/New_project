# Layout and Components

Reference patterns for CRUD module screens (grid + create/edit panel), distilled from the Users module design round-trip. Swap entity/field names; keep the structure and CSS mechanics.

## Workspace split

```css
.workspace { flex: 1; position: relative; display: flex; min-height: 0; }

.grid-pane {
  flex: 0 0 50%;      /* not 1 1 50% — see Hard Rules */
  max-width: 50%;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
```

Mobile (`max-width: 860px`): `.grid-pane { flex-basis: 100%; max-width: none; }` and the panel goes full-bleed with small insets instead of the 50%-based left offset.

## Floating detail panel

```css
.detail-pane {
  position: absolute;
  top: 1.25rem; right: 1.25rem; bottom: 1.25rem;
  left: calc(50% + 0.5rem);   /* starts just past the grid, small gap */
  display: flex; flex-direction: column;
  background: var(--surface-elev-2);
  border: 1px solid var(--border-soft);
  border-radius: 5px;          /* tight radius, not --radius-lg */
  box-shadow: var(--shadow-panel);
  overflow: hidden;
  opacity: 0; visibility: hidden; transform: translateX(12px);
  transition: opacity .16s ease, transform .16s ease, visibility 0s linear .16s;
}
.detail-pane.open {
  opacity: 1; visibility: visible; transform: translateX(0);
  transition: opacity .16s ease, transform .16s ease;
}
@media (prefers-reduced-motion: reduce) {
  .detail-pane { transition: opacity .01s linear, visibility 0s; }
}
```

Toggle `.open` via JS on row-click (edit) or "New [Entity]" click (create); remove it on Cancel, the header's × button, or after Save. Panel starts with no `.open` class — closed on load.

Header: `.detail-header-text { display: flex; flex-direction: row; align-items: baseline; gap: .5rem; }` — eyebrow ("New"/"Edit") + title inline, not stacked. Close button `position: absolute; top/right: .85rem` inside a `position: relative` header.

Any per-record boolean toggle (e.g. Active) is the first child inside `<form>`, shown only when editing:
```html
<div class="toggle-field" id="detail-status-row" style="display:none">
  <span>Active</span>
  <span class="switch">...</span>
</div>
```

Footer: `.detail-footer { display:flex; align-items:center; gap:.6rem; padding:1rem 1.5rem; }` — no `border-top`, buttons left-aligned (no `margin-left:auto`).

## Toggle switch (bug-safe)

```html
<span class="switch">
  <input type="checkbox" id="..." />
  <span class="switch-track"></span>
</span>
```
```css
.switch { position: relative; display: inline-block; width: 30px; height: 17px; }
.switch input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.switch-track {
  position: absolute; inset: 0; pointer-events: none;   /* REQUIRED — see Hard Rules */
  background: var(--surface-inset); border: 1px solid var(--border-soft);
  border-radius: 999px; transition: background .15s ease, border-color .15s ease;
}
.switch-track::before {
  content: ""; position: absolute; top: 2px; left: 2px; width: 13px; height: 13px;
  border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.3);
  transition: transform .15s ease;
}
.switch input:checked + .switch-track { background: var(--accent-route); border-color: var(--accent-route); }
.switch input:checked + .switch-track::before { transform: translateX(13px); }
```
Wrap in a `<div>` (not `<label>`) when the label text must not also toggle it.

## Grid / column menu

Table container has no bottom padding, so it fills to the pane's bottom edge. Each `<th>` gets a `.th-menu-btn` (☰ icon) opening a `.th-menu` with 3 tabs matching ag-Grid's real `menuTabs`:

1. **General** — Pin Column (Left/None/Right), Autosize This Column, Autosize All Columns, Reset Columns.
2. **Filter** — text "Contains..." input + Apply/Clear, scoped to that column; badge dot on the tab icon when a filter is active.
3. **Columns** — checklist to show/hide columns live; never let the last visible column be unchecked.

Clicking the column label text (separately from the ☰ button) cycles sort asc → desc, with a `.sort-arrow` that's only `opacity: 1` on the active sort column. Build tab/menu icons as inline SVG (`viewBox="0 0 20 20"`, `stroke="currentColor"`), not emoji.

Toolbar row order top to bottom: search + "New [Entity]" button, then a dedicated row with the "Show Inactive" toggle (left) and a `Total: N [Entities]` counter (right) — never "Showing X of Y" phrasing; `N` = active-only count when the toggle is off, all-records count when on.

## Status glyph (boolean columns)

```js
const STATUS_ICON = {
  active: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.2 3.2L15 7"/></svg>',
  inactive: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5.5" y1="10" x2="14.5" y2="10"/></svg>',
};
```
```css
.status-glyph { display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; }
.status-glyph svg { width:14px; height:14px; }
.status-glyph-active { background: var(--success-tint); color: var(--success); }
.status-glyph-inactive { background: var(--surface-inset); color: var(--ink-tertiary); }
```
Give the cell `text-align: center`; keep `title`/`aria-label` with the word for accessibility.

## Form fields (square bordered inputs)

Superseded the earlier Material-underline treatment — this app's actual forms use a full square border box, `border-radius: 0` (no rounding at all, not even `--radius-sm`):

```css
.field-group input, .field-group select {
  border: 1px solid var(--border-strong); border-radius: 0;
  background: var(--surface-elev-2); padding: .55rem .65rem;
}
.field-group input:hover, .field-group select:hover { border-color: var(--ink-secondary); }
.field-group input:focus-visible, .field-group select:focus-visible {
  outline: none; border-color: var(--accent-route); box-shadow: 0 0 0 1px var(--accent-route);
}
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: .9rem; }
```
Labels: weight 600, `letter-spacing: .02em`, no `text-transform: uppercase` — keep the authored Title Case text as-is.

Only include fields the backend actually requires or that are genuinely useful — check the command/DTO before adding a field; if it's optional and not requested, leave it out rather than padding the form (e.g. an optional Address field was dropped from the Users form for this reason).
