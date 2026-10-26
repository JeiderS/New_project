import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CellClickedEvent,
  ColDef,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community';
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@core/interfaces/category.interface';
import { CategoryService } from '@core/services/category.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

type ModalMode = 'create' | 'edit';

const STATUS_ICON = {
  active:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.2 3.2L15 7"/></svg>',
  inactive:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5.5" y1="10" x2="14.5" y2="10"/></svg>',
};

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [Modal, ReactiveFormsModule, AppGridComponent, AppPageLayoutComponent],
  templateUrl: './category-management.html',
  styleUrl: './category-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManagement {
  private readonly categoryService = inject(CategoryService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedCategory = signal<Category | null>(null);
  readonly activeToggle = signal(true);

  readonly categoryForm = this.formBuilder.group({
    name: ['', Validators.required],
    description: [''],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nueva categoria' : this.selectedCategory()?.name || 'Editar categoria',
  );

  readonly columnDefs: ColDef<Category>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    { headerName: 'Descripcion', field: 'description', minWidth: 220, flex: 1.5 },
    {
      headerName: 'Estado',
      field: 'isActive',
      minWidth: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<Category, boolean>) =>
        value
          ? `<span class="status-glyph status-glyph-active" title="Activo" aria-label="Activo">${STATUS_ICON.active}</span>`
          : `<span class="status-glyph status-glyph-inactive" title="Inactivo" aria-label="Inactivo">${STATUS_ICON.inactive}</span>`,
    },
  ];

  readonly defaultColDef: ColDef<Category> = {
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

  readonly gridOptions: GridOptions<Category> = {};

  readonly visibleCategories = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const showInactive = this.showInactive();

    let list = this.categories();

    if (!showInactive) {
      list = list.filter((category) => category.isActive);
    }

    if (term) {
      list = list.filter((category) => this.toSearchableCategoryText(category).includes(term));
    }

    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

  readonly hasRows = computed(() => this.visibleCategories().length > 0);

  constructor() {
    this.loadCategories();
  }

  async loadCategories(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando categorias...');
      const categories = await this.categoryService.listCategories();
      this.categories.set(categories);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de categorias');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onShowInactiveChange(checked: boolean): void {
    this.showInactive.set(checked);
  }

  onCellClicked(event: CellClickedEvent<Category>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedCategory.set(null);
    this.activeToggle.set(true);
    this.categoryForm.reset({ name: '', description: '' });
    this.modalOpen.set(true);
  }

  openEdit(category: Category): void {
    this.mode.set('edit');
    this.selectedCategory.set(category);
    this.activeToggle.set(category.isActive);
    this.categoryForm.reset({
      name: category.name,
      description: category.description ?? '',
    });
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const raw = this.categoryForm.getRawValue();

    try {
      this.loadingService.show('Guardando categoria...');

      if (this.mode() === 'create') {
        const payload: CreateCategoryPayload = {
          name: raw.name ?? '',
          description: raw.description || undefined,
        };
        const created = await this.categoryService.createCategory(payload);
        this.categories.update((list) => [...list, created]);
        this.alertService.success('Categoria creada correctamente');
      } else {
        const current = this.selectedCategory();
        if (!current) {
          return;
        }

        const payload: UpdateCategoryPayload = {
          name: raw.name ?? '',
          description: raw.description || undefined,
        };
        const updated = await this.categoryService.updateCategory(current.id, payload);
        this.categories.update((list) =>
          list.map((category) => (category.id === current.id ? updated : category)),
        );
        this.alertService.success('Categoria actualizada correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar la categoria');
    } finally {
      this.loadingService.hide();
    }
  }

  /** Fired only on the active -> inactive transition of the in-form toggle; there is no
   *  reactivate endpoint, so flipping it back on before saving is a no-op. */
  async onActiveToggleChange(checked: boolean): Promise<void> {
    const wasActive = this.activeToggle();
    this.activeToggle.set(checked);

    if (wasActive && !checked) {
      await this.deactivate();
      this.activeToggle.set(this.selectedCategory()?.isActive ?? checked);
    }
  }

  async deactivate(): Promise<void> {
    const current = this.selectedCategory();

    if (!current) {
      return;
    }

    try {
      this.loadingService.show('Desactivando categoria...');
      const deactivated = await this.categoryService.deactivateCategory(current.id);
      this.categories.update((list) =>
        list.map((category) => (category.id === current.id ? deactivated : category)),
      );
      this.selectedCategory.set(deactivated);
      this.alertService.success('Categoria desactivada correctamente');
    } catch (error) {
      this.alertService.error(error, 'No se pudo desactivar la categoria');
    } finally {
      this.loadingService.hide();
    }
  }

  private toSearchableCategoryText({ name, description }: Category): string {
    return this.normalizeText(`${name} ${description ?? ''}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
