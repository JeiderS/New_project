import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CellClickedEvent,
  ColDef,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community';
import { Action } from '@core/interfaces/action.interface';
import { AppModule } from '@core/interfaces/module.interface';
import { Role, RoleGrant } from '@core/interfaces/role.interface';
import { RoleService } from '@core/services/role.service';
import { ActionService } from '@core/services/action.service';
import { ModulesService } from '@core/services/modules.service';
import { ModuleContext } from '@core/constants/module-context';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from '@shared/components/app-page-layout/app-page-layout.component';
import { ModuleTreeItem, ModuleTreeNode } from './module-tree-node/module-tree-node';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [AppGridComponent, Modal, ReactiveFormsModule, ModuleTreeNode, AppPageLayoutComponent],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleManagement {
  private readonly roleService = inject(RoleService);
  private readonly actionService = inject(ActionService);
  private readonly modulesService = inject(ModulesService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly roles = signal<Role[]>([]);
  readonly actions = signal<Action[]>([]);
  readonly modules = signal<AppModule[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedRole = signal<Role | null>(null);

  /** Keyed "<moduleId>:<actionId>" because Actions are a global reusable
   *  catalog now — the same actionId can be granted under one module and not
   *  another, so a flat Set<actionId> can't tell those apart. */
  readonly selectedGrantKeys = signal<Set<string>>(new Set());

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

  /** Actions assigned to the selected tree module, resolved via
   *  `AppModule.actionIds` (the ModuleActions join table) against the global
   *  action catalog — actions no longer carry a moduleId of their own. */
  readonly selectedModuleActions = computed<Action[]>(() => {
    const moduleId = this.selectedTreeModuleId();
    if (moduleId === null) {
      return [];
    }

    const module = this.modules().find((m) => m.id === moduleId);
    if (!module) {
      return [];
    }

    const actionIds = new Set(module.actionIds);
    return this.actions().filter((action) => actionIds.has(action.id));
  });

  readonly columnDefs: ColDef<Role>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
    {
      headerName: 'Permisos',
      minWidth: 140,
      flex: 0.9,
      valueGetter: ({ data }) => data?.grants.length ?? 0,
      cellRenderer: ({ value }: ICellRendererParams<Role, number>) =>
        `<span class="role-chip">${value ?? 0} permisos</span>`,
    },
  ];

  readonly defaultColDef: ColDef<Role> = {};

  readonly gridOptions: GridOptions<Role> = {
    domLayout: 'normal',
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
      this.loadingService.show('Cargando roles...');
      const roles = await this.roleService.listRoles();
      this.roles.set(roles);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de roles');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  async loadActions(): Promise<void> {
    try {
      this.loadingService.show();
      const actions = await this.actionService.listActions(ModuleContext.Roles);
      this.actions.set(actions);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el catalogo de permisos');
    } finally {
      this.loadingService.hide();
    }
  }

  async loadModules(): Promise<void> {
    try {
      this.loadingService.show();
      const modules = await this.modulesService.listModules(ModuleContext.Roles);
      this.modules.set(modules);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de modulos');
    } finally {
      this.loadingService.hide();
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
    this.selectedGrantKeys.set(new Set());
    this.selectedTreeModuleId.set(null);
    this.roleForm.reset({ name: '' });
    this.modalOpen.set(true);
  }

  openEdit(role: Role): void {
    this.mode.set('edit');
    this.selectedRole.set(role);
    this.selectedGrantKeys.set(
      new Set(role.grants.map((g) => this.grantKey(g.moduleId, g.actionId))),
    );
    this.selectedTreeModuleId.set(null);
    this.roleForm.reset({ name: role.name });
    this.modalOpen.set(true);
  }

  selectTreeModule(moduleId: number): void {
    this.selectedTreeModuleId.set(moduleId);
  }

  isActionChecked(actionId: number): boolean {
    const moduleId = this.selectedTreeModuleId();
    if (moduleId === null) {
      return false;
    }
    return this.selectedGrantKeys().has(this.grantKey(moduleId, actionId));
  }

  /** Actions are a normalized, module-agnostic catalog (bare verbs like
   *  "View"/"Create"/"Edit"/"Delete" reused across every module via
   *  ModuleActions) — the display name alone is the label, no module-prefix
   *  stripping needed anymore. */
  actionLabel(action: Action): string {
    return action.name;
  }

  onActionToggle(actionId: number, checked: boolean): void {
    const moduleId = this.selectedTreeModuleId();
    if (moduleId === null) {
      return;
    }

    const key = this.grantKey(moduleId, actionId);
    this.selectedGrantKeys.update((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
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
    const grants = this.grantsFromSelection();

    try {
      this.loadingService.show('Guardando rol...');

      if (this.mode() === 'create') {
        const created = await this.roleService.createRole(name);
        const withActions = await this.roleService.assignActions(created.id, grants);
        this.roles.update((list) => [...list, withActions]);
        this.alertService.success('Rol creado correctamente');
      } else {
        const current = this.selectedRole();
        if (!current) {
          return;
        }

        await this.roleService.updateRole(current.id, name);
        const withActions = await this.roleService.assignActions(current.id, grants);
        this.roles.update((list) =>
          list.map((role) => (role.id === current.id ? withActions : role)),
        );
        this.alertService.success('Rol actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar el rol');
    } finally {
      this.loadingService.hide();
    }
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }

  private grantKey(moduleId: number, actionId: number): string {
    return `${moduleId}:${actionId}`;
  }

  private grantsFromSelection(): RoleGrant[] {
    return Array.from(this.selectedGrantKeys()).map((key) => {
      const [moduleId, actionId] = key.split(':').map(Number);
      return { moduleId, actionId };
    });
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
