import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  GridOptions,
  ModuleRegistry,
  ValueFormatterFunc,
  ValueFormatterParams,
} from 'ag-grid-community';
import { Product, ProductStatus } from '@core/interfaces/product.interface';
import { HeaderComponent } from '@core/layout/header/header.component';
import { ProductCatalogService } from '@core/services/product-catalog.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [AgGridAngular,  HeaderComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  private static readonly currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  private static readonly statusLabelByCode = {
    activo: 'Activo',
    'bajo-stock': 'Bajo stock',
    'sin-stock': 'Sin stock',
    inactivo: 'Inactivo',
  } satisfies Record<ProductStatus, string>;

  private readonly productCatalogService = inject(ProductCatalogService);

  readonly allProducts = signal<Product[]>(this.productCatalogService.getProducts());
  readonly searchTerm = signal('');

  private readonly formatCurrencyAr: ValueFormatterFunc<Product, number> = (params) =>
    this.toCurrencyAr(params);

  private readonly formatStatus: ValueFormatterFunc<Product, ProductStatus> = ({ value }) =>
    this.toStatusLabel(value);

  private readonly getStatusCellClass = ({ value }: { value: ProductStatus | null | undefined }) =>
    `product-status status-${value ?? 'unknown'}`;

  readonly columnDefs: ColDef<Product>[] = [
    {
      headerName: 'Nombre',
      field: 'name',
      minWidth: 220,
      flex: 1.4,
    },
    {
      headerName: 'SKU',
      field: 'sku',
      minWidth: 140,
      flex: 1,
    },
    {
      headerName: 'Categoria',
      field: 'category',
      minWidth: 140,
      flex: 1,
    },
    {
      headerName: 'Precio',
      field: 'price',
      minWidth: 130,
      flex: 0.8,
      valueFormatter: this.formatCurrencyAr,
    },
    { headerName: 'Stock', field: 'stock', minWidth: 110, flex: 0.7 },
    {
      headerName: 'Estado',
      field: 'status',
      minWidth: 130,
      flex: 0.9,
      valueFormatter: this.formatStatus,
      cellClass: this.getStatusCellClass,
    },
  ];

  readonly defaultColDef: ColDef<Product> = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
  };

  readonly gridOptions: GridOptions<Product> = {
    domLayout: 'normal',
    suppressCellFocus: true,
    // Declared explicitly here, same as any other screen that needs it —
    // row selection is opt-in per grid, never a hidden shared default.
    rowSelection: { mode: 'multiRow', checkboxes: true, headerCheckbox: true, enableClickSelection: false },
    selectionColumnDef: {
      width: 56,
      minWidth: 56,
      maxWidth: 56,
      resizable: false,
      pinned: 'left',
      lockPosition: 'left',
      suppressHeaderMenuButton: true,
      cellClass: 'sis-col-seleccion',
      headerClass: 'sis-col-seleccion',
    },
  };

  readonly filteredProducts = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const products = this.allProducts();

    if (!term) {
      return products;
    }

    return products.filter((product) => this.toSearchableProductText(product).includes(term));
  });

  readonly hasRows = computed(() => this.filteredProducts().length > 0);

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  private toCurrencyAr({ value }: ValueFormatterParams<Product, number>): string {
    if (value == null) {
      return '-';
    }

    return Products.currencyFormatter.format(value);
  }

  private toStatusLabel(value: ProductStatus | null | undefined): string {
    if (!value) {
      return '-';
    }

    return Products.statusLabelByCode[value];
  }

  private toSearchableProductText({ name, sku, category, brand }: Product): string {
    return this.normalizeText(`${name} ${sku} ${category} ${brand ?? ''}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
