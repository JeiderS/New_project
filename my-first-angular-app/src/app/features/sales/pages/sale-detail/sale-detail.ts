import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ColDef, GridOptions } from 'ag-grid-community';
import { SaleDetail, SaleLine } from '@core/interfaces/sale.interface';
import { SaleService } from '@core/services/sale.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

const ORIGIN_LABEL: Record<SaleDetail['origin'], string> = {
  MANUAL: 'Manual',
  WEB: 'Web',
};

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [AppGridComponent, AppPageLayoutComponent],
  templateUrl: './sale-detail.html',
  styleUrl: './sale-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailPage {
  private readonly saleService = inject(SaleService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly route = inject(ActivatedRoute);

  readonly sale = signal<SaleDetail | null>(null);
  readonly loading = signal(false);

  readonly columnDefs: ColDef<SaleLine>[] = [
    { headerName: 'Producto', field: 'productName', minWidth: 200, flex: 1.3 },
    { headerName: 'Cantidad', field: 'quantity', minWidth: 110, flex: 0.6 },
    {
      headerName: 'Precio unitario',
      field: 'unitPrice',
      minWidth: 140,
      flex: 0.8,
      valueFormatter: ({ value }) => (value == null ? '-' : this.formatPrice(value)),
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      minWidth: 140,
      flex: 0.8,
      valueFormatter: ({ value }) => (value == null ? '-' : this.formatPrice(value)),
    },
  ];

  readonly defaultColDef: ColDef<SaleLine> = {};

  readonly gridOptions: GridOptions<SaleLine> = {};

  readonly originLabel = computed(() => {
    const origin = this.sale()?.origin;
    return origin ? ORIGIN_LABEL[origin] : '-';
  });

  readonly formattedDate = computed(() => {
    const saleDate = this.sale()?.saleDate;
    return saleDate ? this.formatDate(saleDate) : '-';
  });

  readonly formattedTotal = computed(() => {
    const total = this.sale()?.total;
    return total == null ? '-' : this.formatPrice(total);
  });

  readonly hasRows = computed(() => (this.sale()?.lines.length ?? 0) > 0);

  constructor() {
    this.loadSale();
  }

  async loadSale(): Promise<void> {
    const saleId = Number(this.route.snapshot.paramMap.get('id'));

    if (!saleId) {
      return;
    }

    try {
      this.loading.set(true);
      this.loadingService.show('Cargando venta...');
      const sale = await this.saleService.getSaleDetail(saleId);
      this.sale.set(sale);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el detalle de la venta');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
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
