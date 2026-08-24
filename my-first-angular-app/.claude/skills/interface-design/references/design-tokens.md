# Design Tokens

## Typography

- Font stack (system-only, never an unembedded webfont):
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif`.
  A named Google/custom font with no `@font-face` data URI silently falls back — don't risk it, especially in an Artifact mockup (font CDNs are CSP-blocked there).
- Base size: `html, body { font-size: 14px; }`, not the 16px default. Size everything else in `rem` so density scales from that one root value.
- Font-weight ceiling: **700** max, reserved for the largest headings only (page `<h1>`, panel `<h2>`). Every other emphasis (buttons, cell emphasis, labels, menu section titles) is **600** (semibold). Never 800 — it reads heavy/unprofessional in a system font at small sizes. Compare Linear/Stripe-style admin UIs, which lean semibold, not bold.
- Text case: Title Case (capitalize each major word) for all short UI chrome — labels, buttons, column headers, menu items, toast messages. Do NOT force it via `text-transform: uppercase` in CSS; author the actual text in Title Case instead, and do not uppercase full sentences (help text, placeholders, descriptive paragraphs stay normal sentence case).

## Radius scale actually used

- Buttons and small controls: `5px`.
- Floating detail panel: `4–5px`.
- Do not default to this app's larger `--radius-md` (16px) / `--radius-lg` (24px) tokens for panels or buttons in this admin-panel style — those read as consumer-app soft-card, not enterprise/admin software. `--radius-sm` (10px) is still fine for inputs/menus that call for a touch more roundness (e.g. search field, dropdown menus).

## Color tokens

Reuse `src/styles.css` custom properties — do not invent a parallel palette:

| Token | Purpose |
|---|---|
| `--surface-canvas` / `-elev-1` / `-elev-2` / `-inset` | page bg / toolbar bg / card bg / disabled-field bg |
| `--ink-primary` / `-secondary` / `-tertiary` | body text / secondary text / muted text |
| `--border-soft` / `-strong` | default hairline / emphasized hairline |
| `--accent-route` / `-strong` | brand navy, gradient pair |
| `--success` / `-tint`, `--danger` / `-tint` | status color + its low-opacity background |
| `--radius-sm` / `-md` / `-lg` | 10 / 16 / 24px — see radius scale note above |

## Theme support

Any Artifact mockup must define both themes at the token level, never inline per-component:

```css
:root { /* light defaults */ }
:root[data-theme="dark"] { /* dark overrides */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same dark overrides, OS-driven */ }
}
```

Style every component through the custom properties, never with a hardcoded color duplicated inside the dark block. This applies even when the shipped app itself has no dark-mode toggle yet — the Artifact viewer's own theme can still be either.
