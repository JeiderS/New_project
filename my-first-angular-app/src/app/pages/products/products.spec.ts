import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Products } from './products';

describe('Products', () => {
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    fixture.detectChanges();
  });

  it('should render product grid header and initial rows', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Catalogo de productos');
    expect(element.querySelector('ag-grid-angular')).toBeTruthy();
    const rows = fixture.componentInstance.filteredProducts();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('should filter rows by search text', () => {
    fixture.componentInstance.onSearch('yerba');
    fixture.detectChanges();

    const rows = fixture.componentInstance.filteredProducts();
    expect(rows.length).toBe(1);
    expect(rows[0]?.name).toBe('Yerba Mate 1kg');
  });

  it('should show empty state when search has no matches', () => {
    fixture.componentInstance.onSearch('producto-que-no-existe');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const emptyTitle = element.querySelector('.products-empty h2')?.textContent;

    const rows = fixture.componentInstance.filteredProducts();
    expect(rows.length).toBe(0);
    expect(emptyTitle).toContain('Sin resultados');
  });
});
