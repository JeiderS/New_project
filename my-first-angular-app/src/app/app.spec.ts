import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AlertService } from './core/alerts/alert.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render an alert when one is pushed', async () => {
    const fixture = TestBed.createComponent(App);
    const alertService = TestBed.inject(AlertService);
    alertService.success('Operacion ok');
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-alert__message')?.textContent).toContain('Operacion ok');
  });
});
