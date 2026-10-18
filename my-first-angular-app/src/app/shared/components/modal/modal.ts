import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

/**
 * Generic content-projection modal shell.
 *
 * Drives its visibility via a two-way `[(open)]` model signal. Body content is projected
 * through the default slot; optional actions go in a `[modal-footer]`-tagged block. ESC and
 * backdrop-click dismissal, focus trapping, and focus restoration are handled internally.
 *
 * @example
 * ```html
 * <app-modal [(open)]="showConfirm" title="Eliminar producto" size="sm" [closeOnBackdrop]="false">
 *   <p>¿Seguro que querés eliminar «{{ product().name }}»?</p>
 *   <div modal-footer>
 *     <button (click)="showConfirm.set(false)">Cancelar</button>
 *     <button (click)="remove()">Eliminar</button>
 *   </div>
 * </app-modal>
 * ```
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class Modal {
  private static nextId = 0;

  private static readonly focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  /** Two-way bindable open state: `[(open)]`. */
  open = model<boolean>(false);

  /** Optional dialog title. Drives `aria-labelledby` when set. */
  title = input<string>();

  /**
   * Optional small caption rendered inline immediately before the title (e.g. "New" / "Edit").
   * Only rendered when `position` is `'float'` — `'center'`/`'side'` keep the header title-only.
   */
  eyebrow = input<string>();

  /** Gates Escape-key dismissal. */
  closeOnEsc = input<boolean>(true);

  /** Gates backdrop-click dismissal. */
  closeOnBackdrop = input<boolean>(true);

  /** Shows/hides the built-in close (X) button. Does not affect ESC/backdrop dismissal. */
  closable = input<boolean>(true);

  /** Dialog width tier. Ignored when `position` is `'side'` or `'float'` (both size themselves). */
  size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Layout of the dialog: `'center'` (default) overlays centered with a dimmed backdrop;
   * `'side'` docks a full-height panel to the right, leaving the rest of the screen visible
   * and undimmed — for flows where the underlying view (e.g. a grid) stays usable alongside
   * the form, like the reference layout this consumer asked to match; `'float'` is similar to
   * `'side'` but floats as a card with margin insets on top/right/bottom (never edge-flush),
   * a tight border radius, and a bounded height instead of full-height — the admin-panel
   * "floating detail panel" pattern from the `interface-design` skill; `'inline'` renders with
   * no `position: fixed` and no backdrop, filling whatever container it's placed in — for a
   * true split-pane layout (e.g. one `app-page-layout` column holding the grid, another
   * holding this panel) instead of an overlay.
   */
  position = input<'center' | 'side' | 'float' | 'inline'>('center');

  /** Emitted whenever the modal closes, regardless of trigger. */
  closed = output<void>();

  readonly titleId = `app-modal-title-${Modal.nextId++}`;

  private readonly dialogRef = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly destroyRef = inject(DestroyRef);
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        queueMicrotask(() => this.focusFirstElement());
      } else if (this.previouslyFocused) {
        this.restoreFocus();
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.open()) {
        this.restoreFocus();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      return;
    }

    if (event.key === 'Escape' && this.closeOnEsc()) {
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.handleTabWrap(event);
    }
  }

  onBackdrop(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close();
    }
  }

  close(): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    this.closed.emit();
  }

  private getFocusableElements(): HTMLElement[] {
    const dialog = this.dialogRef()?.nativeElement;

    if (!dialog) {
      return [];
    }

    return Array.from(dialog.querySelectorAll<HTMLElement>(Modal.focusableSelector)).filter(
      (element) => !element.hasAttribute('disabled') && !element.hasAttribute('hidden'),
    );
  }

  private focusFirstElement(): void {
    const [first] = this.getFocusableElements();
    const fallback = this.dialogRef()?.nativeElement;

    (first ?? fallback)?.focus();
  }

  private restoreFocus(): void {
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  private handleTabWrap(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();

    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !focusable.includes(active as HTMLElement)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
