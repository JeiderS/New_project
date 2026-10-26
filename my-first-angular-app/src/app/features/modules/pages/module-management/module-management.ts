import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CellClickedEvent, ColDef, GridOptions, ICellRendererParams } from 'ag-grid-community';
import {
  AppModule,
  CreateModulePayload,
  UpdateModulePayload,
} from '@core/interfaces/module.interface';
import { Action } from '@core/interfaces/action.interface';
import { ModulesService } from '@core/services/modules.service';
import { ActionService } from '@core/services/action.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';

type ModalMode = 'create' | 'edit';

/** A row in the actions draft grid. `id` is undefined for an action that
 *  only exists in the draft (freshly loaded default or freshly typed) and
 *  has not been created in the backend catalog yet. */
interface DraftActionRow {
  id?: number;
  code: string;
  name: string;
}

/** The four standard actions every module can load with one click. Codes are
 *  bare, module-agnostic verbs ("View"/"Create"/"Edit"/"Delete") — Actions
 *  are a normalized, reusable catalog (the same "View" row gets attached to
 *  any module via ModuleActions). The composite claim real endpoints check
 *  (e.g. "AccionesView") is built server-side at authorization time
 *  (`RoleRepository.GetActionCodesAsync`: Module.Name + Action.Code), never
 *  stored here or in Actions.Code. */
const DEFAULT_ACTIONS: { verb: 'View' | 'Create' | 'Edit' | 'Delete'; label: string }[] = [
  { verb: 'View', label: 'Ver' },
  { verb: 'Create', label: 'Crear' },
  { verb: 'Edit', label: 'Editar' },
  { verb: 'Delete', label: 'Eliminar' },
];

const STATUS_ICON = {
  active:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 10.5l3.2 3.2L15 7"/></svg>',
  inactive:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5.5" y1="10" x2="14.5" y2="10"/></svg>',
};

const TRASH_ICON =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>';

