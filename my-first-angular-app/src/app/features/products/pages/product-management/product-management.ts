import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CellClickedEvent, ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import { Product } from '@core/interfaces/product.interface';
import { Category } from '@core/interfaces/category.interface';
import { ProductService } from '@core/services/product.service';
import { CategoryService } from '@core/services/category.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal, ModalTab } from '@shared/components/modal/modal';
import { CloudinaryUploadComponent } from '@shared/components/cloudinary-upload/cloudinary-upload.component';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

type ModalMode = 'create' | 'edit';

const STATUS_ICON = {
  active:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.2 3.2L15 7"/></svg>',
  inactive:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5.5" y1="10" x2="14.5" y2="10"/></svg>',
};

const MODAL_TABS: ModalTab[] = [
  { id: 'info', label: 'Informacion' },
  { id: 'photos', label: 'Fotos' },
];

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    Modal,
    ReactiveFormsModule,
    AppGridComponent,
    AppPageLayoutComponent,
    CloudinaryUploadComponent,
  ],
  templateUrl: './product-management.html',
  styleUrl: './product-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductManagement {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly modalTabs = MODAL_TABS;

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly activeModalTab = signal<string>('info');
  readonly mode = signal<ModalMode>('create');
  readonly selectedProduct = signal<Product | null>(null);
  readonly activeToggle = signal(true);
  readonly selectedImageFile = signal<File | null>(null);
  readonly saving = signal(false);

  readonly productForm = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
    price: [0, [Validators.required, Validators.min(0.01)]],
    categoryId: [null as number | null, Validators.required],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo producto' : this.selectedProduct()?.name || 'Editar producto',
  );

  private readonly categoryNameById = computed(() => {
    const map = new Map<number, string>();
    for (const category of this.categories()) {
      map.set(category.id, category.name);
    }
    return map;
  });

  readonly columnDefs: ColDef<Product>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    {
      headerName: 'Categoria',
      minWidth: 160,
      flex: 1,
      valueGetter: ({ data }) =>
        data ? (this.categoryNameById().get(data.categoryId) ?? '-') : '-',
    },
    {
      headerName: 'Precio',
      field: 'price',
      minWidth: 120,
      flex: 0.8,
      valueFormatter: ({ value }) => (value == null ? '-' : this.formatPrice(value)),
    },
    {
      headerName: 'Estado',
      field: 'isActive',
      minWidth: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<Product, boolean>) =>
        value
          ? `<span class="status-glyph status-glyph-active" title="Activo" aria-label="Activo">${STATUS_ICON.active}</span>`
          : `<span class="status-glyph status-glyph-inactive" title="Inactivo" aria-label="Inactivo">${STATUS_ICON.inactive}</span>`,
    },
  ];

  readonly defaultColDef: ColDef<Product> = {
    comparator: (valueA, valueB, nodeA, nodeB, isDescending) => {
      const a = nodeA?.data;
      const b = nodeB?.data;

      if (a && b && a.isActive !== b.isActive) {
        const activeFirst = a.isActive ? -1 : 1;
        return isDescending ? -activeFirst : activeFirst;
      }

      if (valueA === valueB) {
        return 0;
      }

      return valueA > valueB ? 1 : -1;
    },
  };

  readonly gridOptions: GridOptions<Product> = {};

  readonly visibleProducts = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const showInactive = this.showInactive();

    let list = this.products();

    if (!showInactive) {
      list = list.filter((product) => product.isActive);
    }

    if (term) {
      list = list.filter((product) => this.toSearchableProductText(product).includes(term));
    }

    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

  readonly hasRows = computed(() => this.visibleProducts().length > 0);

  constructor() {
    this.loadProducts();
    this.loadCategories();
  }

  async loadProducts(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando productos...');
      const products = await this.productService.listProducts();
      this.products.set(products);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de productos');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.categoryService.listCategories();
      this.categories.set(categories);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de categorias');
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onShowInactiveChange(checked: boolean): void {
    this.showInactive.set(checked);
  }

  onCellClicked(event: CellClickedEvent<Product>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedProduct.set(null);
    this.activeToggle.set(true);
    this.selectedImageFile.set(null);
    this.activeModalTab.set('info');
    this.productForm.reset({ name: '', description: '', price: 0, categoryId: null });
    this.modalOpen.set(true);
  }

  openEdit(product: Product): void {
    this.mode.set('edit');
    this.selectedProduct.set(product);
    this.activeToggle.set(product.isActive);
    this.selectedImageFile.set(null);
    this.activeModalTab.set('info');
    this.productForm.reset({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      categoryId: product.categoryId,
    });
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    if (this.saving()) {
      return;
    }

    const raw = this.productForm.getRawValue();
    const form = new FormData();
    form.append('name', raw.name ?? '');
    form.append('description', raw.description ?? '');
    form.append('price', String(raw.price ?? 0));
    form.append('categoryId', String(raw.categoryId ?? 0));

    const file = this.selectedImageFile();
    if (file) {
      form.append('image', file);
    }

    try {
      this.saving.set(true);
      this.loadingService.show('Guardando producto...');

      if (this.mode() === 'create') {
        const created = await this.productService.createProduct(form);
        this.products.update((list) => [...list, created]);
        this.alertService.success('Producto creado correctamente');
      } else {
        const current = this.selectedProduct();
        if (!current) {
          return;
        }

        const updated = await this.productService.updateProduct(current.id, form);
        this.products.update((list) =>
          list.map((product) => (product.id === current.id ? updated : product)),
        );
        this.alertService.success('Producto actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar el producto');
    } finally {
      this.saving.set(false);
      this.loadingService.hide();
    }
  }

  /** Applies immediately (PATCH /status), both directions — same unified endpoint as Categories. */
  async onActiveToggleChange(checked: boolean): Promise<void> {
    const current = this.selectedProduct();

    if (!current) {
      this.activeToggle.set(checked);
      return;
    }

    try {
      this.loadingService.show(checked ? 'Activando producto...' : 'Desactivando producto...');
      const updated = await this.productService.setProductStatus(current.id, checked);
      this.products.update((list) =>
        list.map((product) => (product.id === current.id ? updated : product)),
      );
      this.selectedProduct.set(updated);
      this.activeToggle.set(updated.isActive);
      this.alertService.success(
        checked ? 'Producto activado correctamente' : 'Producto desactivado correctamente',
      );
    } catch (error) {
      this.alertService.error(error, 'No se pudo actualizar el estado del producto');
      this.activeToggle.set(current.isActive);
    } finally {
      this.loadingService.hide();
    }
  }

  private formatPrice(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(value);
  }

  private toSearchableProductText({ name, description }: Product): string {
    return this.normalizeText(`${name} ${description ?? ''}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
