import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CellClickedEvent, ColDef, GridOptions } from 'ag-grid-community';
import { Action, CreateActionPayload, UpdateActionPayload } from '@core/interfaces/action.interface';
import { ActionService } from '@core/services/action.service';
import { LoadingService } from '@core/loading/loading.service';
import { AlertService } from '@core/alerts/alert.service';
import { Modal } from '@shared/components/modal/modal';
import { AppGridComponent } from
  '@shared/components/app-grid/app-grid.component';
import { AppPageLayoutComponent } from
  '@shared/components/app-page-layout/app-page-layout.component';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-action-management',
  standalone: true,
  imports: [Modal, ReactiveFormsModule, AppGridComponent, AppPageLayoutComponent],
  templateUrl: './action-management.html',
  styleUrl: './action-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionManagement {
  private readonly actionService = inject(ActionService);
  private readonly loadingService = inject(LoadingService);
  private readonly alertService = inject(AlertService);
  private readonly formBuilder = inject(FormBuilder);

  readonly actions = signal<Action[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');

  readonly modalOpen = signal(false);
  readonly mode = signal<ModalMode>('create');
  readonly selectedAction = signal<Action | null>(null);

  readonly actionForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.maxLength(120)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  readonly modalEyebrow = computed(() => (this.mode() === 'create' ? 'Nuevo' : 'Editar'));

  readonly modalTitle = computed(() => {
    if (this.mode() === 'create') {
      return 'Nueva accion';
    }

    return this.selectedAction()?.name || 'Editar accion';
  });

  readonly columnDefs: ColDef<Action>[] = [
    { headerName: 'Codigo', field: 'code', minWidth: 160, flex: 1 },
    { headerName: 'Nombre', field: 'name', minWidth: 200, flex: 1.3 },
  ];

  readonly defaultColDef: ColDef<Action> = {};

  readonly gridOptions: GridOptions<Action> = {};

  readonly visibleActions = computed(() => {
    const term = this.normalizeText(this.searchTerm());

    let list = this.actions();

    if (term) {
      list = list.filter((action) => this.toSearchableActionText(action).includes(term));
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly hasRows = computed(() => this.visibleActions().length > 0);

  constructor() {
    this.loadActions();
  }

  async loadActions(): Promise<void> {
    try {
      this.loading.set(true);
      this.loadingService.show('Cargando acciones...');
      const actions = await this.actionService.listActions();
      this.actions.set(actions);
    } catch (error) {
      this.alertService.error(error, 'No se pudo cargar el listado de acciones');
    } finally {
      this.loading.set(false);
      this.loadingService.hide();
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onCellClicked(event: CellClickedEvent<Action>): void {
    if (event.data) {
      this.openEdit(event.data);
    }
  }

  openCreate(): void {
    this.mode.set('create');
    this.selectedAction.set(null);
    this.actionForm.reset({ code: '', name: '' });
    this.modalOpen.set(true);
  }

  openEdit(action: Action): void {
    this.mode.set('edit');
    this.selectedAction.set(action);
    this.actionForm.reset({ code: action.code, name: action.name });
    this.modalOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.actionForm.invalid) {
      this.actionForm.markAllAsTouched();
      return;
    }

    const raw = this.actionForm.getRawValue();

    try {
      this.loadingService.show('Guardando accion...');

      if (this.mode() === 'create') {
        const payload: CreateActionPayload = {
          code: raw.code ?? '',
          name: raw.name ?? '',
        };
        const created = await this.actionService.createAction(payload.code, payload.name);
        this.actions.update((list) => [...list, created]);
        this.alertService.success('Accion creada correctamente');
      } else {
        const current = this.selectedAction();
        if (!current) {
          return;
        }

        const payload: UpdateActionPayload = {
          code: raw.code ?? '',
          name: raw.name ?? '',
        };
        const updated = await this.actionService.updateAction(current.id, payload);
        this.actions.update((list) =>
          list.map((action) => (action.id === current.id ? updated : action)),
        );
        this.alertService.success('Accion actualizada correctamente');
      }

      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo guardar la accion');
    } finally {
      this.loadingService.hide();
    }
  }

  async deleteAction(): Promise<void> {
    const current = this.selectedAction();

    if (!current) {
      return;
    }

    const confirmed = await this.alertService.confirm(
      'Eliminar esta accion? Esta accion no se puede deshacer.',
    );

    if (!confirmed) {
      return;
    }

    try {
      this.loadingService.show('Eliminando accion...');
      await this.actionService.deleteAction(current.id);
      this.actions.update((list) => list.filter((action) => action.id !== current.id));
      this.alertService.success('Accion eliminada correctamente');
      this.modalOpen.set(false);
    } catch (error) {
      this.alertService.error(error, 'No se pudo eliminar la accion');
    } finally {
      this.loadingService.hide();
    }
  }

  private toSearchableActionText({ code, name }: Action): string {
    return this.normalizeText(`${code} ${name}`);
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase();
  }
}
