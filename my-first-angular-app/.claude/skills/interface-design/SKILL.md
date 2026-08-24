---
name: interface-design
description: "Trigger: dashboard, admin panel, internal tool UI, CRUD module screen, form/table UX, layout, visual tokens, component system. Applies this app's admin-panel design system to new screens: floating detail panel, ag-Grid-style column menu, toggle switches, Material underline inputs, typography tokens."
license: Apache-2.0
metadata:
  author: "my-first-angular-app"
  version: "1.0"
---

## Activation Contract

Load when: designing or redesigning a dashboard, admin panel, internal-tool screen, or a CRUD module UI (grid + create/edit) under `src/app/features/**`; deciding layout, visual hierarchy, form/table UX, component states, or visual tokens. Do not use for landing/marketing pages.

## Hard Rules

- Grid pane is fixed at exactly half width: `flex: 0 0 50%; max-width: 50%;` — never `flex: 1 1 50%`. Once the detail panel is `position: absolute`, a lone `flex-grow:1` sibling fills 100% even with a 50% basis.
- The create/edit panel is a floating card, never a full-screen dimmed modal and never edge-flush: `position: absolute` inside a `position: relative` workspace, margin insets on every side, closed by default (`opacity:0; visibility:hidden`), toggled visible via an `.open` class.
- Panel corners: 4–5px radius (not this app's larger 16–24px soft-card radius elsewhere). Real `1px solid` border plus a directional `box-shadow`.
- Panel header: eyebrow label + title sit INLINE (`flex-direction: row; align-items: baseline`), never stacked — keeps header height low.
- No separate status-row bar between header and body. A record's active/inactive toggle is the FIRST field inside the form, edit mode only.
- Footer buttons left-aligned by default (no `margin-left:auto` push-right unless asked). No divider line above the footer.
- Toggle switches: the visual `.switch-track` div MUST have `pointer-events: none` — it paints over the real `<input>` in DOM order and silently eats clicks otherwise. Wrap switch+label in a plain `<div>`, never `<label>`, unless the label text should also toggle it.
- Grid fills to its pane's bottom edge (no dead bottom padding). Boolean columns render as a centered colored circle+icon glyph, never a text pill. Records are deactivated, never hard-deleted; active rows always sort first regardless of column sort.
- Typography: system font stack only, never an unembedded webfont — `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`. Base `font-size: 14px` on `html, body`; everything else in `rem`. Font-weight ceiling 700 (biggest headings only), 600 elsewhere — never 800.
- Reuse this app's existing tokens from `src/styles.css` (`--surface-*`, `--ink-*`, `--border-*`, `--accent-route`, `--radius-*`, `--success`, `--danger`) instead of inventing a new palette.

## Decision Gates

| Situation | Action |
|---|---|
| Field logically shouldn't change after creation (e.g. email/key) | Ask the user whether to disable it in edit mode; default to leaving it editable if unspecified |
| New module needs the same grid+panel shape as Users | Follow `references/layout-and-components.md` verbatim, swap entity names/fields only |
| Prototyping this before real code | Use the `artifact-mockup-workflow` skill's process |

## Execution Steps

1. Read `src/styles.css` for the current token values before styling anything.
2. Apply the layout/component patterns in `references/layout-and-components.md`.
3. Apply the typography/token rules in `references/design-tokens.md`.
4. If building a mockup (not final code), follow `artifact-mockup-workflow`.
5. Verify both light and dark theme variants render legibly.

## Output Contract

State which patterns from `references/` were applied, and flag any deviation the user explicitly requested from this spec.

## References

- `references/layout-and-components.md` — floating detail panel, grid/column-menu, toggle switch, form field markup and CSS.
- `references/design-tokens.md` — typography, font-weight, radius, and light/dark theme rules.
- `assets/toggle-switch.html` — copy-paste-ready toggle switch + status glyph snippet with the pointer-events fix baked in.
