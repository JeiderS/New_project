import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CellClickedEvent, ColDef, GridOptions } from 'ag-grid-community';
import { SaleListItem } from '@core/interfaces/sale.interface';
import { Product } from '@core/interfaces/product.interface';
import { SaleService } from '@core/services/sale.service';
import { ProductService } from '@core/services/product.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

interface SaleLineRow {
  productId: number | null;
  quantity: number | null;
}

const ORIGIN_LABEL: Record<SaleListItem['origin'], string> = {
  MANUAL: 'Manual',
  WEB: 'Web',
};

@Component({
  selector: 'app-sale-management',
  standalone: true,
  imports: [Modal, AppGridComponent, AppPageLayoutComponent],
  templateUrl: './sale-management.html',
  styleUrl: './sale-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleManagement {
  private readonly saleService = inject(SaleService);
  private readonly productService = inject(ProductService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);

  readonly sales = signal<SaleListItem[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);

  readonly modalOpen = signal(false);
  readonly lines = signal<SaleLineRow[]>([]);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly columnDefs: ColDef<SaleListItem>[] = [
    { headerName: 'Numero de venta', field: 'number', minWidth: 160, flex: 1 },
    {
      headerName: 'Fecha',
      field: 'saleDate',
      minWidth: 160,
      flex: 1,
      valueFormatter: ({ value }) => (value ? this.formatDate(value) : '-'),
    },
    {
      headerName: 'Origen',
      field: 'origin',
      minWidth: 120,
      flex: 0.7,
      valueFormatter: ({ value }: { value: SaleListItem['origin'] }) =>
        value ? ORIGIN_LABEL[value] : '-',
    },
    {
      headerName: 'Total',
      field: 'total',
      minWidth: 140,
      flex: 0.8,
      valueFormatter: ({ value }) => (value == null ? '-' : this.formatPrice(value)),
    },
  ];

  readonly defaultColDef: ColDef<SaleListItem> = {};

  readonly gridOptions: GridOptions<SaleListItem> = {};

  readonly hasRows = computed(() => this.sales().length > 0);

  private readonly productById = computed(() => {
    const map = new Map<number, Product>();
    for (const product of this.products()) {
      map.set(product.id, product);
    }
    return map;
  });

  readonly lineViews = computed(() =>
    this.lines().map((line) => {
      const product = line.productId != null ? this.productById().get(line.productId) : undefined;
      const price = product?.price ?? 0;
      const subtotal = (line.quantity ?? 0) * price;
      return { ...line, price, subtotal };
    }),
  );

  readonly total = computed(() => this.lineViews().reduce((sum, line) => sum + line.subtotal, 0));

  readonly canSave = computed(
    () =>
      this.lines().length > 0 &&
      this.lines().every((line) => line.productId != null && (line.quantity ?? 0) > 0),
  );

  constructor() {
    this.loadSales();
    this.loadProducts();
  }

  async loadSales(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando ventas...');
      const sales = await this.saleService.listSales();
      this.sales.set(sales);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de ventas');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  async loadProducts(): Promise<void> {
    try {
      const products = await this.productService.listProducts();
      this.products.set(products);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de productos');
    }
  }

  onCellClicked(event: CellClickedEvent<SaleListItem>): void {
    if (event.data) {
      this.router.navigate(['/sales', event.data.saleId]);
    }
  }

  openCreate(): void {
    this.lines.set([{ productId: null, quantity: 1 }]);
    this.saveError.set(null);
    this.modalOpen.set(true);
  }

  addLine(): void {
    this.lines.update((list) => [...list, { productId: null, quantity: 1 }]);
  }

  updateLineProduct(index: number, rawProductId: string): void {
    const productId = rawProductId ? Number(rawProductId) : null;
    this.lines.update((list) =>
      list.map((line, i) => (i === index ? { ...line, productId } : line)),
    );
  }

  updateLineQuantity(index: number, rawQuantity: string): void {
    const quantity = rawQuantity ? Number(rawQuantity) : null;
    this.lines.update((list) =>
      list.map((line, i) => (i === index ? { ...line, quantity } : line)),
    );
  }

  async save(): Promise<void> {
    if (!this.canSave() || this.saving()) {
      return;
    }

    const lines = this.lines().map((line) => ({
      productId: line.productId as number,
      quantity: line.quantity as number,
    }));

    this.saveError.set(null);

    try {
      this.saving.set(true);
      this.loadingService.show('Registrando venta...');

      await this.saleService.registerSale(lines);

      this.alertService.success('Venta registrada correctamente');
      this.modalOpen.set(false);
      await this.loadSales();
    } catch (error) {
      // El mensaje se muestra dentro del modal (no como alerta global) para que
      // el usuario pueda corregir las lineas sin perder lo ya cargado.
      this.saveError.set(this.extractErrorMessage(error, 'No se pudo registrar la venta'));
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

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(value),
    );
  }

  private formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(value);
  }
}
