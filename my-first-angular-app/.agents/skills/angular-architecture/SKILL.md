---
name: angular-architecture
description: >
  Defines Angular folder architecture using core/features/shared, domain-first organization,
  and dependency boundaries. Trigger: when creating new features, restructuring folders,
  or deciding whether to create a new file or a new folder.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Angular Architecture (Folder Structure)

## When to Use

- Create a new feature or page.
- Refactor Angular folder structure.
- Define boundaries between `core`, `features`, and `shared`.
- Decide whether to create a **new file** or a **new folder**.

## Core Principles

1. Organize by **business domain**, not by technical type.
2. Keep the folder tree aligned with application routing/navigation.
3. Avoid redundant folder names in paths.

```txt
❌ blog/blog-post/blog-post.ts
✅ blog/post/blog-post.ts

❌ admin/admin-dashboard/admin-dashboard-settings/admin-dashboard-settings.ts
✅ admin/dashboard/settings/admin-dashboard-settings.ts
```

## Recommended Project Structure

```txt
<project root>
├── public
├── src
│   ├── app
│   │   ├── core
│   │   ├── features
│   │   ├── shared
│   │   └── ...
│   ├── environments
│   ├── index.html
│   ├── styles.scss
│   └── ...
├── angular.json
├── package.json
└── ...
```

## Folder Responsibilities

### `core/`

Include global, non-business concerns:
- authentication infrastructure
- app layout shell
- HTTP interceptors

```txt
core
├── auth
│   └── auth.ts
├── layout
│   ├── nav-bar
│   │   └── nav-bar.ts
│   └── page-layout
│       └── page-layout.ts
├── interceptors
│   └── error-handler-interceptor.ts
└── ...
```

**Boundary rule:** do not import from `features/` into `core/`.

### `features/`

Include business domains and subdomains:

```txt
features
├── dashboard
│   └── dashboard-page.ts
├── blog
│   ├── feed
│   │   └── blog-feed-page.ts
│   ├── post
│   │   ├── comment
│   │   │   └── blog-post-comment.ts
│   │   └── blog-post-page.ts
│   └── blog.routes.ts
└── ...
```

- Nested folders are encouraged when they mirror domain depth.
- Co-locate related files (component, template, styles, store, API client).
- For domains with multiple routes, create a dedicated `<feature>.routes.ts`.

### `shared/`

Include reusable cross-feature assets:
- reusable components
- directives
- pipes
- models
- generic services

```txt
shared
├── components
│   ├── form
│   │   ├── color-picker
│   │   ├── search-bar
│   │   └── input-file
│   └── confirm-dialog
├── directives
├── models
├── pipes
├── services
└── ...
```

**Boundary rule:** do not import from `core/` or `features/` into `shared/`.

## Decision Matrix: New Folder vs New File

Use this matrix to decide automatically:

| Case | New file | New folder |
|---|---|---|
| Single isolated artifact (one file) | ✅ | ❌ |
| New component with html/css/spec + related files | ❌ | ✅ |
| New sub-route or subdomain | ❌ | ✅ |
| Small utility with no expected growth | ✅ | ❌ |
| Reusable asset likely to grow | ⚠️ | ✅ |

### Practical Heuristic

- If it is only **one file** and unlikely to grow → create a file.
- If it has **two or more related files** → create a folder.
- If it maps to a **domain concept** or **navigation segment** → create a folder.

## Other Files and Folders (Reference)

- `public/`: static assets copied as-is to build output.
- `dist/`: generated build output from Angular CLI.
- `.angular/`: Angular CLI cache.
- `node_modules/`: installed npm dependencies.
- `src/main.ts`: Angular entry point.
- `src/index.html`: host document.
- `src/styles.scss`: global styles.
- `angular.json`: Angular CLI configuration.
- `package.json` / `package-lock.json`: scripts and dependency definitions.
- `tsconfig*.json`: TypeScript configurations.

## Commands

```bash
# Generate standalone component in a domain path
ng generate component src/app/features/blog/post/blog-post-page --standalone

# Run unit tests after structural refactors
npm run test
```

## Quick Checklist

- [ ] Structure follows business domain and navigation.
- [ ] `core`, `features`, and `shared` boundaries are respected.
- [ ] No forbidden cross-layer imports.
- [ ] Redundant folder naming is removed.
- [ ] Folder-vs-file decision matrix was applied.
