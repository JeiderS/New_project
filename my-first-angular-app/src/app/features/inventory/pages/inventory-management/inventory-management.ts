import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { InventoryMovement, InventoryOverview } from '@core/interfaces/inventory.interface';
import { InventoryService } from '@core/services/inventory.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal, ModalTab } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

const LOW_STOCK_THRESHOLD = 5;

const STOCK_CELL_RENDERER = ({ value }: ICellRendererParams<InventoryOverview, number>) => {
  const quantity = value ?? 0;

  if (quantity <= 0) {
    return `<span class="stock-qty stock-qty--zero">0</span><span class="pill pill--danger">Sin stock</span>`;
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return `<span class="stock-qty stock-qty--low">${quantity}</span><span class="pill pill--warning">Stock bajo</span>`;
  }

  return `<span class="stock-qty">${quantity}</span>`;
};

const MOVEMENT_TYPE_CELL_RENDERER = ({ value }: ICellRendererParams<InventoryMovement, InventoryMovement['movementType']>) =>
  value === 'IN'
    ? `<span class="pill pill--success">Entrada</span>`
    : `<span class="pill pill--danger">Salida</span>`;

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

  readonly inventories = signal<InventoryOverview[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly activeTab = signal<string>('in');
  readonly selectedInventory = signal<InventoryOverview | null>(null);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly movementForm = this.formBuilder.group({
    quantity: [null as number | null],
    description: [''],
  });

  readonly quantity = toSignal(this.movementForm.controls.quantity.valueChanges, {
    initialValue: null,
  });

  readonly tabs = computed<ModalTab[]>(() => [
    { id: 'in', label: 'Entrada' },
    { id: 'out', label: 'Salida', disabled: this.currentStock() <= 0 },
    { id: 'history', label: 'Movimientos' },
  ]);

  readonly isOut = computed(() => this.activeTab() === 'out');

  readonly currentStock = computed(() => this.selectedInventory()?.quantity ?? 0);

  readonly remaining = computed(() =>
    this.isOut() ? this.currentStock() - (this.quantity() ?? 0) : this.currentStock() + (this.quantity() ?? 0),
  );

  readonly exceedsStock = computed(() => this.isOut() && (this.quantity() ?? 0) > this.currentStock());

  readonly canSave = computed(() => (this.quantity() ?? 0) > 0 && !this.exceedsStock() && !this.saving());

  readonly columnDefs: ColDef<InventoryOverview>[] = [
    { headerName: 'Producto', field: 'productName', minWidth: 220, flex: 1.5, cellClass: 'cell-strong' },
    { headerName: 'Categoría', field: 'categoryName', minWidth: 160, flex: 1, cellClass: 'cell-muted' },
    { headerName: 'Existencias', field: 'quantity', minWidth: 200, flex: 1, cellRenderer: STOCK_CELL_RENDERER },
    {
      colId: 'open',
      headerName: '',
      width: 28,
      maxWidth: 28,
      sortable: false,
      filter: false,
      cellClass: 'cell-chevron',
      cellRenderer: () => '›',
    },
  ];

  readonly movementColumnDefs: ColDef<InventoryMovement>[] = [
    {
      headerName: 'Fecha',
      field: 'createdAt',
      minWidth: 140,
      flex: 1,
      valueFormatter: ({ value }) => (value ? this.formatDate(value) : '—'),
    },
    { headerName: 'Tipo', field: 'movementType', minWidth: 110, flex: 0.7, cellRenderer: MOVEMENT_TYPE_CELL_RENDERER },
    {
      headerName: 'Cantidad',
      field: 'quantity',
      minWidth: 110,
      flex: 0.7,
      type: 'rightAligned',
      cellClassRules: { 'cell-in': ({ data }) => data?.movementType === 'IN', 'cell-out': ({ data }) => data?.movementType === 'OUT' },
      valueFormatter: ({ value, data }) => `${data?.movementType === 'IN' ? '+' : '−'}${value}`,
    },
    { headerName: 'Saldo', field: 'stockAfter', minWidth: 100, flex: 0.7, type: 'rightAligned', cellClass: 'cell-muted' },
    {
      headerName: 'Descripción',
      field: 'description',
      minWidth: 200,
      flex: 1.5,
      valueFormatter: ({ value }) => value || '—',
    },
  ];

  readonly defaultColDef: ColDef<InventoryOverview> = {};

  readonly gridOptions: GridOptions<InventoryOverview> = { rowClass: 'row-clickable' };

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

  openMovement(inventory: InventoryOverview): void {
    this.selectedInventory.set(inventory);
    this.activeTab.set('in');
    this.movements.set([]);
    this.resetForm();
    this.modalOpen.set(true);
    this.loadMovements(inventory.inventoryId);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
    this.resetForm();
  }

  stepQuantity(delta: number): void {
    const next = Math.max(0, (this.quantity() ?? 0) + delta);
    this.movementForm.controls.quantity.setValue(next);
  }

  async save(): Promise<void> {
    const current = this.selectedInventory();
    if (!current || !this.canSave()) {
      return;
    }

    const quantity = this.quantity() ?? 0;
    const description = this.movementForm.controls.description.value || undefined;
    const isIn = !this.isOut();

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
      this.selectedInventory.set(updated);
      this.alertService.success(
        `${isIn ? 'Entrada' : 'Salida'} registrada · quedó en ${updated.quantity}`,
      );
      this.resetForm();

      if (updated.quantity <= 0) {
        this.activeTab.set('in');
      }

      this.loadMovements(current.inventoryId);
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

  private async loadMovements(inventoryId: number): Promise<void> {
    try {
      this.movements.set(await this.inventoryService.listMovements(inventoryId));
    } catch (error) {
      this.alertService.error(error, 'No se pudieron cargar los movimientos');
    }
  }

  private resetForm(): void {
    this.movementForm.reset({ quantity: null, description: '' });
    this.saveError.set(null);
  }

  private formatDate(value: string): string {
    const date = new Date(value);
    const day = date.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
    const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
    return `${day} · ${time}`;
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
