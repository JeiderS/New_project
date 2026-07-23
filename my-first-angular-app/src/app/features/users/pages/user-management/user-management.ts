import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  CellClickedEvent,
  ColDef,
  GridOptions,
  ModuleRegistry,
  ValueFormatterParams,
} from 'ag-grid-community';
import { CreateUserPayload, UpdateUserPayload, User } from '@core/interfaces/user.interface';
import { HeaderComponent } from '@core/layout/header/header.component';
import { UserService } from '@core/services/user.service';
import { AlertHelper } from '@shared/utils/alert.helper';
import { Modal } from '@shared/components/modal/modal';

ModuleRegistry.registerModules([AllCommunityModule]);

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [AgGridAngular, HeaderComponent, Modal, ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagement {
  private readonly userService = inject(UserService);
  private readonly alert = inject(AlertHelper);
  private readonly formBuilder = inject(FormBuilder);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedUser = signal<User | null>(null);

  readonly userForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    address: [''],
  });

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo usuario' : 'Editar usuario',
  );

  readonly canDeactivate = computed(
    () => this.mode() === 'edit' && this.selectedUser()?.active === true,
  );

  readonly columnDefs: ColDef<User>[] = [
    {
      headerName: 'Nombre',
      minWidth: 200,
      flex: 1.3,
      valueGetter: ({ data }) => `${data?.firstName ?? ''} ${data?.lastName ?? ''}`.trim(),
    },
    { headerName: 'Email', field: 'email', minWidth: 200, flex: 1.2 },
    { headerName: 'Telefono', field: 'phone', minWidth: 140, flex: 0.9 },
    {
      headerName: 'Estado',
      field: 'active',
      minWidth: 110,
      flex: 0.7,
      valueFormatter: this.formatActive,
      cellClass: ({ value }) => `user-status status-${value ? 'activo' : 'inactivo'}`,
    },
  ];

  readonly defaultColDef: ColDef<User> = {
    sortable: true,
    filter: false,
    suppressHeaderMenuButton: true,
    resizable: true,
  };

  readonly gridOptions: GridOptions<User> = {
    domLayout: 'normal',
    rowHeight: 44,
    headerHeight: 44,
  };

  readonly filteredUsers = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const users = this.users();

    if (!term) {
      return users;
    }

    return users.filter((user) => this.toSearchableUserText(user).includes(term));
  });

  readonly hasRows = computed(() => this.filteredUsers().length > 0);

  constructor() {
    this.loadUsers();
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

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onCellClicked(event: CellClickedEvent<User>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedUser.set(null);
    this.userForm.reset();
    this.userForm.controls.email.enable();
    this.userForm.controls.password.enable();
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.modalOpen.set(true);
  }

  openEdit(user: User): void {
    this.mode.set('edit');
    this.selectedUser.set(user);
    this.userForm.reset({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      address: user.address ?? '',
    });
    this.userForm.controls.email.disable();
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
          address: raw.address || undefined,
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
          firstName: raw.firstName ?? '',
          lastName: raw.lastName ?? '',
          phone: raw.phone || undefined,
          address: raw.address || undefined,
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
      this.alert.showSuccess('Usuario desactivado correctamente');
      this.modalOpen.set(false);
    } catch (error) {
      this.alert.showError(error, 'No se pudo desactivar el usuario');
    } finally {
      this.saving.set(false);
    }
  }

  private formatActive({ value }: ValueFormatterParams<User, boolean>): string {
    return value ? 'Activo' : 'Inactivo';
  }

  private toSearchableUserText({ firstName, lastName, email }: User): string {
    return this.normalizeText(`${firstName} ${lastName} ${email}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
