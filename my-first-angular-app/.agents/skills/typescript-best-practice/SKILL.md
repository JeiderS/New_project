---
name: typescript-best-practice
description: >
  Enforces TypeScript class best practices for Angular standalone components, including selector naming,
  class member ordering, input/output signals, lifecycle usage, and safe DOM interaction.
  Trigger: when creating or refactoring Angular component classes, inputs/outputs, lifecycle hooks,
  or component-level TypeScript conventions.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# TypeScript Best Practice (Angular Classes)

## When to Use

- Create or refactor Angular component classes.
- Review conventions for TypeScript class structure in Angular.
- Migrate from legacy decorators (`@Input`, `@Output`) to signal APIs.
- Improve consistency, readability, and maintainability of component class code.

## Critical Patterns

### 1) Component structure and files

- Use separate files for class, template, and styles.
- Exception: single-file component is acceptable only when there is no style and the template is very short (1-3 lines).
- Use standalone components.

```ts
// ❌ Avoid
@Component({ standalone: false })

// ✅ Preferred (standalone true by default)
@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.css',
})
export class UserCardComponent {}
```

### 2) Selector and naming conventions

- Always use a selector prefix (default: `app-`).
- In multi-project workspaces, project-specific prefixes are recommended.
- Selector should mirror class semantic name in kebab-case.

Given class: `ManagerTeamPreviewMenuComponent`

- ❌ `selector: 'app-team-preview'`
- ✅ `selector: 'app-manager-team-preview-menu'`

### 3) Class member ordering

Group attributes first, then methods.

Recommended attribute order:
1. Injected dependencies
2. Constants
3. Inputs
4. Outputs
5. Internal component state

```ts
export class UserPageComponent {
  // 1) Injected dependencies
  private readonly userHttpClient = inject(UserHttpClient);

  // 2) Constants
  protected readonly userStatus = UserStatus;

  // 3) Inputs
  readonly user = input.required<User>();

  // 4) Outputs
  readonly deleteUser = output<void>();

  // 5) Internal state
  readonly profileForm = new FormGroup({});
  readonly userManager = computed(() => this.user()?.manager);

  constructor() {}

  submit(): void {}
}
```

### 4) Inputs & outputs (signals-first)

- Prefer `input()` and `output()` over `@Input()` and `@Output()`.
- Always type `input` and `output`.
- Use `input.required<T>()` for mandatory inputs.
- Use `model()` for two-way binding.

```ts
// ❌ Avoid
@Input() mandatoryField!: string;
@Output() selectedChange = new EventEmitter<boolean>();

// ✅ Preferred
readonly mandatoryField = input.required<string>();
readonly selected = model(false);
readonly saved = output<string>();
```

### 5) Lifecycle hooks: last resort, not default

- Prefer signals and reactive patterns first:
  - `computed()` / `effect()`
  - `viewChild()` / `viewChildren()` signal queries
  - `takeUntilDestroyed()` for RxJS cleanup
- You can initialize component logic in `constructor` instead of `ngOnInit` when appropriate.
- If a lifecycle hook is implemented, also implement its TypeScript interface.

```ts
// ❌ Avoid
export class UserPageComponent {
  ngOnInit(): void {}
}

// ✅ Preferred
export class UserPageComponent implements OnInit {
  ngOnInit(): void {}
}
```

Exceptions (Angular still hybrid in practice):
- Form initialization in specific scenarios
- Route data wiring

### 6) Avoid direct DOM access

- Do not use direct browser APIs in component logic when Angular abstractions are available.
- Avoid patterns like:
  - `document.getElementById(...)`
  - `document.createElement(...)`
  - `window.innerWidth`

Prefer:
- Declarative template control flow
- Query APIs (`viewChild`, `viewChildren`, `contentChild`, `contentChildren`)
- Angular Material utilities (e.g., `MediaMatcher`) where applicable

## Commands

```bash
# Generate standalone component
ng generate component features/user/user-page --standalone

# Migrate @Input/@Output decorators to signal APIs (when supported by your Angular CLI)
ng generate @angular/core:signal-input-migration

# Run unit tests after refactor
npm run test
```

## Quick Review Checklist

- [ ] Standalone component and separate class/template/style files used.
- [ ] Selector uses prefix and matches class semantic name in kebab-case.
- [ ] Class members are grouped and ordered consistently.
- [ ] `input()/output()/model()` used with explicit typing.
- [ ] Lifecycle hooks used only when truly necessary; interfaces implemented.
- [ ] No direct DOM manipulation bypassing Angular abstractions.
