import { Component, inject } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { Column, IHeaderParams } from 'ag-grid-community';
import { getColumnId, resolveColumnCellValue } from '@core/ag-grid-utils/ag-grid-utils';
import { ColumnMenuCoordinatorService } from './column-menu-coordinator.service';

type MenuTab = 'general' | 'filter' | 'columns';
type PinSide = 'left' | 'right' | null;

interface FilterValueOption {
  value: unknown;
  label: string;
  checked: boolean;
}

interface GridHeaderContext {
  setFilterSelections?: Map<string, Set<unknown>>;
}

@Component({
  selector: 'app-ag-grid-column-header',
  standalone: true,
  templateUrl: './ag-grid-column-header.component.html',
  styleUrl: './ag-grid-column-header.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class AgGridColumnHeaderComponent implements IHeaderAngularComp {
  private readonly menuCoordinator = inject(ColumnMenuCoordinatorService);

  params!: IHeaderParams;

  menuVisible = false;
  menuTop = 0;
  menuLeft = 0;
  activeTab: MenuTab = 'general';
  pinSubmenuOpen = false;
  pinSubmenuTop = 0;
  pinSubmenuLeft = 0;

  columns: Column[] = [];
  columnsSearch = '';

  filterOptions: FilterValueOption[] = [];
  filterSearch = '';

  agInit(params: IHeaderParams): void {
    this.params = params;
  }

  refresh(params: IHeaderParams): boolean {
    this.params = params;
    return true;
  }

  get visibleFilterOptions(): FilterValueOption[] {
    const term = this.filterSearch.trim().toLowerCase();
    return term
      ? this.filterOptions.filter((option) => option.label.toLowerCase().includes(term))
      : this.filterOptions;
  }

  get allFilterOptionsChecked(): boolean {
    return this.filterOptions.length > 0 && this.filterOptions.every((option) => option.checked);
  }

  get visibleColumns(): Column[] {
    const term = this.columnsSearch.trim().toLowerCase();
    return term
      ? this.columns.filter((column) => this.getColumnName(column).toLowerCase().includes(term))
      : this.columns;
  }

  get allColumnsVisible(): boolean {
    return this.columns.length > 0 && this.columns.every((column) => column.isVisible());
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();

    if (this.menuVisible) {
      this.closeMenu();
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    this.menuTop = rect.bottom + 4;
    this.menuLeft = Math.max(8, rect.right - 270);
    this.activeTab = 'general';
    this.pinSubmenuOpen = false;
    this.refreshColumnsList();
    this.menuVisible = true;
    this.menuCoordinator.notifyOpen(this);
  }

  closeMenu(): void {
    this.menuVisible = false;
    this.pinSubmenuOpen = false;
    this.menuCoordinator.notifyClose(this);
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.menuVisible) {
      return;
    }

    const target = event.target as HTMLElement;

    if (!target.closest('.column-menu') && !target.closest('.menu-button')) {
      this.closeMenu();
    }
  }

  selectTab(tab: MenuTab): void {
    this.activeTab = tab;
    this.pinSubmenuOpen = false;

    if (tab === 'filter') {
      this.refreshFilterOptions();
    } else if (tab === 'columns') {
      this.refreshColumnsList();
    }
  }

  // --- General tab -----------------------------------------------------

  togglePinSubmenu(event: MouseEvent): void {
    event.stopPropagation();

    if (this.pinSubmenuOpen) {
      this.pinSubmenuOpen = false;
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pinSubmenuTop = rect.top;
    this.pinSubmenuLeft = rect.right + 4;
    this.pinSubmenuOpen = true;
  }

  setPin(side: PinSide): void {
    this.params.api.setColumnsPinned([this.params.column.getColId()], side);
    this.closeMenu();
  }

  autoSizeThisColumn(): void {
    this.params.api.autoSizeColumns([this.params.column.getColId()]);
    this.closeMenu();
  }

  autoSizeAllColumns(): void {
    this.params.api.autoSizeAllColumns();
    this.closeMenu();
  }

  resetColumns(): void {
    this.params.api.resetColumnState();
    this.closeMenu();
  }

  openToolPanel(): void {
    this.selectTab('columns');
  }

  // --- Filter tab --------------------------------------------------------

  toggleFilterOption(option: FilterValueOption, checked: boolean): void {
    option.checked = checked;
    this.applyFilterSelection();
  }

  toggleAllFilterOptions(checked: boolean): void {
    for (const option of this.filterOptions) {
      option.checked = checked;
    }

    this.applyFilterSelection();
  }

  private refreshFilterOptions(): void {
    const colDef = this.params.column.getColDef();
    const colId = getColumnId(colDef);
    const context = this.params.context as GridHeaderContext | undefined;
    const activeSelection = context?.setFilterSelections?.get(colId) ?? null;

    const values = new Map<string, unknown>();
    this.params.api.forEachNode((node) => {
      const value = resolveColumnCellValue(node, colDef);
      values.set(this.formatFilterLabel(value), value);
    });

    this.filterOptions = [...values.entries()]
      .sort(([labelA], [labelB]) => labelA.localeCompare(labelB))
      .map(([label, value]) => ({
        value,
        label,
        checked: activeSelection ? activeSelection.has(value) : true,
      }));

    this.filterSearch = '';
  }

  private applyFilterSelection(): void {
    const context = this.params.context as GridHeaderContext | undefined;
    const selections = context?.setFilterSelections;

    if (!selections) {
      return;
    }

    const colId = getColumnId(this.params.column.getColDef());

    if (this.allFilterOptionsChecked) {
      selections.delete(colId);
    } else {
      selections.set(
        colId,
        new Set(this.filterOptions.filter((option) => option.checked).map((option) => option.value)),
      );
    }

    this.params.api.onFilterChanged();
  }

  private formatFilterLabel(value: unknown): string {
    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (value === null || value === undefined || value === '') {
      return '(Vacío)';
    }

    return String(value);
  }

  // --- Columns tab ---------------------------------------------------------

  toggleColumnVisibility(column: Column, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.params.api.setColumnsVisible([column.getColId()], checkbox.checked);
  }

  toggleAllColumns(checked: boolean): void {
    this.params.api.setColumnsVisible(
      this.columns.map((column) => column.getColId()),
      checked,
    );
  }

  getColumnName(column: Column): string {
    return column.getColDef().headerName ?? column.getColId();
  }

  private refreshColumnsList(): void {
    this.columns = this.params.api.getColumns() ?? [];
    this.columnsSearch = '';
  }
}
