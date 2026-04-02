---
name: best-practices-for-typing
description: >
  Enforces robust TypeScript typing practices for Angular codebases, including strict typing,
  null safety, type inference, union and tuple modeling, and compiler configuration.
  Trigger: when writing or refactoring TypeScript models, services, components, or tsconfig typing rules.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Best Practices for Typing

## When to Use

- Writing or refactoring TypeScript in Angular applications.
- Defining domain models, DTOs, and API contracts.
- Hardening null safety and strict compiler checks.
- Improving maintainability by replacing weak or unsafe types.

## General Guidelines

- Type everything.
- Avoid `any`.
- Use type inference when it improves clarity.
- Keep typing explicit for object literals and domain values.

## Avoid `any`

```ts
// ❌ Avoid
const user: any = { name: 'Martin' };
console.log(user.manager.name);

// ✅ Prefer proper typing
interface User {
  name: string;
}

const user: User = { name: 'Martin' };
console.log(user.manager.name); // compile-time error before runtime
```

If the type is truly unknown, use `unknown` instead of `any`.

## Type Inference vs Explicit Types

### Prefer inference when the type is obvious

```ts
// ✅ Primitive inference
const name = 'Martin';

// ✅ Complex inference from already typed source
const status = this.user.status;
```

### Prefer explicit typing when inference can drift

```ts
// ❌ Inferred too broadly
const user = { name: 'Martin', status: 'busy' }; // status inferred as string

// ✅ Explicit domain type
const user: User = { name: 'Martin', status: 'busy' };

// ✅ Explicit domain union when assigning primitive
const status: UserStatus = 'busy';
```

## Structural Types: Interface over Class

Use interfaces for shape-only contracts.

```ts
// ❌ Avoid for pure structural typing
class User {
  constructor(public id: number, public name: string) {}
}

// ✅ Preferred
interface User {
  id: number;
  name: string;
}
```

## Prefer Specific Types over Generic `string`/`number`

Use unions for controlled values:

```ts
// ❌
type Status = string;
type Priority = number;

// ✅
type Status = 'active' | 'inactive' | 'pending';
type Priority = 1 | 2 | 3;
```

## Tuple Types for Fixed-Length Arrays

```ts
// ❌
const parents: string[] = ['Ana', 'Luis'];

// ✅ exactly 2 values
const parents: [string, string] = ['Ana', 'Luis'];

// ✅ at least 1 value
const siblings: [string, ...string[]] = ['Julia', 'Mateo'];
```

## Null Safety

With `strictNullChecks`, `null` and `undefined` are not assignable unless explicitly modeled.

```ts
// ❌
const name: string = null;

// ✅
const name: string | null = null;
```

### Rules

- Avoid adding `null`/`undefined` unless it is a real domain case.
- Use optional chaining for safe access: `user?.manager?.name`.
- Use nullish coalescing for defaults: `name ?? 'Default name'`.
- Use non-null assertion (`!`) only when certainty is guaranteed.

```ts
const managerName = user?.manager?.name ?? 'No manager';
const sureName = user!.name; // use with caution
```

## TypeScript Compiler Configuration

Use strict options in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "allowUnreachableCode": false,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## Import Aliases

Use path aliases to avoid fragile relative imports.

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@shared/*": ["app/shared/*"],
      "@features/*": ["app/features/*"],
      "@core/*": ["app/core/*"]
    }
  }
}
```

```ts
// ❌
import { UserCard } from '../../../../shared/user-card/user-card';

// ✅
import { UserCard } from '@shared/user-card/user-card';
```

## Commands

```bash
# Type-check project
npm run build

# Run tests to validate typed behavior
npm run test
```

## Quick Checklist

- [ ] No `any` unless absolutely unavoidable.
- [ ] Inference used where clear; explicit typing used where necessary.
- [ ] Domain values modeled with unions/tuples where applicable.
- [ ] Nullability modeled intentionally (not by default).
- [ ] Strict compiler flags enabled.
- [ ] Import aliases configured and used.
