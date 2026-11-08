import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CellClickedEvent,
  ColDef,
  GridOptions,
  ICellRendererParams,
} from 'ag-grid-community';
import {
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '@core/interfaces/customer.interface';
import { CustomerService } from '@core/services/customer.service';
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
  selector: 'app-customer-management',
  standalone: true,
  imports: [Modal, ReactiveFormsModule, AppGridComponent, AppPageLayoutComponent],
  templateUrl: './customer-management.html',
  styleUrl: './customer-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerManagement {
  private readonly customerService = inject(CustomerService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly showInactive = signal(false);

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly activeToggle = signal(true);

  readonly customerForm = this.formBuilder.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', Validators.email],
    address: [''],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() =>
    this.mode() === 'create' ? 'Nuevo cliente' : this.selectedCustomer()?.name || 'Editar cliente',
  );

  readonly columnDefs: ColDef<Customer>[] = [
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.2 },
    { headerName: 'Telefono', field: 'phone', minWidth: 140, flex: 0.8 },
    { headerName: 'Email', field: 'email', minWidth: 200, flex: 1.2 },
    { headerName: 'Direccion', field: 'address', minWidth: 200, flex: 1.2 },
    {
      headerName: 'Estado',
      field: 'isActive',
      minWidth: 90,
      flex: 0.6,
      cellStyle: { textAlign: 'center' },
      cellRenderer: ({ value }: ICellRendererParams<Customer, boolean>) =>
        value
          ? `<span class="status-glyph status-glyph-active" title="Activo" aria-label="Activo">${STATUS_ICON.active}</span>`
          : `<span class="status-glyph status-glyph-inactive" title="Inactivo" aria-label="Inactivo">${STATUS_ICON.inactive}</span>`,
    },
  ];

  readonly defaultColDef: ColDef<Customer> = {
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

  readonly gridOptions: GridOptions<Customer> = {};

  readonly visibleCustomers = computed(() => {
    const term = this.normalizeText(this.searchTerm());
    const showInactive = this.showInactive();

    let list = this.customers();

    if (!showInactive) {
      list = list.filter((customer) => customer.isActive);
    }

    if (term) {
      list = list.filter((customer) => this.toSearchableCustomerText(customer).includes(term));
    }

    return [...list].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  });

  readonly hasRows = computed(() => this.visibleCustomers().length > 0);

  constructor() {
    this.loadCustomers();
  }

  async loadCustomers(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando clientes...');
      const customers = await this.customerService.listCustomers();
      this.customers.set(customers);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de clientes');
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

  onCellClicked(event: CellClickedEvent<Customer>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedCustomer.set(null);
    this.activeToggle.set(true);
    this.customerForm.reset({ name: '', phone: '', email: '', address: '' });
    this.modalOpen.set(true);
  }

  openEdit(customer: Customer): void {
    this.mode.set('edit');
    this.selectedCustomer.set(customer);
    this.activeToggle.set(customer.isActive);
    this.customerForm.reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? '',
      address: customer.address ?? '',
    });
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const raw = this.customerForm.getRawValue();

    try {
      this.loadingService.show('Guardando cliente...');

      if (this.mode() === 'create') {
        const payload: CreateCustomerPayload = {
          name: raw.name ?? '',
          phone: raw.phone ?? '',
          email: raw.email || undefined,
          address: raw.address || undefined,
        };
        const created = await this.customerService.createCustomer(payload);
        this.customers.update((list) => [...list, created]);
        this.alertService.success('Cliente creado correctamente');
      } else {
        const current = this.selectedCustomer();
        if (!current) {
          return;
        }

        const payload: UpdateCustomerPayload = {
          name: raw.name ?? '',
          phone: raw.phone ?? '',
          email: raw.email || undefined,
          address: raw.address || undefined,
        };
        const updated = await this.customerService.updateCustomer(current.id, payload);
        this.customers.update((list) =>
          list.map((customer) => (customer.id === current.id ? updated : customer)),
        );
        this.alertService.success('Cliente actualizado correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar el cliente');
    } finally {
      this.loadingService.hide();
    }
  }

  /** Applies immediately (PATCH /status), both directions — same pattern as Categories. */
  async onActiveToggleChange(checked: boolean): Promise<void> {
    const current = this.selectedCustomer();

    if (!current) {
      this.activeToggle.set(checked);
      return;
    }

    try {
      this.loadingService.show(checked ? 'Activando cliente...' : 'Desactivando cliente...');
      const updated = await this.customerService.setCustomerStatus(current.id, checked);
      this.customers.update((list) =>
        list.map((customer) => (customer.id === current.id ? updated : customer)),
      );
      this.selectedCustomer.set(updated);
      this.activeToggle.set(updated.isActive);
      this.alertService.success(
        checked ? 'Cliente activado correctamente' : 'Cliente desactivado correctamente',
      );
    } catch (error) {
      this.alertService.error(error, 'No se pudo actualizar el estado del cliente');
      this.activeToggle.set(current.isActive);
    } finally {
      this.loadingService.hide();
    }
  }

  private toSearchableCustomerText({ name, phone }: Customer): string {
    return this.normalizeText(`${name} ${phone}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
