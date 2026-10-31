import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CellClickedEvent, ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { InventoryOverview } from '@core/interfaces/inventory.interface';
import { InventoryService } from '@core/services/inventory.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

type MovementMode = 'in' | 'out';

const ROW_ACTIONS_CELL_RENDERER = (params: ICellRendererParams<InventoryOverview>) => {
  const outOfStock = (params.data?.quantity ?? 0) <= 0;
  return `
    <div class="row-actions">
      <button type="button" class="row-action-btn" data-action="in">Entrada</button>
      <button type="button" class="row-action-btn" data-action="out" ${outOfStock ? 'disabled title="Sin existencias disponibles"' : ''}>Salida</button>
      <button type="button" class="row-action-btn" data-action="history">Movimientos</button>
    </div>
  `;
};

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [Modal, ReactiveFormsModule, AppGridComponent, AppPageLayoutComponent],
  templateUrl: './inventory-management.html',
  styleUrl: './inventory-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryManagement {
  private readonly inventoryService = inject(InventoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly inventories = signal<InventoryOverview[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<MovementMode>('in');
  readonly selectedInventory = signal<InventoryOverview | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly movementForm = this.formBuilder.group({
    quantity: [null as number | null, [Validators.required, Validators.min(0.001)]],
    description: [''],
  });

  readonly modalTitle = computed(() =>
    this.mode() === 'in' ? 'Registrar entrada' : 'Registrar salida',
  );

  readonly saveButtonLabel = computed(() =>
    this.mode() === 'in' ? 'Guardar entrada' : 'Guardar salida',
  );

  readonly columnDefs: ColDef<InventoryOverview>[] = [
    { headerName: 'Producto', field: 'productName', minWidth: 200, flex: 1.3 },
    { headerName: 'Categoria', field: 'categoryName', minWidth: 160, flex: 1 },
    {
      headerName: 'Cantidad',
      field: 'quantity',
      minWidth: 140,
      flex: 0.6,
      cellRenderer: ({ value }: ICellRendererParams<InventoryOverview, number>) =>
        (value ?? 0) <= 0
          ? `<span class="qty-badge qty-badge--zero">0 &middot; Sin stock</span>`
          : `<span class="qty-badge">${value}</span>`,
    },
    {
      headerName: 'Acciones',
      colId: 'actions',
      minWidth: 240,
      flex: 1,
      sortable: false,
      filter: false,
      cellRenderer: ROW_ACTIONS_CELL_RENDERER,
    },
  ];

  readonly defaultColDef: ColDef<InventoryOverview> = {};

  readonly gridOptions: GridOptions<InventoryOverview> = {};

  readonly visibleInventories = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    let list = this.inventories();

    if (term) {
      list = list.filter((item) => this.toSearchableText(item).includes(term));
    }

    return [...list].sort((a, b) => a.productName.localeCompare(b.productName));
  });

  readonly hasRows = computed(() => this.visibleInventories().length > 0);

  constructor() {
    this.loadInventory();
  }

  async loadInventory(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando existencias...');
      const inventories = await this.inventoryService.listInventory();
      this.inventories.set(inventories);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de existencias');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onCellClicked(event: CellClickedEvent<InventoryOverview>): void {
    if (event.column.getColId() !== 'actions' || !event.data) {
      return;
    }

    const target = event.event?.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>('[data-action]')?.dataset['action'];

    if (action === 'in') {
      this.openMovement(event.data, 'in');
    } else if (action === 'out') {
      this.openMovement(event.data, 'out');
    } else if (action === 'history') {
      this.goToHistory(event.data);
    }
  }

  openMovement(inventory: InventoryOverview, mode: MovementMode): void {
    this.mode.set(mode);
    this.selectedInventory.set(inventory);
    this.movementForm.reset({ quantity: null, description: '' });
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  goToHistory(inventory: InventoryOverview): void {
    this.router.navigate(['/inventory/history'], {
      queryParams: { productId: inventory.productId, productName: inventory.productName },
    });
  }

  async save(): Promise<void> {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const current = this.selectedInventory();
    if (!current || this.saving()) {
      return;
    }

    const raw = this.movementForm.getRawValue();
    const quantity = raw.quantity ?? 0;
    const description = raw.description || undefined;
    const isIn = this.mode() === 'in';

    this.saveError.set(null);

    try {
      this.saving.set(true);
      this.loadingService.show(isIn ? 'Registrando entrada...' : 'Registrando salida...');

      const updated = isIn
        ? await this.inventoryService.registerIn(current.inventoryId, quantity, description)
        : await this.inventoryService.registerOut(current.inventoryId, quantity, description);

      this.inventories.update((list) =>
        list.map((item) => (item.inventoryId === current.inventoryId ? updated : item)),
      );
      this.alertService.success(
        isIn ? 'Entrada registrada correctamente' : 'Salida registrada correctamente',
      );
      this.modalOpen.set(false);
    } catch (error) {
      // El mensaje se muestra dentro del modal (no como alerta global) para que
      // el usuario pueda corregir la cantidad sin perder el formulario.
      this.saveError.set(
        this.extractErrorMessage(
          error,
          isIn ? 'No se pudo registrar la entrada' : 'No se pudo registrar la salida',
        ),
      );
    } finally {
      this.saving.set(false);
      this.loadingService.hide();
    }
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: string } | null)?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    return fallback;
  }

  private toSearchableText({ productName, categoryName }: InventoryOverview): string {
    return this.normalizeText(`${productName} ${categoryName}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
