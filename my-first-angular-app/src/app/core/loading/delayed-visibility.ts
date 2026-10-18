import { signal, Signal } from '@angular/core';

/**
 * 300ms show-delay (a fast operation never flashes the loader) + 400ms
 * minimum-visible-once-shown (it never flickers off instantly either), with
 * call counting so nested show()/hide() pairs only resolve on the last one.
 * Shared by LoadingService (overlay) and ModuleLoadingService (module nav)
 * so both loader types get identical anti-flicker behavior for free.
 */
const SHOW_DELAY_MS = 300;
const MIN_VISIBLE_MS = 400;

export interface DelayedVisibilityController {
  readonly visible: Signal<boolean>;
  show(): void;
  hide(): void;
}

export function createDelayedVisibilityController(): DelayedVisibilityController {
  const visible = signal(false);

  let count = 0;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let shownAt = 0;

  function reveal(): void {
    showTimer = null;
    shownAt = Date.now();
    visible.set(true);
  }

  function conceal(): void {
    hideTimer = null;
    visible.set(false);
  }

  return {
    visible: visible.asReadonly(),

    show(): void {
      count++;

      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
        return;
      }

      if (showTimer || visible()) {
        return;
      }

      showTimer = setTimeout(reveal, SHOW_DELAY_MS);
    },

    hide(): void {
      if (count === 0) {
        return;
      }

      count--;

      if (count > 0) {
        return;
      }

      if (showTimer) {
        clearTimeout(showTimer);
        showTimer = null;
        return;
      }

      const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
      hideTimer = setTimeout(conceal, wait);
    },
  };
}
