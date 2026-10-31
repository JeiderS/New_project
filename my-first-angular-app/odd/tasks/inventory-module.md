# Inventory module (backend + frontend)

Objective: full Inventory module (stock listing, register IN/OUT, movement history) across two repos — backend `C:\Users\DELL\Desktop\Repo_Backend\Inventory` (.NET 8/EF Core 8/SQL Server, no EF migrations, raw idempotent SQL in `Sql\TenantBootstrap`) and frontend `C:\Users\DELL\Desktop\New_project\my-first-angular-app` (Angular, standalone components). Mirror Products/Categories conventions exactly; no new architecture.

## Specs

S1. Listing: "Obtener los productos con sus existencias actuales. Mostrar nombre del producto, categoría y cantidad disponible. Permitir consultar y buscar productos siguiendo los patrones existentes." → backend returns ALL rows (no pagination, matches `GetProductsQuery`), frontend filters client-side (matches `visibleProducts` computed pattern) — no new backend search/filter params.

S2. Register IN: "Recibir el identificador del inventario, cantidad y descripción. Validar que el inventario exista. Validar que la cantidad sea mayor que cero. Aumentar Inventory.Quantity. Registrar el movimiento en InventoryMovement con MovementType = IN."

S3. Register OUT: "Recibir el identificador del inventario, cantidad y descripción. Validar que el inventario exista. Validar que la cantidad sea mayor que cero. Comprobar que existan suficientes unidades. Disminuir Inventory.Quantity. Registrar el movimiento en InventoryMovement con MovementType = OUT. Nunca permitir existencias negativas."

S4. History: "Consultar los movimientos de inventario. Mostrar producto, tipo de movimiento, cantidad, descripción y fecha. Permitir consultar los movimientos de un producto específico si sigue el patrón de filtros existente." → no backend filter-by-product param exists anywhere in the codebase to mirror, so return ALL movements and let the frontend filter client-side, same as S1.

S5. "La actualización de Inventory y el registro de InventoryMovement deben ejecutarse dentro de una misma transacción. Si falla alguna operación, ambas deben revertirse." → explicit DB transaction (new to this codebase — zero existing precedent per explorer grep), both writes inside it.

