import { Injectable, signal } from '@angular/core';
import {
  ActiveAlert,
  AlertOptions,
  AlertResult,
  AlertType,
  ResolvedAlertOptions,
} from './alert.types';

const AUTO_CLOSE_DEFAULT = 2500;

interface TypeDefaults {
  buttons: boolean;
  primaryText?: string;
  secondaryText?: string;
  dismissible?: boolean;
}

const TYPE_DEFAULTS: Record<AlertType, TypeDefaults> = {
  success: { buttons: false },
  info: { buttons: false },
  error: { buttons: true, primaryText: 'Entendido' },
  warning: { buttons: true, primaryText: 'Entendido' },
  confirm: { buttons: true, primaryText: 'Confirmar', secondaryText: 'Cancelar' },
  session: {
    buttons: true,
    primaryText: 'Seguir conectado',
    secondaryText: 'Salir',
    dismissible: false,
  },
};

/**
 * Reusable alert engine: callers pass a `type` (success/error/warning/info/
 * confirm/session) plus title/message, and this service resolves everything
 * else — whether buttons show, default button text, auto-close timing — from
 * TYPE_DEFAULTS. One alert on screen at a time; concurrent calls queue FIFO.
 * AlertContainerComponent renders `current()` and calls `respond()` on
 * user interaction.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly queue: ActiveAlert[] = [];
  private readonly currentSignal = signal<ActiveAlert | null>(null);
  private idSeq = 0;

  readonly current = this.currentSignal.asReadonly();

  show(opts: AlertOptions): Promise<AlertResult> {
    return new Promise((resolve) => {
      this.queue.push({ id: ++this.idSeq, opts: this.normalize(opts), resolve });
      this.advance();
    });
  }

  /** Resolves the active alert and advances the queue. Called by the container on user interaction. */
  respond(id: number, result: AlertResult): void {
    if (this.currentSignal()?.id !== id) {
      return;
    }

    const active = this.currentSignal();
    this.currentSignal.set(null);
    active?.resolve(result);
    this.advance();
  }

  // --- Shortcuts -----------------------------------------------------------
  // Keep the project's established (message, title?) argument order so every
  // existing call site (alertService.success('...'), .error(err, 'fallback'))
  // keeps working unchanged against this generic engine.

  success(
    message: string,
    title = 'Operacion exitosa',
    opts?: Partial<AlertOptions>,
  ): Promise<AlertResult> {
    return this.show({ type: 'success', title, message, ...opts });
  }

  info(message: string, title = 'Informacion', opts?: Partial<AlertOptions>): Promise<AlertResult> {
    return this.show({ type: 'info', title, message, ...opts });
  }

  warning(message: string, title = 'Atencion', opts?: Partial<AlertOptions>): Promise<AlertResult> {
    return this.show({ type: 'warning', title, message, ...opts });
  }

  error(
    error: unknown,
    fallbackMessage = 'Ocurrio un error inesperado',
    title = 'Error',
    opts?: Partial<AlertOptions>,
  ): Promise<AlertResult> {
    return this.show({
      type: 'error',
      title,
      message: this.resolveErrorMessage(error, fallbackMessage),
      ...opts,
    });
  }

  /** Resolves true when the user confirms. */
  confirm(
    message: string,
    title = 'Confirmar accion',
    opts?: Partial<AlertOptions>,
  ): Promise<boolean> {
    return this.show({ type: 'confirm', title, message, ...opts }).then(
      (result) => result === 'primary',
    );
  }

  /** Resolves true when the user chooses to stay connected. */
  session(
    message: string,
    title = 'Tu sesion esta por vencer',
    opts?: Partial<AlertOptions>,
  ): Promise<boolean> {
    return this.show({ type: 'session', title, message, ...opts }).then(
      (result) => result === 'primary',
    );
  }

  private advance(): void {
    if (this.currentSignal() || this.queue.length === 0) {
      return;
    }

    this.currentSignal.set(this.queue.shift() ?? null);
  }

  private normalize(opts: AlertOptions): ResolvedAlertOptions {
    const type: AlertType = opts.type ?? 'info';
    const defaults = TYPE_DEFAULTS[type];

    const buttons =
      opts.buttons !== undefined
        ? !!opts.buttons
        : opts.primaryText || opts.secondaryText
          ? true
          : defaults.buttons;

    let autoClose =
      opts.autoClose !== undefined ? opts.autoClose || 0 : buttons ? 0 : AUTO_CLOSE_DEFAULT;
    if (!buttons && autoClose <= 0) {
      autoClose = AUTO_CLOSE_DEFAULT;
    }

    return {
      type,
      title: opts.title,
      message: opts.message,
      buttons,
      primaryText: opts.primaryText ?? defaults.primaryText ?? 'Entendido',
      secondaryText: opts.secondaryText ?? defaults.secondaryText ?? null,
      danger: !!opts.danger,
      dismissible:
        opts.dismissible !== undefined ? !!opts.dismissible : defaults.dismissible !== false,
      autoClose,
    };
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
