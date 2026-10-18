import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ModulesService } from '@core/services/modules.service';
import { MenuItem } from '@shared/models/menu-item.model';

const EXPANDED_STORAGE_KEY = 'appSideMenu.expanded';

interface FilteredEntry {
  item: MenuItem;
  children: MenuItem[];
}

function fold(text: string | undefined | null): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function loadExpanded(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(EXPANDED_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveExpanded(value: Record<string, boolean>): void {
  try {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // no storage available — accordion state just won't persist across visits
  }
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  @ViewChild('rail') private readonly railRef?: ElementRef<HTMLElement>;
  @ViewChild('panel') private readonly panelRef?: ElementRef<HTMLElement>;

  private readonly modulesService = inject(ModulesService);
  private readonly router = inject(Router);

  readonly sections = signal<MenuItem[]>([]);
  readonly openIndex = signal<number | null>(null);
  readonly query = signal('');
  readonly expanded = signal<Record<string, boolean>>(loadExpanded());
  readonly currentUrl = signal(this.router.url);

  readonly openSection = computed(() => {
    const index = this.openIndex();
    return index === null ? null : (this.sections()[index] ?? null);
  });

  readonly filteredItems = computed<FilteredEntry[]>(() => {
    const section = this.openSection();
    if (!section) {
      return [];
    }

    const term = fold(this.query().trim());
    const items = section.children ?? [];

    if (!term) {
      return items.map((item) => ({ item, children: item.children ?? [] }));
    }

    return items.reduce<FilteredEntry[]>((acc, item) => {
      const itemMatches = fold(item.nombre).includes(term);
      const matchingChildren = (item.children ?? []).filter((child) =>
        fold(child.nombre).includes(term),
      );

      if (itemMatches || matchingChildren.length > 0) {
        acc.push({ item, children: itemMatches ? (item.children ?? []) : matchingChildren });
      }

      return acc;
    }, []);
  });

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.currentUrl.set(this.router.url));
  }

  async ngOnInit(): Promise<void> {
    try {
      const sections = await this.modulesService.getMenu();
      this.sections.set(sections);
    } catch {
      this.sections.set([]);
    }
  }

  routeFor(route: string | undefined): string | null {
    if (!route) {
      return null;
    }

    return route.startsWith('/') ? route : `/${route}`;
  }

  isCurrent(route: string | undefined): boolean {
    const normalized = this.routeFor(route);
    return !!normalized && this.currentUrl().split('?')[0] === normalized;
  }

  itemHasCurrent(item: MenuItem): boolean {
    if (this.isCurrent(item.route)) {
      return true;
    }

    return (item.children ?? []).some((child) => this.isCurrent(child.route));
  }

  sectionHasCurrent(section: MenuItem): boolean {
    if (this.isCurrent(section.route)) {
      return true;
    }

    return (section.children ?? []).some((item) => this.itemHasCurrent(item));
  }

  isSectionActive(section: MenuItem, index: number): boolean {
    const openIndex = this.openIndex();
    return openIndex !== null ? openIndex === index : this.sectionHasCurrent(section);
  }

  toggleSection(section: MenuItem, index: number): void {
    if (!section.children?.length) {
      this.closePanel();
      const route = this.routeFor(section.route);
      if (route) {
        void this.router.navigateByUrl(route);
      }
      return;
    }

    if (this.openIndex() === index) {
      this.closePanel();
    } else {
      this.openPanel(index);
    }
  }

  openPanel(index: number): void {
    this.openIndex.set(index);
    this.query.set('');
    this.autoExpandCurrentAncestor();
  }

  closePanel(returnFocus = false): void {
    const wasIndex = this.openIndex();
    if (wasIndex === null) {
      return;
    }

    this.openIndex.set(null);

    if (returnFocus) {
      const buttons = this.railRef?.nativeElement.querySelectorAll<HTMLElement>('.sm-rail__item');
      buttons?.[wasIndex]?.focus();
    }
  }

  onSearchInput(value: string): void {
    this.query.set(value);
  }

  isExpanded(section: MenuItem, item: MenuItem): boolean {
    if (this.query().trim()) {
      return true;
    }

    return !!this.expanded()[this.expandKey(section, item)];
  }

  toggleItem(section: MenuItem, item: MenuItem): void {
    const key = this.expandKey(section, item);
    const next = { ...this.expanded(), [key]: !this.expanded()[key] };
    this.expanded.set(next);
    saveExpanded(next);
  }

  private expandKey(section: MenuItem, item: MenuItem): string {
    return `${section.nombre}/${item.nombre}`;
  }

  private autoExpandCurrentAncestor(): void {
    const section = this.openSection();
    if (!section) {
      return;
    }

    const next = { ...this.expanded() };
    let changed = false;

    for (const item of section.children ?? []) {
      const key = this.expandKey(section, item);
      if (next[key] === undefined && item.children?.length && this.itemHasCurrent(item)) {
        next[key] = true;
        changed = true;
      }
    }

    if (changed) {
      this.expanded.set(next);
      saveExpanded(next);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.openIndex() === null) {
      return;
    }

    const target = event.target as HTMLElement;
    const insidePanel = this.panelRef?.nativeElement.contains(target);
    const insideRail = this.railRef?.nativeElement.contains(target);

    if (!insidePanel && !insideRail) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.openIndex() !== null) {
      this.closePanel(true);
    }
  }
}
