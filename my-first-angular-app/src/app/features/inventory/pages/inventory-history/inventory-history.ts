import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ColDef, GridOptions } from 'ag-grid-community';
import { InventoryMovement } from '@core/interfaces/inventory.interface';
import { InventoryService } from '@core/services/inventory.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

const MOVEMENT_TYPE_LABEL: Record<InventoryMovement['movementType'], string> = {
  IN: 'Entrada',
  OUT: 'Salida',
};

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [AppGridComponent, AppPageLayoutComponent],
  templateUrl: './inventory-history.html',
  styleUrl: './inventory-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryHistory {
  private readonly inventoryService = inject(InventoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  readonly movements = signal<InventoryMovement[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly columnDefs: ColDef<InventoryMovement>[] = [
    { headerName: 'Producto', field: 'productName', minWidth: 200, flex: 1.3 },
    {
      headerName: 'Tipo de movimiento',
      field: 'movementType',
      minWidth: 140,
      flex: 0.8,
      valueFormatter: ({ value }: { value: InventoryMovement['movementType'] }) =>
        value ? MOVEMENT_TYPE_LABEL[value] : '-',
    },
    { headerName: 'Cantidad', field: 'quantity', minWidth: 110, flex: 0.6 },
    {
      headerName: 'Descripcion',
      field: 'description',
      minWidth: 220,
      flex: 1.5,
      valueFormatter: ({ value }) => value || '-',
    },
    {
      headerName: 'Fecha',
      field: 'createdAt',
      minWidth: 160,
      flex: 1,
      valueFormatter: ({ value }) => (value ? this.formatDate(value) : '-'),
    },
  ];

  readonly defaultColDef: ColDef<InventoryMovement> = {};

  readonly gridOptions: GridOptions<InventoryMovement> = {};

  readonly visibleMovements = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    let list = this.movements();

    if (term) {
      list = list.filter((movement) => this.toSearchableText(movement).includes(term));
    }

    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  readonly hasRows = computed(() => this.visibleMovements().length > 0);

  constructor() {
    this.loadMovements();
  }

  async loadMovements(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando movimientos...');
      const movements = await this.inventoryService.listMovements();
      this.movements.set(movements);

      const productName = this.route.snapshot.queryParamMap.get('productName');
      if (productName) {
        this.searchTerm.set(productName);
      }
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el historial de movimientos');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );
  }

  private toSearchableText({ productName }: InventoryMovement): string {
    return this.normalizeText(productName);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
