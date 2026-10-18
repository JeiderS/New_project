import { Injectable, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { createDelayedVisibilityController } from './delayed-visibility';

/**
 * Tipo 1 — module navigation: full-screen white, covering header and sidebar
 * too, no text. Self-wires to the Router so no feature page needs to call
 * show()/hide() itself — it tracks NavigationStart through
 * NavigationEnd/Cancel/Error automatically, which covers the lazy chunk
 * fetch + route resolution. A page's own initial data fetch (e.g. the first
 * `listUsers()` call) stays on LoadingService (Tipo 2), unchanged.
 */
@Injectable({ providedIn: 'root' })
export class ModuleLoadingService {
  private readonly controller = createDelayedVisibilityController();
  private readonly router = inject(Router);

  readonly isLoading = this.controller.visible;

  /** Manual escape hatch — normal usage is automatic via Router events below. */
  show(): void {
    this.controller.show();
  }

  hide(): void {
    this.controller.hide();
  }

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.controller.show();
        } else {
          this.controller.hide();
        }
      });
  }
}
