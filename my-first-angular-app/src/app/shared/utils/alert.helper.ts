import { Injectable, signal } from '@angular/core';

export type AlertType = 'success' | 'error';

export interface AlertState {
  open: boolean;
  type: AlertType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AlertHelper {
  private readonly _alert = signal<AlertState | null>(null);
  readonly alert = this._alert.asReadonly();

  showSuccess(message: string, title = 'Operacion exitosa'): void {
    this._alert.set({
      open: true,
      type: 'success',
      title,
      message,
    });
  }

  showError(error: unknown, fallbackMessage = 'Ocurrio un error inesperado', title = 'Error'): void {
    this._alert.set({
      open: true,
      type: 'error',
      title,
      message: this.resolveErrorMessage(error, fallbackMessage),
    });
  }

  close(): void {
    this._alert.set(null);
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
      return error;
    }

    return fallbackMessage;
  }
}
