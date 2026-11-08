# Customers module (backend + frontend + Sales integration)

Objective: CRUD module for Customers (mirrors Categories/Products exactly, no transaction complexity), plus an optional CustomerId on Sale. Backend `C:\Users\DELL\Desktop\Repo_Backend\Inventory`, frontend `C:\Users\DELL\Desktop\New_project\my-first-angular-app`.

## Specs (verbatim, 2026-10-31)

S1. Table `Customers`: IdCustomer(PK)→**CustomerId** (suffix convention, same resolution as Inventory's IdInventory), Name NVARCHAR(150), Phone NVARCHAR(30), Email NVARCHAR(150) NULL, Address NVARCHAR(250) NULL, IsActive BIT, CreatedAt DATETIME2, UpdatedAt DATETIME2 NULL. Idempotent SQL script, same location/style as existing scripts.

S2. Backend: list, get by id, create, edit, activate/deactivate (unified status endpoint, same as Category's). Validation: Name required (reject empty/whitespace), Phone required (reject empty/whitespace), Email optional but valid format when provided. No history/audit/extra features.

S3. Frontend: Customers screen — listing, search by name or phone, add button, edit action, activate/deactivate action. Create/edit form: Name, Phone, Email, Address, Status. Reuse existing components/modals/validations/styles (Categories pattern).

S4. Sales integration: optional CustomerId on a Sale (nullable, never required). Sale form lets the user pick an existing customer. Sale detail shows the customer when present. Existing sales without a customer keep working. Minimal change only.

S5. Restrictions: no customer accounts, multiple addresses, purchase history, loyalty/points, credit/debt, notifications, reports, or anything not explicitly asked.

S6. Verification (section 7): create/list/edit/deactivate a customer, associate a customer to a sale, register a sale without a customer, existing sales keep working, both repos compile.

## Design (mirrors Categories, not Inventory/Sales — no transaction/concurrency needed)

- Module name in Spanish: "Clientes". Bare-verb Action codes ("View"/"Create"/"Edit"), same lesson as Inventory/Ventas — **no bootstrap SQL script for Module/Actions**, user creates them via the admin UI (same as Sales).
- Entity mirrors `CategoryEntity`/`ProductEntity` shape exactly: private setters, `Create()`/`Update()`/`Activate()`/`Deactivate()`, no NameExistsAsync uniqueness check (Product doesn't have one either, customers can share names).
- Sale integration: `SaleEntity.CustomerId` nullable int, added via a NEW idempotent ALTER script (not editing the already-committed `13_Sales_Schema.sql`) — `ALTER TABLE Sales ADD CustomerId INT NULL` + FK to Customers, guarded by `IF NOT EXISTS (SELECT 1 FROM sys.columns ...)`. Must run after the Customers table script. `RegisterSaleCommand`/`SaleDetailDto` get an optional CustomerId/CustomerName field; `SaleListDto` unchanged (customer only shown in detail, per S4).
- No high-risk item fires (nullable additive column, no concurrency) — no independent verifier needed, just build + the backend writer's own focused tests if a RED/GREEN opportunity exists (simple CRUD, same bar as Categories — no test precedent there either, so none required unless trivial).

## Tasks

- T1 [S1,S2,S4] Backend: CustomerEntity + config + repo + commands/queries/validators/controller/DI, SQL scripts (Customers schema + Sales CustomerId alter), Sale entity/DTO/command CustomerId addition — route: delegated writer (backend unit)
- T2 [S3,S4] Frontend: Customers listing+CRUD modal (mirrors Categories), customer selector in Sales' register-sale form, customer shown in sale-detail — route: delegated writer (frontend unit, depends on T1)
- T3 [S6] Verification: build both repos, live check if requested

## Log

L1 (user, verbatim, 2026-10-31): Full "Crear módulo Customers (Clientes)" request, plus "porfavor hacerlo sin sobreingenieria". Sections 1-7 map to S1-S6 above.

L2 (standing instruction, saved to memory 2026-10-31): user has repeatedly and explicitly asked for no extra verification/review steps beyond what each prompt asks — do not add an independent verifier or extra ceremony here.
