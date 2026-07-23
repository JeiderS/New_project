import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal } from './modal';

@Component({
  standalone: true,
  imports: [Modal],
  template: `
    <button id="trigger" type="button" (click)="isOpen.set(true)">Open</button>
    <app-modal [(open)]="isOpen" title="Test modal">
      <input id="first-input" />
      <button id="second-btn" type="button">Second</button>
      <div modal-footer>
        <button id="footer-btn" type="button">Footer action</button>
      </div>
    </app-modal>
  `,
})
class TestHost {
  isOpen = signal(false);
}

describe('Modal', () => {
  let fixture: ComponentFixture<Modal>;
  let component: Modal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function getBackdrop(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('.modal-backdrop');
  }

  function getDialog(): HTMLElement | null {
    return (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
  }

  describe('open model signal', () => {
    it('renders hidden when open is false (default)', () => {
      expect(getBackdrop()?.classList.contains('hidden')).toBe(true);
    });

    it('renders visibly when open is set to true', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(getBackdrop()?.classList.contains('hidden')).toBe(false);
    });

    it('hides again when open is set back to false', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentRef.setInput('open', false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(getBackdrop()?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('accessibility base attributes', () => {
    it('sets role=dialog and aria-modal=true', () => {
      const dialog = getDialog();
      expect(dialog?.getAttribute('role')).toBe('dialog');
      expect(dialog?.getAttribute('aria-modal')).toBe('true');
    });

    it('does not set aria-labelledby when no title is provided', () => {
      expect(getDialog()?.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('renders a title element and points aria-labelledby at its id when title is provided', () => {
      fixture.componentRef.setInput('title', 'Confirm delete');
      fixture.detectChanges();

      const titleEl = (fixture.nativeElement as HTMLElement).querySelector('h2');
      const dialog = getDialog();

      expect(titleEl?.textContent).toContain('Confirm delete');
      expect(titleEl?.id).toBeTruthy();
      expect(dialog?.getAttribute('aria-labelledby')).toBe(titleEl?.id);
    });
  });

  describe('ESC dismissal', () => {
    it('closes on Escape by default and emits closed', async () => {
      const closedSpy = vi.fn();
      fixture.componentInstance.closed.subscribe(closedSpy);
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      await fixture.whenStable();

      getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(false);
      expect(closedSpy).toHaveBeenCalled();
    });

    it('does not close on Escape when closeOnEsc is false', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closeOnEsc', false);
      fixture.detectChanges();
      await fixture.whenStable();

      getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(true);
    });
  });

  describe('backdrop dismissal', () => {
    it('closes when clicking the backdrop by default', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      await fixture.whenStable();

      getBackdrop()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(false);
    });

    it('does not close on backdrop click when closeOnBackdrop is false', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closeOnBackdrop', false);
      fixture.detectChanges();
      await fixture.whenStable();

      getBackdrop()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(true);
    });

    it('does not close when clicking inside the dialog content', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.detectChanges();
      await fixture.whenStable();

      getDialog()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(true);
    });
  });

  describe('focus trap and restore', () => {
    let hostFixture: ComponentFixture<TestHost>;
    let host: TestHost;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHost],
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHost);
      host = hostFixture.componentInstance;
      hostFixture.detectChanges();
    });

    function open(): void {
      const trigger = hostFixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
      trigger.focus();
      trigger.click();
      hostFixture.detectChanges();
    }

    async function flush(): Promise<void> {
      await hostFixture.whenStable();
      hostFixture.detectChanges();
    }

    // Note: with the built-in close (X) button rendered (Phase 5, `closable` defaults to true),
    // the header close button is the true first focusable element in DOM order — it precedes
    // the projected body content. These assertions reflect that real, accessible tab order.

    it('moves focus to the first focusable element inside the modal on open', async () => {
      open();
      await flush();

      const closeBtn = hostFixture.nativeElement.querySelector('.modal-close-btn');
      expect(document.activeElement).toBe(closeBtn);
    });

    it('wraps Tab from the last focusable element back to the first', async () => {
      open();
      await flush();

      const footerBtn = hostFixture.nativeElement.querySelector('#footer-btn') as HTMLButtonElement;
      const closeBtn = hostFixture.nativeElement.querySelector('.modal-close-btn');
      footerBtn.focus();

      footerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      hostFixture.detectChanges();

      expect(document.activeElement).toBe(closeBtn);
    });

    it('wraps Shift+Tab from the first focusable element back to the last', async () => {
      open();
      await flush();

      const closeBtn = hostFixture.nativeElement.querySelector('.modal-close-btn') as HTMLButtonElement;
      const footerBtn = hostFixture.nativeElement.querySelector('#footer-btn');
      closeBtn.focus();

      closeBtn.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
      );
      hostFixture.detectChanges();

      expect(document.activeElement).toBe(footerBtn);
    });

    it('restores focus to the trigger element after close', async () => {
      const trigger = hostFixture.nativeElement.querySelector('#trigger');
      open();
      await flush();

      const dialog = hostFixture.nativeElement.querySelector('[role="dialog"]');
      dialog?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      hostFixture.detectChanges();
      await flush();

      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('content projection', () => {
    let hostFixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHost],
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHost);
      hostFixture.componentInstance.isOpen.set(true);
      hostFixture.detectChanges();
    });

    it('renders projected body content', () => {
      const firstInput = hostFixture.nativeElement.querySelector('#first-input');
      expect(firstInput).toBeTruthy();
    });

    it('renders projected [modal-footer] content in its own region', () => {
      const footer = hostFixture.nativeElement.querySelector('.modal-footer');
      const footerBtn = hostFixture.nativeElement.querySelector('#footer-btn');

      expect(footer).toBeTruthy();
      expect(footer?.contains(footerBtn)).toBe(true);
    });

    it('renders no empty footer chrome when no footer content is projected', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Modal],
      }).compileComponents();

      const bodyOnlyFixture = TestBed.createComponent(Modal);
      bodyOnlyFixture.componentRef.setInput('open', true);
      bodyOnlyFixture.detectChanges();

      const footer = (bodyOnlyFixture.nativeElement as HTMLElement).querySelector('.modal-footer');
      expect(footer?.childElementCount ?? 0).toBe(0);
    });
  });

  describe('closable input', () => {
    it('renders the close (X) button by default', () => {
      const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '.modal-close-btn',
      );
      expect(closeBtn).toBeTruthy();
    });

    it('hides the close button when closable is false', () => {
      fixture.componentRef.setInput('closable', false);
      fixture.detectChanges();

      const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
        '.modal-close-btn',
      );
      expect(closeBtn).toBeFalsy();
    });

    it('still closes on Escape when closable is false', async () => {
      fixture.componentRef.setInput('open', true);
      fixture.componentRef.setInput('closable', false);
      fixture.componentRef.setInput('closeOnEsc', true);
      fixture.detectChanges();
      await fixture.whenStable();

      getDialog()?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.open()).toBe(false);
    });
  });

  describe('size input', () => {
    it('uses the md width tier by default', () => {
      expect(getDialog()?.classList.contains('modal-md')).toBe(true);
    });

    it('uses a distinct lg width tier when size="lg"', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      const dialog = getDialog();
      expect(dialog?.classList.contains('modal-lg')).toBe(true);
      expect(dialog?.classList.contains('modal-sm')).toBe(false);
      expect(dialog?.classList.contains('modal-md')).toBe(false);
    });
  });
});
