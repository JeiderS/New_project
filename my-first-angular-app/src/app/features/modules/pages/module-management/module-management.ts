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
import { Action } from '@core/interfaces/action.interface';
import { ModulesService } from '@core/services/modules.service';
import { ActionService } from '@core/services/action.service';
import { AlertHelper } from '@shared/utils/alert.helper';
import { Modal } from '@shared/components/modal/modal';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'create' | 'edit';

const STATUS_ICON = {
  active:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.2 3.2L15 7"/></svg>',
  inactive:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5.5" y1="10" x2="14.5" y2="10"/></svg>',
};

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
  private readonly actionService = inject(ActionService);
  private readonly alert = inject(AlertHelper);
  private readonly formBuilder = inject(FormBuilder);

  readonly modules = signal<AppModule[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedModule = signal<AppModule | null>(null);
  readonly activeToggle = signal(true);

  readonly moduleActions = signal<Action[]>([]);
  readonly loadingActions = signal(false);
  readonly newActionName = signal('');
  readonly addingAction = signal(false);

  readonly moduleForm = this.formBuilder.group({
    name: ['', Validators.required],
    icon: [''],
    route: [''],
    parentId: this.formBuilder.control<number | null>(null),
    sortOrder: [0, Validators.required],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo modulo' : this.selectedModule()?.name || 'Editar modulo',
  );

  readonly parentOptions = computed(() =>
    this.modules().filter((module) => module.id !== this.selectedModule()?.id),
  );

  readonly showActionsSection = computed(() => this.mode() === 'edit');

  readonly canAddAction = computed(
    () => this.newActionName().trim().length > 0 && !this.addingAction(),
  );

  readonly columnDefs: ColDef<AppModule>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    { headerName: 'Ruta', field: 'route', minWidth: 160, flex: 1 },
    { headerName: 'Icono', field: 'icon', minWidth: 140, flex: 0.9 },
    { headerName: 'Orden', field: 'sortOrder', minWidth: 90, flex: 0.5 },
    {
      headerName: 'Estado',
      field: 'isActive',
      minWidth: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<AppModule, boolean>) =>
        value
          ? `<span class="status-glyph status-glyph-active" title="Activo" aria-label="Activo">${STATUS_ICON.active}</span>`
          : `<span class="status-glyph status-glyph-inactive" title="Inactivo" aria-label="Inactivo">${STATUS_ICON.inactive}</span>`,
    },
  ];

  // menuTabs (generalMenuTab/filterMenuTab/columnsMenuTab) needs ag-Grid
  // Enterprise's ColumnMenuModule, which this project doesn't have (only
  // AllCommunityModule is registered) — using it throws ag-Grid error #200
  // and the menu button silently does nothing. `filter: true` alone still
  // gives the Community-edition filter icon/popup per column.
  readonly defaultColDef: ColDef<AppModule> = {
    sortable: true,
    filter: true,
    resizable: true,
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

  readonly gridOptions: GridOptions<AppModule> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
  };

  readonly visibleModules = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const showInactive = this.showInactive();

    let list = this.modules();

    if (!showInactive) {
      list = list.filter((module) => module.isActive);
    }

    if (term) {
      list = list.filter((module) => this.toSearchableModuleText(module).includes(term));
    }

    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

  readonly hasRows = computed(() => this.visibleModules().length > 0);

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

  onShowInactiveChange(checked: boolean): void {
    this.showInactive.set(checked);
  }

  onCellClicked(event: CellClickedEvent<AppModule>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedModule.set(null);
    this.activeToggle.set(true);
    this.moduleForm.reset({ name: '', icon: '', route: '', parentId: null, sortOrder: 0 });
    this.moduleActions.set([]);
    this.newActionName.set('');
    this.modalOpen.set(true);
  }

  openEdit(module: AppModule): void {
    this.mode.set('edit');
    this.selectedModule.set(module);
    this.activeToggle.set(module.isActive);
    this.moduleForm.reset({
      name: module.name,
      icon: module.icon ?? '',
      route: module.route ?? '',
      parentId: module.parentId ?? null,
      sortOrder: module.sortOrder,
    });
    this.moduleActions.set([]);
    this.newActionName.set('');
    this.modalOpen.set(true);
    this.loadModuleActions(module.id);
  }

  async loadModuleActions(moduleId: number): Promise<void> {
    try {
      this.loadingActions.set(true);
      const actions = await this.actionService.listActions();
      this.moduleActions.set(actions.filter((action) => action.moduleId === moduleId));
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar las acciones del modulo');
    } finally {
      this.loadingActions.set(false);
    }
  }

  async addAction(): Promise<void> {
    const current = this.selectedModule();
    const name = this.newActionName().trim();

    if (!current || !name) {
      return;
    }

    try {
      this.addingAction.set(true);
      const created = await this.actionService.createAction(current.id, name);
      this.moduleActions.update((list) => [...list, created]);
      this.newActionName.set('');
      this.alert.showSuccess('Accion creada correctamente');
    } catch (error) {
      this.alert.showError(error, 'No se pudo crear la accion');
    } finally {
      this.addingAction.set(false);
    }
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

  /** Fired only on the active -> inactive transition of the in-form toggle; there is no
   *  reactivate endpoint, so flipping it back on before saving is a no-op. */
  async onActiveToggleChange(checked: boolean): Promise<void> {
    const wasActive = this.activeToggle();
    this.activeToggle.set(checked);

    if (wasActive && !checked) {
      await this.deactivate();
      this.activeToggle.set(this.selectedModule()?.isActive ?? checked);
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
      this.selectedModule.set(deactivated);
      this.alert.showSuccess('Modulo desactivado correctamente');
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
