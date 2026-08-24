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
import { Action } from '@core/interfaces/action.interface';
import { AppModule } from '@core/interfaces/module.interface';
import { Role } from '@core/interfaces/role.interface';
import { ActionService } from '@core/services/action.service';
import { ModulesService } from '@core/services/modules.service';
import { RoleService } from '@core/services/role.service';
import { AlertHelper } from '@shared/utils/alert.helper';
import { Modal } from '@shared/components/modal/modal';
import { ModuleTreeItem, ModuleTreeNode } from './module-tree-node/module-tree-node';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [AgGridAngular, Modal, ReactiveFormsModule, ModuleTreeNode],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleManagement {
  private readonly roleService = inject(RoleService);
  private readonly actionService = inject(ActionService);
  private readonly modulesService = inject(ModulesService);
  private readonly alert = inject(AlertHelper);
  private readonly formBuilder = inject(FormBuilder);

  readonly roles = signal<Role[]>([]);
  readonly actions = signal<Action[]>([]);
  readonly modules = signal<AppModule[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedActionIds = signal<Set<number>>(new Set());

  /** Which module's actions are shown in the permissions picker's right pane. */
  readonly selectedTreeModuleId = signal<number | null>(null);

  readonly roleForm = this.formBuilder.group({
    name: ['', Validators.required],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() => {
    if (this.mode() === 'create') {
      return 'Nuevo rol';
    }

    return this.selectedRole()?.name || 'Editar rol';
  });

  /** Module hierarchy for the permissions picker's left "Modulos" tree,
   *  grouped client-side from the flat AppModule[] by parentId. Shows every
   *  module (including inactive ones) — this is an admin screen, not the
   *  sidebar, so ModuleMenuService's visibility filtering doesn't apply. */
  readonly moduleTree = computed<ModuleTreeItem[]>(() => this.buildModuleTree(this.modules()));

  readonly selectedModuleActions = computed<Action[]>(() => {
    const moduleId = this.selectedTreeModuleId();
    if (moduleId === null) {
      return [];
    }
    return this.actions().filter((action) => action.moduleId === moduleId);
  });

  readonly columnDefs: ColDef<Role>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    {
      headerName: 'Permisos',
      minWidth: 140,
      flex: 0.9,
      valueGetter: ({ data }) => data?.actionIds.length ?? 0,
      cellRenderer: ({ value }: ICellRendererParams<Role, number>) =>
        `<span class="role-chip">${value ?? 0} permisos</span>`,
    },
  ];

  // menuTabs (generalMenuTab/filterMenuTab/columnsMenuTab) needs ag-Grid
  // Enterprise's ColumnMenuModule, which this project doesn't have (only
  // AllCommunityModule is registered) — using it throws ag-Grid error #200
  // and the menu button silently does nothing. `filter: true` alone still
  // gives the Community-edition filter icon/popup per column.
  readonly defaultColDef: ColDef<Role> = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  readonly gridOptions: GridOptions<Role> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
  };

  readonly visibleRoles = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    let list = this.roles();

    if (term) {
      list = list.filter((role) => this.normalizeText(role.name).includes(term));
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly hasRows = computed(() => this.visibleRoles().length > 0);

  constructor() {
    this.loadRoles();
    this.loadActions();
    this.loadModules();
  }

  async loadRoles(): Promise<void> {
    try {
      this.loading.set(true);
      const roles = await this.roleService.listRoles();
      this.roles.set(roles);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el listado de roles');
    } finally {
      this.loading.set(false);
    }
  }

  async loadActions(): Promise<void> {
    try {
      const actions = await this.actionService.listActions();
      this.actions.set(actions);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el catalogo de permisos');
    }
  }

  async loadModules(): Promise<void> {
    try {
      const modules = await this.modulesService.listModules();
      this.modules.set(modules);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el listado de modulos');
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onCellClicked(event: CellClickedEvent<Role>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedRole.set(null);
    this.selectedActionIds.set(new Set());
    this.selectedTreeModuleId.set(null);
    this.roleForm.reset({ name: '' });
    this.modalOpen.set(true);
  }

  openEdit(role: Role): void {
    this.mode.set('edit');
    this.selectedRole.set(role);
    this.selectedActionIds.set(new Set(role.actionIds));
    this.selectedTreeModuleId.set(null);
    this.roleForm.reset({ name: role.name });
    this.modalOpen.set(true);
  }

  selectTreeModule(moduleId: number): void {
    this.selectedTreeModuleId.set(moduleId);
  }

  isActionChecked(actionId: number): boolean {
    return this.selectedActionIds().has(actionId);
  }

  actionLabel(action: Action): string {
    if (action.moduleName && action.code.startsWith(action.moduleName)) {
      const verb = action.code.slice(action.moduleName.length);
      return verb || action.name;
    }

    return action.name;
  }

  onActionToggle(actionId: number, checked: boolean): void {
    this.selectedActionIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(actionId);
      } else {
        next.delete(actionId);
      }
      return next;
    });
  }

  async save(): Promise<void> {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const name = this.roleForm.getRawValue().name ?? '';
    const actionIds = Array.from(this.selectedActionIds());

    try {
      this.saving.set(true);

      if (this.mode() === 'create') {
        const created = await this.roleService.createRole(name);
        const withActions = await this.roleService.assignActions(created.id, actionIds);
        this.roles.update((list) => [...list, withActions]);
        this.alert.showSuccess('Rol creado correctamente');
      } else {
        const current = this.selectedRole();
        if (!current) {
          return;
        }

        await this.roleService.updateRole(current.id, name);
        const withActions = await this.roleService.assignActions(current.id, actionIds);
        this.roles.update((list) =>
          list.map((role) => (role.id === current.id ? withActions : role)),
        );
        this.alert.showSuccess('Rol actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alert.showError(error, 'No se pudo guardar el rol');
    } finally {
      this.saving.set(false);
    }
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }

  /** Groups the flat AppModule[] by parentId into a tree, mirroring the
   *  backend's ModuleMenuService.BuildVisibleLevel grouping (parentId ?? 0
   *  as the root bucket), sorted by sortOrder within each level. */
  private buildModuleTree(modules: AppModule[]): ModuleTreeItem[] {
    const byParent = new Map<number, AppModule[]>();

    for (const module of modules) {
      const parentKey = module.parentId ?? 0;
      const list = byParent.get(parentKey) ?? [];
      list.push(module);
      byParent.set(parentKey, list);
    }

    const sortBySortOrder = (list: AppModule[]) =>
      [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    const build = (parentKey: number): ModuleTreeItem[] =>
      sortBySortOrder(byParent.get(parentKey) ?? []).map((module) => ({
        module,
        children: build(module.id),
      }));

    return build(0);
  }
}
