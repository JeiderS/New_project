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
import { CreateUserPayload, UpdateUserPayload, User } from '@core/interfaces/user.interface';
import { Role } from '@core/interfaces/role.interface';
import { UserService } from '@core/services/user.service';
import { RoleService } from '@core/services/role.service';
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
  selector: 'app-user-management',
  standalone: true,
  imports: [AgGridAngular, Modal, ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly alert = inject(AlertHelper);
  private readonly formBuilder = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedUser = signal<User | null>(null);
  readonly activeToggle = signal(true);

  readonly userForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    roleId: this.formBuilder.control<number | null>(null),
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() => {
    if (this.mode() === 'create') {
      return 'Nuevo usuario';
    }

    const user = this.selectedUser();
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
    return fullName || 'Editar usuario';
  });

  readonly columnDefs: ColDef<User>[] = [
    {
      headerName: 'Nombre',
      minWidth: 200,
      flex: 1.3,
      valueGetter: ({ data }) => `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim(),
    },
    { headerName: 'Email', field: 'email', minWidth: 200, flex: 1.2 },
    { headerName: 'Telefono', field: 'phone', minWidth: 130, flex: 0.8 },
    {
      headerName: 'Rol',
      field: 'roleName',
      minWidth: 140,
      flex: 0.9,
      cellRenderer: ({ value }: ICellRendererParams<User, string>) =>
        value ? `<span class="role-chip">${value}</span>` : '',
    },
    {
      headerName: 'Estado',
      field: 'active',
      minWidth: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<User, boolean>) =>
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
  readonly defaultColDef: ColDef<User> = {
    sortable: true,
    filter: true,
    resizable: true,
    comparator: (valueA, valueB, nodeA, nodeB, isDescending) => {
      const a = nodeA?.data;
      const b = nodeB?.data;

      if (a && b && a.active !== b.active) {
        const activeFirst = a.active ? -1 : 1;
        return isDescending ? -activeFirst : activeFirst;
      }

      if (valueA === valueB) {
        return 0;
      }

      return valueA > valueB ? 1 : -1;
    },
  };

  readonly gridOptions: GridOptions<User> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
  };

  readonly visibleUsers = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const showInactive = this.showInactive();

    let list = this.users();

    if (!showInactive) {
      list = list.filter((user) => user.active);
    }

    if (term) {
      list = list.filter((user) => this.toSearchableUserText(user).includes(term));
    }

    return [...list].sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
  });

  readonly hasRows = computed(() => this.visibleUsers().length > 0);

  constructor() {
    this.loadUsers();
    this.loadRoles();
  }

  async loadUsers(): Promise<void> {
    try {
      this.loading.set(true);
      const users = await this.userService.listUsers();
      this.users.set(users);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el listado de usuarios');
    } finally {
      this.loading.set(false);
    }
  }

  async loadRoles(): Promise<void> {
    try {
      const roles = await this.roleService.listRoles();
      this.roles.set(roles);
    } catch (error) {
      this.alert.showError(error, 'No se pudo cargar el listado de roles');
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onShowInactiveChange(checked: boolean): void {
    this.showInactive.set(checked);
  }

  onCellClicked(event: CellClickedEvent<User>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedUser.set(null);
    this.activeToggle.set(true);
    this.userForm.reset({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      roleId: null,
    });
    this.userForm.controls.password.enable();
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEdit(user: User): void {
    this.mode.set('edit');
    this.selectedUser.set(user);
    this.activeToggle.set(user.active);
    this.userForm.reset({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      roleId: user.roleId ?? null,
    });
    this.userForm.controls.password.disable();
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const raw = this.userForm.getRawValue();

    try {
      this.saving.set(true);

      if (this.mode() === 'create') {
        const payload: CreateUserPayload = {
          email: raw.email ?? '',
          password: raw.password ?? '',
          firstName: raw.firstName ?? '',
          lastName: raw.lastName ?? '',
          phone: raw.phone || undefined,
          roleId: raw.roleId ?? undefined,
        };
        const created = await this.userService.createUser(payload);
        this.users.update((list) => [...list, created]);
        this.alert.showSuccess('Usuario creado correctamente');
      } else {
        const current = this.selectedUser();
        if (!current) {
          return;
        }

        const payload: UpdateUserPayload = {
          email: raw.email ?? '',
          firstName: raw.firstName ?? '',
          lastName: raw.lastName ?? '',
          phone: raw.phone || undefined,
          roleId: raw.roleId ?? undefined,
        };
        const updated = await this.userService.updateUser(current.id, payload);
        this.users.update((list) =>
          list.map((user) => (user.id === current.id ? updated : user)),
        );
        this.alert.showSuccess('Usuario actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alert.showError(error, 'No se pudo guardar el usuario');
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
      this.activeToggle.set(this.selectedUser()?.active ?? checked);
    }
  }

  async deactivate(): Promise<void> {
    const current = this.selectedUser();

    if (!current) {
      return;
    }

    try {
      this.saving.set(true);
      await this.userService.deactivateUser(current.id);
      this.users.update((list) =>
        list.map((user) => (user.id === current.id ? { ...user, active: false } : user)),
      );
      this.selectedUser.update((user) => (user ? { ...user, active: false } : user));
      this.alert.showSuccess('Usuario desactivado correctamente');
    } catch (error) {
      this.alert.showError(error, 'No se pudo desactivar el usuario');
    } finally {
      this.saving.set(false);
    }
  }

  private toSearchableUserText({ firstName, lastName, email }: User): string {
    return this.normalizeText(`${firstName} ${lastName} ${email}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
