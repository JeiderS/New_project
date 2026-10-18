import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { AlertService } from './alert.service';
import { AlertResult } from './alert.types';

@Component({
  selector: 'app-alert-container',
  standalone: true,
  templateUrl: './alert-container.component.html',
  styleUrl: './alert-container.component.css',
})
export class AlertContainerComponent {
  protected readonly alertService = inject(AlertService);

  private readonly dialogRef = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly primaryRef = viewChild<ElementRef<HTMLElement>>('primaryBtn');
  private readonly secondaryRef = viewChild<ElementRef<HTMLElement>>('secondaryBtn');
  private readonly destroyRef = inject(DestroyRef);

  private previouslyFocused: HTMLElement | null = null;
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const alert = this.alertService.current();

      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
        this.autoCloseTimer = null;
      }

      if (!alert) {
        this.restoreFocus();
        return;
      }

      this.previouslyFocused = document.activeElement as HTMLElement | null;
      queueMicrotask(() => this.focusInitialElement());

      if (alert.opts.autoClose > 0) {
        this.autoCloseTimer = setTimeout(() => this.respond('timeout'), alert.opts.autoClose);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.autoCloseTimer) {
        clearTimeout(this.autoCloseTimer);
      }
    });
  }

  respond(result: AlertResult): void {
    const alert = this.alertService.current();
    if (alert) {
      this.alertService.respond(alert.id, result);
    }
  }

  onBackdropClick(): void {
    const alert = this.alertService.current();
    if (alert && !alert.opts.buttons && alert.opts.dismissible) {
      this.respond('dismiss');
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const alert = this.alertService.current();
    if (!alert) {
      return;
    }

    if (event.key === 'Escape' && alert.opts.dismissible) {
      event.preventDefault();
      this.respond('dismiss');
      return;
    }

    if (event.key === 'Tab' && alert.opts.buttons) {
      this.handleTabWrap(event);
    }
  }

  private focusInitialElement(): void {
    const alert = this.alertService.current();
    if (!alert) {
      return;
    }

    if (!alert.opts.buttons) {
      this.dialogRef()?.nativeElement.focus();
      return;
    }

    const target =
      alert.opts.danger && this.secondaryRef() ? this.secondaryRef() : this.primaryRef();
    target?.nativeElement.focus();
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  private handleTabWrap(event: KeyboardEvent): void {
    const focusables = [this.secondaryRef(), this.primaryRef()]
      .filter((ref): ref is ElementRef<HTMLElement> => !!ref)
      .map((ref) => ref.nativeElement);

    if (focusables.length === 0) {
      return;
    }

    event.preventDefault();
    const active = document.activeElement;
    const index = focusables.indexOf(active as HTMLElement);
    const next = event.shiftKey ? index - 1 : index + 1;
    focusables[(next + focusables.length) % focusables.length]?.focus();
  }
}
