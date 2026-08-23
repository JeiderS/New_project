# Local development setup: tenant subdomains

This change (`login-company-selection`) resolves the tenant from the request
subdomain. Locally, that means the SPA and the API must both be reached
through a tenant subdomain rather than plain `localhost`, so the browser sends
the right `Host` header end to end.

## 1. Add hosts-file entries

Map each local tenant subdomain to the loopback address.

**Windows** — edit `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```
127.0.0.1 acme.localhost
127.0.0.1 globex.localhost
```

**macOS / Linux** — edit `/etc/hosts` (with `sudo`):

```
127.0.0.1 acme.localhost
127.0.0.1 globex.localhost
```

Plain `localhost` (no hosts-file entry needed) continues to resolve to the
`default` tenant.

## 2. Configure tenant connection strings (backend)

The committed `Inventory.Api/appsettings.json` ships the `Tenants` section
structure with **empty connection strings only**. Set real values with
`dotnet user-secrets`, never by committing credentials:

```bash
cd Inventory.Api
dotnet user-secrets set "Tenants:Registry:acme:ConnectionString" "<acme SQL Server connection string>"
dotnet user-secrets set "Tenants:Registry:globex:ConnectionString" "<globex SQL Server connection string>"
```

The `default` tenant falls back to the existing `ConnectionStrings:SqlServerConnection`
key automatically if left empty (see `design.md` — Existing Default Tenant
Compatibility shim).

## 3. Run the Angular dev server reachable from a subdomain

By default `ng serve` binds to `localhost` only. To make `acme.localhost:4200`
reachable, bind to all interfaces:

```bash
ng serve --host 0.0.0.0
```

Then open `http://acme.localhost:4200` (or `http://globex.localhost:4200`) in
the browser — not `http://localhost:4200` — to exercise a non-default tenant.

## 4. Run the backend

```bash
cd Inventory.Api
dotnet run
```

The API listens on the same host/port regardless of subdomain; the tenant is
resolved per-request from the `Host` header (see
`openspec/changes/login-company-selection/design.md`).
