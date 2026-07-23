import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Admin } from './admin.component';

describe('Admin', () => {
  let fixture: ComponentFixture<Admin>;
  let component: Admin;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Admin],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the confirm modal when toggling off an enabled setting', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const enabledToggle = compiled.querySelector<HTMLInputElement>(
      'input[type="checkbox"]:checked',
    );

    enabledToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    expect(component.showConfirm()).toBe(true);
  });

  it('applies the toggle after confirming', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const enabledToggle = compiled.querySelector<HTMLInputElement>(
      'input[type="checkbox"]:checked',
    );
    const target = component.settings().find((setting) => setting.enabled);

    enabledToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fixture.detectChanges();

    component.confirmDisable();
    fixture.detectChanges();

    const updated = component.settings().find((setting) => setting.title === target?.title);
    expect(updated?.enabled).toBe(false);
    expect(component.showConfirm()).toBe(false);
  });
});
