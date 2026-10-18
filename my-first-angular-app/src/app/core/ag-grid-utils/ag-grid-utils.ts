
import { ColDef, IRowNode, ValueGetterParams } from 'ag-grid-community';
import { AgGridColumnHeaderComponent } from '@shared/components/ag-grid-column-header/ag-grid-column-header.component';

export function createAppDefaultColDef<TData>(): ColDef<TData> {
  return {
    sortable: true,
    filter: true,
    resizable: true,
    headerComponent: AgGridColumnHeaderComponent,
    suppressHeaderMenuButton: true,
  };
}

/** Stable key for a column, independent of the merged ColDef object identity
 *  ag-Grid hands back from `column.getColDef()` (a fresh merge of colDef +
 *  defaultColDef on every call) — matches ag-Grid's own colId derivation for
 *  the simple, non-grouped/non-pivoted columns this app uses. */
export function getColumnId<TData>(colDef: ColDef<TData>): string {
  return colDef.colId ?? (colDef.field as string | undefined) ?? '';
}

/** Resolves a row's cell value for a column the same way ag-Grid would
 *  (valueGetter first, falling back to field) — used by the custom header
 *  menu's value-list filter, which runs outside ag-Grid's own value-resolution
 *  pipeline via `doesExternalFilterPass` (see app-grid.component.ts). */
export function resolveColumnCellValue<TData>(
  node: IRowNode<TData>,
  colDef: ColDef<TData>,
): unknown {
  if (typeof colDef.valueGetter === 'function') {
    return colDef.valueGetter({ data: node.data, node, colDef } as ValueGetterParams<TData>);
  }

  if (colDef.field) {
    return (node.data as Record<string, unknown> | undefined)?.[colDef.field];
  }

  return undefined;
}