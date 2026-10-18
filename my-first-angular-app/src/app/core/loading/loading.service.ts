import { Injectable, signal } from '@angular/core';
import { createDelayedVisibilityController } from './delayed-visibility';

/**
 * Tipo 2 — blocking service calls (save/edit/delete/login): dark blurred
 * overlay with a message, while the user can't touch anything. Never use
 * this for list loads, search, filters, or pagination — those get a small
 * inline indicator instead, not a full-screen block.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly controller = createDelayedVisibilityController();
  private readonly messageSignal = signal<string | null>(null);

  readonly isLoading = this.controller.visible;
  readonly message = this.messageSignal.asReadonly();

  show(message?: string): void {
    this.messageSignal.set(message ?? 'Cargando...');
    this.controller.show();
  }

  hide(): void {
    this.controller.hide();
  }
}
