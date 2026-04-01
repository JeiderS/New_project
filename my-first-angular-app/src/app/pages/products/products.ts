import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, GridOptions, ModuleRegistry, ValueFormatterParams } from 'ag-grid-community';
import { Product } from '../../core/interfaces/product.interface';
import { ProductCatalogService } from '../../services/product-catalog.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './products.html',
  styleUrl: './products.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Products {
  private readonly productCatalogService = inject(ProductCatalogService);

  readonly allProducts = signal<Product[]>(this.productCatalogService.getProducts());
  readonly searchTerm = signal('');

  readonly columnDefs: ColDef<Product>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 220, flex: 1.4 },
    { headerName: 'SKU', field: 'sku', minWidth: 140, flex: 1 },
    { headerName: 'Categoria', field: 'category', minWidth: 140, flex: 1 },
    {
      headerName: 'Precio',
      field: 'price',
      minWidth: 130,
      flex: 0.8,
      valueFormatter: (params) => this.currencyAr(params),
    },
    { headerName: 'Stock', field: 'stock', minWidth: 110, flex: 0.7 },
    {
      headerName: 'Estado',
      field: 'status',
      minWidth: 130,
      flex: 0.9,
      valueFormatter: ({ value }) => this.mapStatus(value),
      cellClass: ({ value }) => `product-status status-${value}`,
    },
  ];

  readonly defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
  };

  readonly gridOptions: GridOptions<Product> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
    suppressCellFocus: true,
  };

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const products = this.allProducts();

    if (!term) {
      return products;
    }

    return products.filter(({ name, sku, category }) => {
      const source = `${name} ${sku} ${category}`.toLowerCase();
      return source.includes(term);
    });
  });

  readonly hasRows = computed(() => this.filteredProducts().length > 0);

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  private currencyAr({ value }: ValueFormatterParams<Product, number>): string {
    if (value == null) {
      return '-';
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private mapStatus(value: Product['status'] | null | undefined): string {
    switch (value) {
      case 'activo':
        return 'Activo';
      case 'bajo-stock':
        return 'Bajo stock';
      case 'sin-stock':
        return 'Sin stock';
      case 'inactivo':
        return 'Inactivo';
      default:
        return '-';
    }
  }
}
