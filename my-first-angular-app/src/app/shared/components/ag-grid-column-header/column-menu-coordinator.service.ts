import { Injectable } from '@angular/core';

interface CoordinatedMenu {
  closeMenu(): void;
}

/**
 * Each column gets its own AgGridColumnHeaderComponent instance with its own
 * independent `menuVisible` state, so nothing stopped two (or ten) column
 * menus from being open at once. This tracks the single currently-open menu
 * and closes it whenever a different one opens.
 */
@Injectable({ providedIn: 'root' })
export class ColumnMenuCoordinatorService {
  private current: CoordinatedMenu | null = null;

  notifyOpen(menu: CoordinatedMenu): void {
    if (this.current && this.current !== menu) {
      this.current.closeMenu();
    }

    this.current = menu;
  }

  notifyClose(menu: CoordinatedMenu): void {
    if (this.current === menu) {
      this.current = null;
    }
  }
}
