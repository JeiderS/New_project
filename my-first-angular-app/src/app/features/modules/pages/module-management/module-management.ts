import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellClickedEvent,
  ColDef,
  GridOptions,
  ICellRendererParams,
  ModuleRegistry,
} from 'ag-grid-community';
import { AppModule, CreateModulePayload, UpdateModulePayload } from '@core/interfaces/module.interface';
import { ModulesService } from '@core/services/modules.service';
import { AlertHelper } from '@shared/utils/alert.helper';
import { Modal } from '@shared/components/modal/modal';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-module-management',
  standalone: true,
  imports: [AgGridAngular, Modal, ReactiveFormsModule],
  templateUrl: './module-management.html',
  styleUrl: './module-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleManagement {
  private readonly modulesService = inject(ModulesService);
  private readonly alert = inject(AlertHelper);
  private readonly formBuilder = inject(FormBuilder);

  readonly modules = signal<AppModule[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedModule = signal<AppModule | null>(null);

  readonly moduleForm = this.formBuilder.group({
    name: ['', Validators.required],
    icon: [''],
    route: [''],
    parentId: this.formBuilder.control<number | null>(null),
    sortOrder: [0, Validators.required],
  });

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo modulo' : 'Editar modulo',
  );

  readonly canDeactivate = computed(
    () => this.mode() === 'edit' && this.selectedModule()?.isActive === true,
  );

  readonly parentOptions = computed(() =>
    this.modules().filter((module) => module.id !== this.selectedModule()?.id),
  );

  readonly columnDefs: ColDef<AppModule>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    { headerName: 'Ruta', field: 'route', minWidth: 160, flex: 1 },
    { headerName: 'Icono', field: 'icon', minWidth: 140, flex: 0.9 },
    { headerName: 'Orden', field: 'sortOrder', minWidth: 90, flex: 0.5 },
    {
      headerName: 'Estado',
      field: 'isActive',
      minWidth: 100,
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams<AppModule, boolean>) =>
        params.value
          ? '<span class="status-dot status-dot-active">&#10003;</span>'
          : '<span class="status-dot status-dot-inactive">&#10005;</span>',
    },
  ];

  readonly defaultColDef: ColDef<AppModule> = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
  };

  readonly gridOptions: GridOptions<AppModule> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
  };

  readonly filteredModules = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const modules = this.modules();

    if (!term) {
      return modules;
    }

    return modules.filter((module) => this.toSearchableModuleText(module).includes(term));
  });

  readonly hasRows = computed(() => this.filteredModules().length > 0);

  constructor() {
    this.loadModules();
  }

  async loadModules(): Promise<void> {
    try {
      this.loading.set(true);
      const modules = await this.modulesService.listModules();
      this.modules.set(modules);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el listado de modulos');
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onCellClicked(event: CellClickedEvent<AppModule>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedModule.set(null);
    this.moduleForm.reset({ name: '', icon: '', route: '', parentId: null, sortOrder: 0 });
    this.modalOpen.set(true);
  }

  openEdit(module: AppModule): void {
    this.mode.set('edit');
    this.selectedModule.set(module);
    this.moduleForm.reset({
      name: module.name,
      icon: module.icon ?? '',
      route: module.route ?? '',
      parentId: module.parentId ?? null,
      sortOrder: module.sortOrder,
    });
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    const raw = this.moduleForm.getRawValue();

    try {
      this.saving.set(true);

      if (this.mode() === 'create') {
        const payload: CreateModulePayload = {
          name: raw.name ?? '',
          icon: raw.icon || undefined,
          route: raw.route || undefined,
          parentId: raw.parentId ?? undefined,
          sortOrder: raw.sortOrder ?? 0,
        };
        const created = await this.modulesService.createModule(payload);
        this.modules.update((list) => [...list, created]);
        this.alert.showSuccess('Modulo creado correctamente');
      } else {
        const current = this.selectedModule();
        if (!current) {
          return;
        }

        const payload: UpdateModulePayload = {
          name: raw.name ?? '',
          icon: raw.icon || undefined,
          route: raw.route || undefined,
          parentId: raw.parentId ?? undefined,
          sortOrder: raw.sortOrder ?? 0,
        };
        const updated = await this.modulesService.updateModule(current.id, payload);
        this.modules.update((list) =>
          list.map((module) => (module.id === current.id ? updated : module)),
        );
        this.alert.showSuccess('Modulo actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alert.showError(error, 'No se pudo guardar el modulo');
    } finally {
      this.saving.set(false);
    }
  }

  async deactivate(): Promise<void> {
    const current = this.selectedModule();

    if (!current) {
      return;
    }

    try {
      this.saving.set(true);
      const deactivated = await this.modulesService.deactivateModule(current.id);
      this.modules.update((list) =>
        list.map((module) => (module.id === current.id ? deactivated : module)),
      );
      this.alert.showSuccess('Modulo desactivado correctamente');
      this.modalOpen.set(false);
    } catch (error) {
      this.alert.showError(error, 'No se pudo desactivar el modulo');
    } finally {
      this.saving.set(false);
    }
  }

  private toSearchableModuleText({ name, route }: AppModule): string {
    return this.normalizeText(`${name} ${route ?? ''}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
