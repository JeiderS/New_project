
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

const NO_ROWS_TEMPLATE =
  '<span style="color:#64748b;font-size:13px;">Sin registros para mostrar</span>';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [AgGridAngular],
  templateUrl: './app-grid.component.html',
  host: {
    '[style.height]': 'hostHeight',
  },
  styles: [
    ':host { display: block; width: 100%; min-height: 0; }',
    /* The global `.app-grid` theme class (src/styles/_ag-grid.scss) sets a
       fixed `height: 400px; min-height: 300px` fallback for grids with no
       sized container — needed here too, since that class also lands on the
       inner <ag-grid-angular> this component renders. `height: 100%` lets it
       take whatever `:host`'s own (adaptively computed) height resolves to;
       when that's `auto` the percentage simply doesn't resolve, so ag-Grid's
       own `autoHeight` dom layout is the one sizing it, which is the point. */
    '.app-grid { height: 100%; min-height: 0; }',
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

  /** Caps how tall this grid may grow. Below the cap it shrink-wraps to its
   *  actual row count (`domLayout: 'autoHeight'`, no scroll, no dead space);
   *  once content would exceed it, it locks to `maxHeight` and switches to
   *  `domLayout: 'normal'` so ag-Grid's own internal viewport scrolls. The
   *  grid decides which of those two it needs from its own row count — a
   *  consumer that wants this just states the space available, instead of
   *  hand-wiring a fixed-height wrapper + CSS overrides itself. Omitted
   *  (default): unchanged fill-100%-of-container behavior. */
  @Input() maxHeight?: number;

  @Output() cellClicked = new EventEmitter<CellClickedEvent<TData>>();

  @Output() cellDoubleClicked = new EventEmitter<CellDoubleClickedEvent<TData>>();

  gridOptionsForGrid: GridOptions<TData> = {};

  /** Driven by `maxHeight`/`rowData` in `ngOnChanges`; bound via the
   *  component's `host` metadata above. */
  hostHeight = '100%';

  /** colId -> checked values for the custom header menu's value-list filter
   *  (ag-Grid Community has no built-in Set Filter). Shared with every column
   *  header instance via `gridOptions.context`, keyed by colId rather than
   *  ColDef identity because `column.getColDef()` returns a fresh merged
   *  object on every call, not the array entry this component was given. */
  private readonly setFilterSelections = new Map<string, Set<unknown>>();

  ngOnChanges(): void {
    const adaptiveDomLayout = this.applyAdaptiveSizing();

    this.gridOptionsForGrid = {
      ...this.gridOptions,
      ...(adaptiveDomLayout && { domLayout: adaptiveDomLayout }),
      // Every consumer gets a Spanish empty state for free instead of
      // re-implementing one (a dashed-border div living next to the grid)
      // per page — ag-Grid already renders this overlay automatically
      // whenever `rowData` is empty. A consumer that needs different
      // copy/markup overrides it via its own `gridOptions`.
      overlayNoRowsTemplate: this.gridOptions.overlayNoRowsTemplate ?? NO_ROWS_TEMPLATE,
      ...(this.rowSelection && {
        rowSelection: this.gridOptions.rowSelection ?? {
          mode: 'multiRow',
          checkboxes: true,
          headerCheckbox: true,
          enableClickSelection: false,
        },
        selectionColumnDef: this.gridOptions.selectionColumnDef,
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

  /** Sets `hostHeight` for this change cycle and returns the `domLayout` the
   *  adaptive behavior needs, or `undefined` when `maxHeight` isn't set (so
   *  the caller leaves `gridOptions.domLayout` exactly as the consumer gave
   *  it — unchanged default behavior).
   *
   *  Deliberately always `'normal'`, never `'autoHeight'`: switching
   *  `domLayout` at runtime (e.g. a consumer growing `rowData` row by row
   *  while the grid stays mounted, which is the real usage pattern here —
   *  typing new actions into an already-open grid) is not something ag-Grid
   *  picks up reliably through a changed `gridOptions` object. `'normal'`
   *  never needs to change mode: its own `.ag-body-viewport` already
   *  scrolls whenever content exceeds the height it's given, so capping
   *  `hostHeight` at the natural content height below `maxHeight`, or at
   *  `maxHeight` once content would exceed it, is enough on its own to get
   *  both "shrink to fit, no scroll" and "cap height, scroll" for free. */
  private applyAdaptiveSizing(): GridOptions<TData>['domLayout'] | undefined {
    if (this.maxHeight == null) {
      this.hostHeight = '100%';
      return undefined;
    }

    const rowHeight = this.gridOptions.rowHeight ?? 32;
    const headerHeight = this.gridOptions.headerHeight ?? 40;
    const contentHeight = headerHeight + this.rowData.length * rowHeight;

    this.hostHeight = `${Math.min(contentHeight, this.maxHeight)}px`;
    return 'normal';
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
