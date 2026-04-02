---
name: best-practices-in-coding-style
description: >
  Enforces high-impact TypeScript coding style practices for Angular projects, including naming,
  explicitness, consistency, function semantics, and comment quality.
  Trigger: when writing or refactoring TypeScript code, reviewing naming conventions,
  or standardizing code style across features.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Best Practices in Coding Style

## When to Use

- Writing or refactoring TypeScript code.
- Reviewing naming conventions and code readability.
- Standardizing code style across Angular features.
- Running code review focused on clarity, consistency, and maintainability.

## General Guidelines

- Maintain consistency.
- Prefer clarity over short code.
- Ensure explicitness.
- Avoid redundancy.

## Naming

### Types and declarations

- Use `PascalCase` for enums, classes, types, and interfaces.
- Avoid type indicators in interface names.
- Avoid type indicators in enum names.

```ts
// ❌
interface IUser {}
interface UserInterface {}
enum EUserStatus {}

// ✅
interface User {}
enum UserStatus {}
```

### Variables and methods

- Use `camelCase` for variables and methods.
- Avoid abbreviations; prefer full words.
- Avoid ambiguous names.
- Structure ownership names as `<owner><Value>` (e.g., `userId`, `companyDepartmentManagerName`).
- Use plural names for iterables.

```ts
// ❌
const usrCnt = 1;
const id = 7;
const idUser = 7;
const userList = getUserArray();

// ✅
const userCount = 1;
const userId = 7;
const companyDepartmentManagerName = 'Ana';
const users = getUsers();
```

### Private fields

- Prefer JavaScript private fields (`#`) over TypeScript-only `private` for true runtime privacy.

```ts
// ❌
private token = '';
_token = '';

// ✅
#token = '';
```

Exception:
- Avoid `#` when targeting environments where downlevel transforms hurt performance/bundle size.

### Function naming semantics

Use verb-based names and keep semantics consistent:

- `get`: return a value (no side effect)
- `set`: assign a property (no return expected)
- `is` / `has`: return boolean
- `create`: instantiate new object
- `delete`: delete object
- `add`: insert into collection
- `remove`: remove from collection
- `to`: convert and return
- `toggle`: switch binary state

### Maps naming

- Name maps as `keyToValue`.

```ts
// ❌ unclear
const usersMap = new Map<number, User>();

// ✅ explicit
const userIdToManager = new Map<number, User>();
const companyIdToUsers = new Map<number, User[]>();
```

### Angular file naming preferences

- Prefer descriptive names over type suffixes when possible.
- Routed components should end with `-page`.
- Prefer `-` separator over `.` for guards/pipes/resolvers/interceptors.

```txt
❌ user.component.ts      ✅ user-card.ts
❌ user.service.ts        ✅ user-http-client.ts
❌ authenticated.guard.ts ✅ authenticated-guard.ts
❌ error.interceptor.ts   ✅ error-interceptor.ts
```

## Code Rules

- Avoid `var`; default to `const`, use `let` only when reassignment is required.
- Use strict equality (`===`, `!==`) instead of loose equality.
- Use single quotes for strings.
- Use template literals for interpolation.
- Prefer arrow functions over anonymous `function` expressions.
- Prefer pure functions when possible.

```ts
// ❌
var a = 1;
if (a == '1') {}
const text = "hello";
const msg = 'I am ' + age + ' years old';

// ✅
const a = 1;
if (a === 1) {}
const text = 'hello';
const msg = `I am ${age} years old`;
const fn = () => {};
```

Exception:
- `== null` can be acceptable when intentionally checking both `null` and `undefined`.

## Comments

- Comments should explain **why**, not **how**.
- `TODO` and `FIXME` must include a task reference.

```ts
// ❌
// TODO improve performance

// ✅
// TODO #2831: improve performance (GitHub issue or Jira ticket)
```

## Commands

```bash
# Run lint checks (if configured)
npm run lint

# Run tests after style refactors
npm run test
```

## Quick Checklist

- [ ] Naming is explicit, consistent, and domain-oriented.
- [ ] `const`/`let` used correctly (`var` avoided).
- [ ] Strict equality used except intentional nullish checks.
- [ ] String and interpolation style is consistent.
- [ ] Function names use proper verb semantics.
- [ ] Comments explain rationale and TODO/FIXME include task IDs.