@Component({
  selector: 'app-module-management',
  standalone: true,
  imports: [AppGridComponent, AppPageLayoutComponent, Modal, ReactiveFormsModule],
  templateUrl: './module-management.html',
  styleUrl: './module-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleManagement {
  private readonly modulesService = inject(ModulesService);
  private readonly actionService = inject(ActionService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly modules = signal<AppModule[]>([]);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedModule = signal<AppModule | null>(null);
  readonly activeToggle = signal(true);

  /** Full global action catalog, loaded once — actions have no moduleId of
   *  their own, so this is the only way to resolve names/ids. */
  readonly actionCatalog = signal<Action[]>([]);

  /** Everything below is the actions draft. Loading defaults, adding and
   *  removing rows mutate only `draftRows`; nothing reaches the backend
   *  until "Guardar cambios". `savedRows` is the baseline captured on open,
   *  used both to compute the pending-changes count and to revert on
   *  Cancel. */
  readonly savedRows = signal<DraftActionRow[]>([]);
  readonly draftRows = signal<DraftActionRow[]>([]);
  readonly selectedActionRows = signal<DraftActionRow[]>([]);
  readonly newActionName = signal('');
  readonly duplicateWarning = signal(false);
  readonly saving = signal(false);
  readonly justSaved = signal(false);

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

  readonly actionCount = computed(() => this.draftRows().length);

  readonly selectedActionCount = computed(() => this.selectedActionRows().length);

  readonly allDefaultsLoaded = computed(() => {
    const codes = new Set(this.draftRows().map((row) => row.code));
    return DEFAULT_ACTIONS.every((def) => codes.has(def.verb));
  });

  readonly canAddAction = computed(() => this.newActionName().trim().length > 0);

  readonly pendingActionChanges = computed(() => {
    const saved = this.savedRows();
    const draft = this.draftRows();
    const added = draft.filter((d) => !saved.some((s) => s.code === d.code)).length;
    const removed = saved.filter((s) => !draft.some((d) => d.code === s.code)).length;
    return added + removed;
  });

  readonly actionsFooterStatusText = computed(() => {
    const pending = this.pendingActionChanges();
    if (pending > 0) {
      return pending === 1 ? '1 cambio sin guardar' : `${pending} cambios sin guardar`;
    }
    return this.justSaved() ? 'Cambios guardados' : 'Sin cambios';
  });

  readonly actionsFooterStatusState = computed<'pending' | 'saved' | 'idle'>(() => {
    if (this.pendingActionChanges() > 0) {
      return 'pending';
    }
    return this.justSaved() ? 'saved' : 'idle';
  });

  readonly columnDefs: ColDef<AppModule>[] = [
    { headerName: 'Nombre', field: 'name', width: 200, flex: 1.3 },
    { headerName: 'Ruta', field: 'route', width: 160, flex: 1 },
    { headerName: 'Icono', field: 'icon', width: 140, flex: 0.9 },
    { headerName: 'Orden', field: 'sortOrder', width: 90, flex: 0.5 },
    {
      headerName: 'Estado',
      field: 'isActive',
      width: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<AppModule, boolean>) =>
        value
          ? `<span class="status-glyph status-glyph-active" title="Activo" aria-label="Activo">${STATUS_ICON.active}</span>`
          : `<span class="status-glyph status-glyph-inactive" title="Inactivo" aria-label="Inactivo">${STATUS_ICON.inactive}</span>`,
    },
  ];

  readonly defaultColDef: ColDef<AppModule> = {
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
  };

  /** Actions draft grid: checkbox column comes free from `[rowSelection]`
   *  on `<app-grid>`. Only "Accion" (name + "Nueva" tag) and "Quitar" are
   *  declared here. */
  readonly actionColumnDefs: ColDef<DraftActionRow>[] = [
    {
      headerName: 'Accion',
      field: 'name',
      flex: 1,
      cellRenderer: ({ data }: ICellRendererParams<DraftActionRow, string>) =>
        !data
          ? ''
          : `<span class="module-actions-cell-name"><span class="module-actions-cell-name__text">${data.name}</span>${
              data.id == null ? '<span class="module-actions-tag-new">Nueva</span>' : ''
            }</span>`,
    },
    {
      headerName: 'Quitar',
      colId: 'remove',
      width: 100,
      headerClass: 'module-actions-header-center',
      cellClass: 'module-actions-cell-center',
      cellRenderer: () =>
        `<button type="button" class="module-actions-remove-btn" title="Quitar" aria-label="Quitar accion">${TRASH_ICON}</button>`,
    },
  ];

  readonly actionGridOptions: GridOptions<DraftActionRow> = {
    getRowId: (params) => params.data.code,
    suppressCellFocus: true,
    animateRows: false,
    rowClassRules: {
      'module-actions-row-new': (params) => !!params.data && params.data.id == null,
    },
    onSelectionChanged: (event) => this.selectedActionRows.set(event.api.getSelectedRows()),
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

  constructor() {
    this.loadModules();
    this.loadActionCatalog();
  }

  async loadModules(): Promise<void> {
    try {
      this.loadingService.show('Cargando modulos...');
      const modules = await this.modulesService.listModules();
      this.modules.set(modules);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de modulos');
    } finally {
      this.loadingService.hide();
    }
  }

  async loadActionCatalog(): Promise<void> {
    try {
      const actions = await this.actionService.listActions();
      this.actionCatalog.set(actions);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el catalogo de acciones');
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

  onActionCellClicked(event: CellClickedEvent<DraftActionRow>): void {
    if (event.colDef.colId === 'remove' && event.data) {
      this.removeAction(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedModule.set(null);
    this.activeToggle.set(true);
    this.moduleForm.reset({ name: '', icon: '', route: '', parentId: null, sortOrder: 0 });
    this.resetActionsDraft([]);
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

    const catalog = this.actionCatalog();
    const rows: DraftActionRow[] = (module.actionIds ?? [])
      .map((id) => catalog.find((action) => action.id === id))
      .filter((action): action is Action => !!action)
      .map((action) => ({ id: action.id, code: action.code, name: action.name }));

    this.resetActionsDraft(rows);
    this.modalOpen.set(true);
  }

  private resetActionsDraft(rows: DraftActionRow[]): void {
    this.savedRows.set(rows);
    this.draftRows.set(rows);
    this.selectedActionRows.set([]);
    this.newActionName.set('');
    this.duplicateWarning.set(false);
    this.justSaved.set(false);
  }

  /** Merges Ver/Crear/Editar/Eliminar into the draft without duplicating
   *  what's already there. A default already present in the global catalog
   *  (by code) is added by its real id directly; only a genuinely missing
   *  verb becomes a pending (id-less) row that gets created on Save. */
  loadDefaults(): void {
    const catalog = this.actionCatalog();

    this.draftRows.update((rows) => {
      const next = rows.slice();

      for (const def of DEFAULT_ACTIONS) {
        if (next.some((row) => row.code === def.verb)) {
          continue;
        }

        const existing = catalog.find((action) => action.code === def.verb);
        next.push(
          existing
            ? { id: existing.id, code: existing.code, name: existing.name }
            : { code: def.verb, name: def.label },
        );
      }

      return next;
    });
  }

  onNewActionNameInput(value: string): void {
    this.newActionName.set(value);
    if (this.duplicateWarning()) {
      this.duplicateWarning.set(false);
    }
  }

  addAction(): void {
    if (!this.canAddAction()) {
      return;
    }

    const name = this.newActionName().trim().replace(/\s+/g, ' ');

    if (this.draftRows().some((row) => this.sameAction(row.name, name))) {
      this.duplicateWarning.set(true);
      return;
    }

    this.draftRows.update((rows) => [...rows, { code: this.slugify(name), name }]);
    this.newActionName.set('');
    this.duplicateWarning.set(false);
  }

  removeAction(row: DraftActionRow): void {
    this.draftRows.update((rows) => rows.filter((r) => r.code !== row.code));
    this.selectedActionRows.update((rows) => rows.filter((r) => r.code !== row.code));
  }

  removeSelectedActions(): void {
    const codes = new Set(this.selectedActionRows().map((row) => row.code));
    this.draftRows.update((rows) => rows.filter((row) => !codes.has(row.code)));
    this.selectedActionRows.set([]);
  }

  async onCancelEdit(): Promise<void> {
    if (this.pendingActionChanges() > 0) {
      const confirmed = await this.alertService.confirm(
        'Tienes cambios sin guardar. Deseas descartarlos?',
      );
      if (!confirmed) {
        return;
      }
    }

    this.draftRows.set(this.savedRows());
    this.selectedActionRows.set([]);
    this.duplicateWarning.set(false);
    this.newActionName.set('');
    this.modalOpen.set(false);
  }

  async save(): Promise<void> {
    if (this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }

    if (this.saving()) {
      return;
    }

    const raw = this.moduleForm.getRawValue();

    this.saving.set(true);

    try {
      this.loadingService.show('Guardando modulo...');

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
        this.alertService.success('Modulo creado correctamente');
        this.modalOpen.set(false);
        return;
      }

      const current = this.selectedModule();
      if (!current) {
        return;
      }

      const draft = this.draftRows();
      const payload: UpdateModulePayload = {
        name: raw.name ?? '',
        icon: raw.icon || undefined,
        route: raw.route || undefined,
        parentId: raw.parentId ?? undefined,
        sortOrder: raw.sortOrder ?? 0,
        actionIds: draft.filter((row) => row.id != null).map((row) => row.id!),
        newActions: draft
          .filter((row) => row.id == null)
          .map((row) => ({ code: row.code, name: row.name })),
      };

      const updatedModule = await this.modulesService.updateModule(current.id, payload);
      const resolvedRows = await this.reconcileActionRows(updatedModule.actionIds);

      this.modules.update((list) =>
        list.map((module) => (module.id === current.id ? updatedModule : module)),
      );
      this.selectedModule.set(updatedModule);
      this.savedRows.set(resolvedRows);
      this.draftRows.set(resolvedRows);
      this.selectedActionRows.set([]);
      this.justSaved.set(true);

      this.alertService.success('Modulo actualizado correctamente');
      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar el modulo');
    } finally {
      this.saving.set(false);
      this.loadingService.hide();
    }
  }

  /** After `updateModule` creates/syncs actions server-side in one request,
   *  resolves the final `actionIds` back into named rows. Refetches the
   *  catalog (rather than trusting the local signal) because it may now be
   *  missing the actions the backend just created. */
  private async reconcileActionRows(actionIds: number[]): Promise<DraftActionRow[]> {
    const catalog = await this.actionService.listActions();
    this.actionCatalog.set(catalog);

    return actionIds
      .map((id) => catalog.find((action) => action.id === id))
      .filter((action): action is Action => !!action)
      .map((action) => ({ id: action.id, code: action.code, name: action.name }));
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
      this.loadingService.show('Desactivando modulo...');
      const deactivated = await this.modulesService.deactivateModule(current.id);
      this.modules.update((list) =>
        list.map((module) => (module.id === current.id ? deactivated : module)),
      );
      this.selectedModule.set(deactivated);
      this.alertService.success('Modulo desactivado correctamente');
    } catch (error) {
      this.alertService.error(error, 'No se pudo desactivar el modulo');
    } finally {
      this.loadingService.hide();
    }
  }

  private toSearchableModuleText({ name, route }: AppModule): string {
    return this.normalizeText(`${name} ${route ?? ''}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }

  /** Two action names are "the same" if their slug matches, ignoring case
   *  and accents ("Ver" = "ver" = "VER"). Mirrors the reference
   *  prototype's `mismaAccion`/`codigoAccion`. */
  private sameAction(a: string, b: string): boolean {
    return this.slugify(a) === this.slugify(b);
  }

  /** Slugifies after NFD-decomposing accents into separate combining
   *  codepoints, then drops every non-ASCII codepoint (the combining marks
   *  included) so "Exportación" -> "exportacion". */
  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\x00-\x7f]/g, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
