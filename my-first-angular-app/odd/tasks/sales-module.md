# Sales module (backend + frontend)

Objective: register manual sales (multi-line), consult sales list/detail, integrate with Inventory (decrement stock + OUT movement) atomically. Mirror Categories/Products/Inventory conventions exactly. Backend `C:\Users\DELL\Desktop\Repo_Backend\Inventory`, frontend `C:\Users\DELL\Desktop\New_project\my-first-angular-app`.

## Specs (verbatim from user request, 2026-10-31)

S1. "Registrar una venta manualmente... Consultar las ventas registradas... Consultar el detalle de una venta... Registrar el origen de la venta para distinguir entre ventas manuales y ventas provenientes de la tienda web."

S2. Sale: Id, Number/reference, SaleDate, Total, Origin (Manual|Web). SaleDetail: Id, SaleId, ProductId, Quantity, UnitPrice (snapshot at sale time — "para que los cambios posteriores del precio del producto no modifiquen las ventas anteriores"), Subtotal. DECIMAL for amounts/quantities. No unnecessary tables/fields.

S3. Manual sale registration: select product, quantity, add multiple products to one sale, show unit price + subtotal per line + total. "Los precios deben obtenerse del producto registrado en el sistema, no confiar en precios enviados por el frontend." Backend computes subtotals/total.

S4. Inventory integration, same transaction: verify sufficient stock per product, decrement Inventory, create one OUT InventoryMovement per product, create Sale+SaleDetails. **"Si algún producto no tiene existencias suficientes, rechazar la operación completa. No registrar una venta parcial ni descontar solamente algunos productos."** Race-safe against concurrent requests.

S5. Web origin: structural support only (Origin field, same registration process reusable later) — NOT a web store/cart/payment integration now. No duplicated registration logic. Manual-only entry point wired now; must require auth same as everything else.

S6. Frontend: Ventas listing (Number/Fecha/Origen/Total/action to view detail), Registrar venta (add products, quantities, live subtotals/total, clear insufficient-stock messaging), Detalle de venta (read-only: header + line items + total). Reuse app-grid/app-modal/AlertService, no new components.

S7. Restrictions: no clientes/proveedores/compras/payment/invoicing/returns/discounts/extra-reports/web-store/cart. Don't touch Categories/Products/Inventory except strictly necessary integration (adding `IInventoryRepository.GetByProductIdAsync` — justified, additive only). No general audit, no unneeded architecture.

S8. Validation (section 9 of request): 1-line sale, multi-line sale, subtotal/total math, stock decrement, OUT movements created, overselling rejected, **rejected sale leaves zero partial changes**, listing, detail, historical price preserved, both repos compile.

## Key design decisions (carried over from Inventory lessons)

- **Action.Code must be the bare verb** ("View", "Create"), never the module name embedded — `RoleRepository.GetActionCodesAsync` concatenates `Module.Name + Action.Code` at runtime. `03_Actions_Seed.sql`'s generic verb-derivation embeds the module name into Code and is NOT safe to rely on (confirmed broken for Inventario) — seed Ventas' View/Create Actions explicitly with bare codes, scoped to the Ventas ModuleId (Actions.ModuleId is a real column — each module gets its own row per verb, not a single globally-shared row).
- **Module name in Spanish** ("Ventas"), ParentId resolved dynamically (sibling of "Productos"), same idiom as `11_Inventory_Module_Actions_Seed.sql`.
- **All-or-nothing multi-line transaction**: `IUnitOfWork.ExecuteInTransactionAsync` only rolls back on a thrown exception, NOT on a lambda returning a Result.Failure (by design, safe for single-step Inventory OUT since nothing is mutated before the WHERE-guard decides). For a multi-line sale, an EARLIER line's atomic decrement can already have committed-within-the-open-transaction before a LATER line's decrement fails — returning an Error Result at that point would still COMMIT the earlier mutation. Fix: a new `InsufficientStockException` (same folder as `DuplicateRecordException`/`ConcurrencyConflictException`, `Inventory.Domain\common\Persistence\`) thrown when the race-safe `TryDecreaseQuantityAsync` returns null during the mutate pass — this routes through `ExecuteInTransactionAsync`'s existing catch-all rollback. The handler catches it around the `ExecuteInTransactionAsync` call and converts to `Result.Failure`.
- **Two-pass handler**: pass 1 (no mutation) validates every line — product exists, inventory row exists, fast-path quantity check, fetch live Price for the snapshot/subtotal, accumulate Total; any failure returns Result.Failure with zero side effects. Pass 2 (after Sale is inserted with the already-computed Total) performs the actual atomic decrement + SaleDetail + InventoryMovement per line; a lost race here throws `InsufficientStockException`.
- **Response quantity bug precedent**: `TryIncrease/DecreaseQuantityAsync` already return `decimal?` (post-update value via `AsNoTracking` re-read) — reuse as-is, never compute the new value from a stale pre-update entity.

## Tasks

- T1 [S2] Entities: `SaleEntity`, `SaleDetailEntity` (Domain), EF configs, DbContext wiring, SQL schema scripts 13/14 — route: delegated writer (backend unit, same writer as T2)
- T2 [S1,S3,S4,S5,S7] Backend: repositories (`ISaleRepository`, `ISaleDetailRepository`, + `IInventoryRepository.GetByProductIdAsync` addition), `InsufficientStockException`, commands/queries/handlers/validators, controller, DI, error builder, DTOs, module/action bootstrap SQL (script 15, bare-verb codes) — route: delegated writer — **Risk: item 1 (data mutation) + item 4 (concurrency) + multi-aggregate atomicity**
- T3 [S6] Frontend: Ventas listing, Registrar venta (multi-line form with live totals), Detalle de venta — route: delegated writer (frontend unit, depends on T2)
- T4 [S8] Verification: focused tests (especially the multi-line partial-failure case) + independent verifier for T2's transaction/rollback logic + live browser validation

## Log

L1 (user, verbatim, 2026-10-31): Full "Implementar módulo Sales (Ventas) – Backend y Frontend" request, plus "continuamos con esto sigue el paso a paso y no hagas sobreingeniria porfavor". Sections 1-9 map to S1-S8 above.