S6. "Evitar stock negativo incluso si se producen solicitudes simultáneas." → atomic conditional UPDATE (EF Core 8 `ExecuteUpdateAsync` with a `WHERE Quantity >= amount` guard for OUT), not optimistic-concurrency tokens (avoids altering the `Inventory` table's structure, which is otherwise off-limits without justification).

S7. "Los movimientos no se editan ni eliminan." → already enforced: `InventoryMovementEntity` has no Update/Delete, only `Create()` (built in prior session).

S8. "No implementar auditoría general." / "No agregar tablas nuevas." → no new tables; reuse `Inventory`/`InventoryMovement` as-is.

S9. Frontend screens: Existencias (grid: producto/categoría/cantidad, búsqueda, acciones Entrada/Salida/Movimientos), Formulario de entrada (producto, cantidad, descripción, guardar), Formulario de salida (producto, existencias disponibles, cantidad a retirar, descripción, guardar), Inventory History (producto, tipo, cantidad, descripción, fecha). Reuse `app-grid`, `app-modal`, `AlertService`, Reactive Forms — no new visual components.

S10. Integration: "Integrar el módulo con el sistema actual de rutas y navegación. Respetar el sistema dinámico de módulos y permisos." → Module/Action rows for "Inventory" (custom actions `InventoryView`/`InventoryRegisterIn`/`InventoryRegisterOut`) don't exist yet and the generic `03_Actions_Seed.sql` can't generate custom verbs — create them via a new idempotent bootstrap SQL script (same TenantBootstrap mechanism already used for schema), not via a one-time manual admin action, since this is multi-tenant.

S11. "No modificar Categories ni Products, excepto si existe una dependencia estrictamente necesaria." → every `Product` needs a matching `Inventory` row (Quantity=0) for the flow to work end-to-end. Justified necessary dependency: `CreateProductCommandHandler` also creates the `Inventory` row (same handler, one extra repo call). Existing products get a one-time idempotent SQL backfill script (new Inventory rows only — Products table itself untouched).

S12. Restrictions: no Compras/Ventas/Proveedores/multi-bodega/auditoría/alertas de stock bajo/reportes/abstracciones innecesarias.

S13. Final validation (section 7 of request): listing works, IN increases quantity, OUT decreases quantity, OUT rejected when insufficient, each operation recorded as a movement, history shows movements, backend+frontend compile.

## Tasks

- T1 [S5,S6] Extend `IUnitOfWork` with transaction-scoped execution helper — route: delegated writer (backend unit)
- T2 [S1,S2,S3,S4,S10,S11] Backend: repositories, commands/queries/handlers/validators, controller, DI registration, error builder, DTOs, module/action bootstrap SQL, Product-creation dependency — route: delegated writer (backend unit) — **Risk: item 1 (data mutation) + item 4 (concurrency)**
- T3 [S9,S10] Frontend: Existencias page (grid+search+actions), Entrada/Salida modals, History page, service, routes, menu wiring — route: delegated writer (frontend unit, depends on T2)
- T4 [S13] Verification: focused build/compile checks both repos + independent verifier for T2's transaction/concurrency logic (high-risk) — route: inline (parent) + one independent verifier subagent

## Log

L1 (user, verbatim, 2026-10-30): Full "Completar módulo Inventory (Backend + Frontend)" request — see conversation. Sections 1-7 map to S1-S13 above.

L2 (2026-10-30): T2 backend implemented by delegated writer. Build: 0 compiler errors. New handler tests initially failed (quantity math off by exactly the delta) — root cause was `FakeInventoryRepository` mutating the shared entity instead of reproducing `ExecuteUpdateAsync`'s bypass-of-change-tracker behavior; fixed, 4/4 green. Independent verifier (general-purpose, since the dedicated review-risk agent is locked to a different gentle-ai binding contract and has no file tools) found transaction/atomicity logic correct, but one real bug: response DTO's `Quantity` was computed from the stale pre-update entity instead of the true post-update value — fixed by changing `TryIncrease/DecreaseQuantityAsync` to return `decimal?` (post-update quantity via `AsNoTracking()` re-read) instead of `bool`. Re-verified, 4/4 green. T2 done.

L3 (user, verbatim, 2026-10-30): "has los reportes en español y no hagas sobreingenieria" — reportes de cierre en español desde ahora; mantener el alcance mínimo pedido.

L4 (2026-10-30): T3 frontend implementado por writer delegado. `ng build` verificado dos veces (writer + spot-check del padre): compila limpio, chunk lazy `inventory-routes` generado (12.46 kB). Spot-check manual de `inventory-management.ts/html` e `inventory-history.ts` confirmó: reusa `app-grid`/`app-modal`/`AlertService` sin componentes nuevos, un solo modal con `mode` para Entrada/Salida, "Existencias disponibles" presente en el formulario de salida (spec S9), filtro cliente igual al de Products. No se pudo validar en browser real (requiere backend corriendo + DB con los scripts 09-12 aplicados + credenciales) — pendiente T4 (S13, validación final en vivo).

L5 (2026-10-30): Módulo "Inventario" renombrado a español (era "Inventory" en inglés, inconsistente con "Categorías"/"Productos") — Module.Name, Action codes del controller (`InventarioView`/`InventarioRegisterIn`/`InventarioRegisterOut`) y script 11 corregidos. Bug real encontrado durante validación en vivo: `Actions.Code` no debe llevar el nombre del módulo embebido (`GetActionCodesAsync` lo concatena en runtime) — el script 11 tal como quedó en el repo todavía tiene ese bug en los datos que inserta; el usuario corrigió los datos directamente en su base y pidió no tocar nada más (ver memoria `bug/real-actions-code...`). T4/S13 completado: los 6 casos de validación de la sección 6 del pedido original se probaron en vivo en el browser (listado, entrada 0→20, salida 20→15, rechazo de salida>stock con 409, historial con filtro por producto) — todos correctos. Feature cerrada.
