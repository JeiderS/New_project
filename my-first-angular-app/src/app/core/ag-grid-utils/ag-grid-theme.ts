
import { themeQuartz } from 'ag-grid-community';

export const appGridTheme = themeQuartz.withParams({
  fontFamily: 'Inter, Segoe UI, sans-serif',
  fontSize: 13,

  accentColor: '#1D386E',
  foregroundColor: '#1e293b',
  backgroundColor: '#ffffff',

  headerBackgroundColor: '#1D386E',
  headerTextColor: '#ffffff',
  headerHeight: 40,
  // Full-height separator between header columns (replaces the short resize
  // "|" tick) in white at 20% over the navy header.
  headerColumnBorder: { style: 'solid', width: 1, color: 'rgba(255, 255, 255, 0.2)' },
  // Hides the drawn resize handle while keeping its 8px drag hit-area, so
  // columns are still resizable by dragging the (now invisible) edge.
  headerColumnResizeHandleColor: 'transparent',

  rowHeight: 32,
  oddRowBackgroundColor: '#ffffff',
  // Horizontal row lines render visibly fainter than vertical column lines
  // at the same color (a hairline anti-aliasing artifact, not a config
  // mismatch — width/color are otherwise identical), so the row line gets a
  // darker shade to compensate and read at matching weight.
  rowBorder: { style: 'solid', width: 1, color: '#c7cdd6' },
  columnBorder: { style: 'solid', width: 1, color: '#e3e7ec' },
  pinnedColumnBorder: { style: 'solid', width: 1, color: '#e3e7ec' },
  borderColor: '#dfe3e9',
  rowHoverColor: '#f5f7fa',
  selectedRowBackgroundColor: '#eef3fa',

  cellHorizontalPadding: 12,

  spacing: 4,
});
