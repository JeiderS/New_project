---
name: artifact-mockup-workflow
description: "Trigger: prototype, mockup, design proposal, iterate on UI before coding, Artifact review round, presentame el diseno. Prototype a UI change as an interactive Artifact before writing real code, then iterate with the user."
license: Apache-2.0
metadata:
  author: "my-first-angular-app"
  version: "1.0"
---

## Activation Contract

Load when the user asks to design, redesign, or "present" (presentame el diseño) a new UI screen before it's built, wants to see something before coding it, or is giving iterative visual feedback on something already published as an Artifact.

## Hard Rules

- Build a self-contained interactive HTML/CSS/vanilla-JS Artifact (no build step, no framework) before writing any real Angular code for a new screen design. Only port it to the real codebase after the user approves the mockup.
- Republish every revision to the SAME file path passed to the Artifact tool — this keeps the URL stable across rounds instead of minting a new link each time.
- When the user says "todo" / "everything" / "all of it" about a change, apply it to every matching instance, not just the first/obvious one. Grep the file afterward to confirm zero instances remain before replying.
- After removing or moving any HTML element, grep the `<script>` for orphaned `document.getElementById(...)` calls and duplicate `const` declarations pointing at it — a stale reference throws at runtime the next time that code path fires.
- When the user reports something "doesn't work", "is/isn't editable", or "is broken", verify the current code first (grep the exact logic controlling it) before changing anything. State plainly what you found: a real functional bug, or working logic with a visual-affordance gap. Don't assume the report is right or wrong without checking.
- Default the mockup's UI copy to English (labels, buttons, headers, toasts, code comments) even when the shipped app or the conversation itself is in Spanish, unless told otherwise — ask if unsure. Use Title Case for short UI chrome (labels, buttons, headers, menu items, toast messages); keep full sentences, help text, and placeholders in normal sentence case.
- For any component/layout/token decision, load and follow the `interface-design` skill.

## Decision Gates

| Situation | Action |
|---|---|
| Task is visual/UX design of a new or changed screen | Prototype first (this skill) |
| Task is a pure logic/data fix with no visual change | Skip this skill, edit real code directly |
| Mockup approved, ready to build | Port the approved patterns into the real Angular files, following `interface-design` |

## Execution Steps

1. Confirm scope: what screen/module, what data shape.
2. Load `interface-design` for layout/component/token rules.
3. Write the mockup file, publish via the Artifact tool.
4. On each round of feedback: edit precisely what was asked, grep for orphaned refs, republish to the same path, summarize what changed in 2–4 lines.
5. On approval, implement in the real Angular files and note any place the real implementation had to diverge from the mockup (e.g. real ag-Grid API instead of hand-rolled table).

## Output Contract

Each round: the Artifact URL (only needs restating if it's the first publish) plus a short bullet list of exactly what changed.

## References

- `interface-design` skill — layout, component, and token rules to apply while prototyping.
