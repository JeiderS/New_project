
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';
import {
  CellClickedEvent,
  ColDef,
  GridOptions,
  CellDoubleClickedEvent,
  IRowNode,
} from 'ag-grid-community';

import { AgGridColumnHeaderComponent } from
  '../ag-grid-column-header/ag-grid-column-header.component';

  import {
    createAppDefaultColDef,
    getColumnId,
    resolveColumnCellValue,
  } from '@core/ag-grid-utils/ag-grid-utils';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './app-grid.component.html',
  styles: [
    ':host { display: block; width: 100%; height: 100%; min-height: 0; }',
  ],
})
export class AppGridComponent<TData = unknown> implements OnChanges {
  @Input() rowData: TData[] = [];

  @Input() columnDefs: ColDef<TData>[] = [];

  @Input() defaultColDef: ColDef<TData> = {};

  @Input() gridOptions: GridOptions<TData> = {};

  /** Multi-row selection with checkboxes is OFF unless a consumer opts in —
   *  not every screen needs it, so each one that does must declare
   *  `[rowSelection]="true"` itself rather than inherit it as a hidden
   *  default from this shared component. */
  @Input() rowSelection = false;

  @Output() cellClicked = new EventEmitter<CellClickedEvent<TData>>();

  @Output() cellDoubleClicked = new EventEmitter<CellDoubleClickedEvent<TData>>();

  gridOptionsForGrid: GridOptions<TData> = {};

  /** colId -> checked values for the custom header menu's value-list filter
   *  (ag-Grid Community has no built-in Set Filter). Shared with every column
   *  header instance via `gridOptions.context`, keyed by colId rather than
   *  ColDef identity because `column.getColDef()` returns a fresh merged
   *  object on every call, not the array entry this component was given. */
  private readonly setFilterSelections = new Map<string, Set<unknown>>();

  private static readonly selectionColumnDef = {
    width: 56,
    minWidth: 56,
    maxWidth: 56,
    resizable: false,
    pinned: 'left' as const,
    lockPosition: 'left' as const,
    suppressHeaderMenuButton: true,
    cellClass: 'sis-col-seleccion',
    headerClass: 'sis-col-seleccion',
  };

  ngOnChanges(): void {
    this.gridOptionsForGrid = {
      ...this.gridOptions,
      ...(this.rowSelection && {
        rowSelection: this.gridOptions.rowSelection ?? {
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true,
          enableClickSelection: false,
        },
        selectionColumnDef: this.gridOptions.selectionColumnDef ?? AppGridComponent.selectionColumnDef,
      }),
      context: {
        ...this.gridOptions.context,
        setFilterSelections: this.setFilterSelections,
      },
      isExternalFilterPresent: () => this.setFilterSelections.size > 0,
      doesExternalFilterPass: (node: IRowNode<TData>) => this.passesSetFilters(node),
      defaultColDef: {
         ...createAppDefaultColDef<TData>(),
        sortable: true,
        filter: true,
        resizable: true,
        ...this.gridOptions.defaultColDef,
        ...this.defaultColDef,
        headerComponent: AgGridColumnHeaderComponent,
        suppressHeaderMenuButton: true,
      },
    };
  }

  private passesSetFilters(node: IRowNode<TData>): boolean {
    for (const colDef of this.columnDefs) {
      const selection = this.setFilterSelections.get(getColumnId(colDef));

      if (selection && !selection.has(resolveColumnCellValue(node, colDef))) {
        return false;
      }
    }

    return true;
  }
}
