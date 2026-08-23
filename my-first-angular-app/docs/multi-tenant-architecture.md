# Arquitectura Multi-Tenant: cómo funciona el login por dentro

Este documento reemplaza el borrador anterior ("Base de Datos Central / Pool de Conexiones Dinámico / Redis"). Esa estrategia **no es la que se implementó**. Lo que sigue describe el sistema real, tal como quedó construido en el cambio `login-company-selection` (archivado en `openspec/changes/archive/2026-08-23-login-company-selection/`).

## El modelo: Database per Tenant (correcto, se mantiene)

Cada empresa (tenant) tiene su propia base de datos SQL Server, completamente aislada de las demás. Esto sigue siendo así — la parte del borrador original que describía el modelo "Database per Tenant" en sí (aislamiento total, sin mezclar registros entre clientes, backups independientes) es correcta y se mantiene sin cambios.

Lo que cambió es **cómo la API sabe a qué base de datos conectarse**. El borrador proponía tres componentes (DB Central, Pool dinámico, Redis). El sistema real usa un mecanismo más simple con **cero infraestructura adicional en tiempo de ejecución**.

## Qué NO existe (a diferencia del borrador original)

| Borrador original | Realidad implementada |
|---|---|
| Base de Datos Central consultada en cada login | **No existe ninguna DB central.** El tenant se resuelve por el subdominio de la petición (`acme.tuapp.com`), no buscando el usuario en una tabla maestra. |
| Redis / caché distribuido para las connection strings | **No hace falta.** El registro de tenants vive en config estática (`appsettings.json` + user-secrets/variables de entorno), cargado en memoria una sola vez al arrancar el proceso. |
| `Map<TenantID, ConnectionPool>` armado a mano | **No se construye ningún pool manual.** ADO.NET/`SqlClient` ya poolea conexiones automáticamente por cada connection string distinta — reinventar eso hubiera sido trabajo innecesario. |
| Script CLI que recorre tenants para migrar el esquema | **No se usan EF Core migrations en este proyecto** (decisión explícita). El esquema se gestiona con SQL directo, corrido a mano contra cada base de tenant. |

## El flujo real, paso a paso

### Paso 1 — Cualquier petición llega primero al middleware de resolución de tenant

Antes de que el login (o cualquier otro endpoint) se ejecute, corre `TenantResolutionMiddleware` (`Inventory.Api/Middleware/TenantResolutionMiddleware.cs`):

1. Lee el header `Host` de la petición (ej. `acme.localhost` o `acme.tuapp.com`).
2. Le quita el dominio raíz configurado (`Tenants:RootDomains` en `appsettings.json`) usando un match **anclado por punto** — no un "termina en" ingenuo. Esto importa: `eviltuapp.com` NO matchea la raíz `tuapp.com` (solo `algo.tuapp.com` sí), porque un match sin ancla dejaría pasar dominios falsos como si fueran subdominios reales.
3. Busca esa clave (`acme`, `default`, etc.) en `Tenants:Registry`, que está en memoria desde el arranque — **cero consultas a base de datos, cero llamadas de red** en este paso.
4. Si la clave no existe: responde 404 ("Unknown tenant.") o 400 (host que no matchea ningún dominio raíz) **antes** de que se ejecute cualquier lógica de autenticación.
5. Si existe: guarda la connection string de esa empresa en `ITenantContext` (`Inventory.Api/Tenancy/TenantContext.cs`), un objeto **scoped** (uno por petición).

Esta lógica de comparación de dominios vive en `Inventory.Api/Tenancy/DomainMatcher.cs` y `TenantResolver.cs` — son funciones puras, sin dependencia de `HttpContext`, por eso son 100% testeables de forma aislada (`Inventory.Tests/Tenancy/TenantResolverTests.cs`).

### Paso 2 — La base de datos de la petición ya queda resuelta antes de tocar el login

`Program.cs` registra `DataBaseContext` con el overload de `AddDbContext` que recibe el `IServiceProvider`:

```csharp
AddDbContext<DataBaseContext>((sp, options) =>
    options.UseSqlServer(sp.GetRequiredService<ITenantContext>().ConnectionString));
```

Como las opciones de EF Core con este overload son `Scoped` por defecto, cada petición arma su propio `DataBaseContext` apuntando a la connection string que el middleware del Paso 1 ya resolvió. **`LoginCommandHandler` no cambió ni una línea** — sigue haciendo exactamente lo mismo que siempre hizo (buscar el usuario por email, verificar el hash BCrypt), solo que ahora el `DataBaseContext` que recibe ya apunta a la base de Acme (o la que corresponda), de forma transparente.

### Paso 3 — Login normal, JWT con el claim `tenant`

El login sigue siendo solo email + contraseña — **no hay ningún campo de "empresa" en el formulario**. El backend arma el JWT igual que antes (`Inventory.Api/Auth/JwtTokenGenerator.cs`), pero ahora agrega un claim `tenant` con la clave resuelta en el Paso 1:

```json
{
  "sub": "9",
  "email": "seed-acme@example.com",
  "tenant": "acme",
  "exp": 1787464464
}
```

### Paso 4 — En cada petición posterior, el tenant se vuelve a resolver Y se valida contra el JWT

Acá está la diferencia de seguridad más importante frente al borrador original: como la clave de firma del JWT es la misma para **todos** los tenants, un token válido de Acme también sería técnicamente válido (firma correcta) si alguien lo reenvía contra `globex.localhost`. Por eso existe `TenantClaimValidationMiddleware` (corre después de `UseAuthentication`): en cada petición autenticada, vuelve a resolver el tenant desde el subdominio (Paso 1, de nuevo — es tan barato que no hace falta cachear nada) y compara ese valor contra el claim `tenant` del JWT. Si no coinciden (o el JWT no tiene el claim, por ejemplo un token emitido antes de este cambio), responde 401.

### Diagrama real

```
Login (POST /auth/login, Host: acme.localhost)
  │
  ▼
TenantResolutionMiddleware       ← lee Host, matchea contra Tenants:RootDomains
  │   (config en memoria, sin DB, sin red)
  │   resuelve ITenantContext { Key: "acme", ConnectionString: "...InventoryAcme..." }
  ▼
LoginCommandHandler               ← sin cambios, usa DataBaseContext (ya apunta a InventoryAcme)
  │
  ▼
JwtTokenGenerator                 ← agrega claim "tenant": "acme"
  │
  ▼
200 OK { token }


Petición autenticada posterior (GET /auth/me, Host: acme.localhost, Bearer <token>)
  │
  ▼
TenantResolutionMiddleware       ← vuelve a resolver "acme" (igual de barato que la vez anterior)
  ▼
UseAuthentication                 ← valida firma/expiración del JWT
  ▼
TenantClaimValidationMiddleware  ← compara claim "tenant" del JWT vs "acme" resuelto ahora
  │   coinciden → sigue          │   no coinciden → 401, el endpoint nunca se ejecuta
  ▼
Controller / Handler
```

## Configuración

```jsonc
// appsettings.json — SOLO estructura, connection strings vacías (nunca se commitean)
"Tenants": {
  "RootDomains": [ "localhost", "127.0.0.1" ],
  "DefaultKey": "default",
  "Registry": {
    "default": { "Name": "Mi Empresa", "ConnectionString": "" },
    "acme":    { "Name": "Acme S.A.",  "ConnectionString": "" }
  }
}
```

Las connection strings reales van por `dotnet user-secrets` en desarrollo, o variables de entorno (`Tenants__Registry__acme__ConnectionString`) en despliegue — nunca committeadas.

## Cómo se gestiona el esquema (migraciones) — corrección importante

El borrador original proponía un script CLI que recorre todos los tenants aplicando migraciones de EF Core. **Eso no se usa en este proyecto.** La regla es: el esquema de cada base de tenant se crea y actualiza con **SQL directo** (scripts `CREATE TABLE`/`ALTER TABLE` corridos manualmente contra cada base), no con `dotnet ef migrations`. Cuando se agregue una empresa nueva, el proceso es: crear la base vacía, correr el script de esquema against ella, y agregar su entrada a `Tenants:Registry`.

## Agregar un tenant nuevo (proceso real, no automático)

1. Crear la base de datos SQL Server vacía para la nueva empresa.
2. Correr el script SQL de esquema contra esa base (mismo esquema que las demás — el modelo actual asume que **todas las bases de tenant tienen el esquema idéntico**, no se soporta divergencia de esquema por tenant).
3. Agregar la entrada en `Tenants:Registry` (estructura en `appsettings.json`, connection string real en user-secrets/variables de entorno).
4. Reiniciar el backend (la config se carga una sola vez al arrancar — no hay recarga en caliente, es una decisión deliberada: los tenants se crean manualmente y rara vez, no vale la pena la complejidad de un hot-reload).

## Ventajas y desventajas (se mantienen del análisis original)

**Ventajas**: aislamiento total entre empresas, imposible mezclar registros de dos tenants por un error de `WHERE`, backups y escalado independientes por cliente.

**Desventajas**: más costo de infraestructura (una base por empresa), y cada cambio de esquema debe aplicarse a mano en cada base de tenant (sin la automatización de un script de migraciones, ya que no se usan EF migrations).

## Frontend

- `src/environments/environments.ts` arma la URL de la API a partir de `window.location.hostname` en desarrollo (así el navegador manda el `Host` correcto según el subdominio donde esté parado el SPA) — y `environments.prod.ts` usa una ruta relativa `/api/v1` (mismo origen) en producción.
- `src/app/core/auth/interceptors/auth.interceptor.ts` captura cualquier `401` (ya sea por token expirado o por el mismatch de tenant del Paso 4) y fuerza el cierre de sesión + redirección a `/login`.
- El formulario de login (`src/app/core/auth/pages/login/`) sigue siendo solo email + contraseña — la selección de empresa nunca fue un campo de UI, es 100% resuelta por el subdominio de la URL.
