import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ModulesService } from '@core/services/modules.service';
import { MenuItem } from '@shared/models/menu-item.model';
import { MenuComponent } from '@core/layout/menu/menu.component';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, MenuComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @ViewChild('panel') panelRef!: ElementRef;
  @ViewChild('sidebar') sidebarRef!: ElementRef;

  private readonly modulesService = inject(ModulesService);

  selectedMod: MenuItem | null = null;

  // App zoneless (sin zone.js): una reasignación de propiedad normal tras un
  // await no dispara detección de cambios. Con signal() sí, sin importar
  // desde dónde se actualice.
  modulos = signal<MenuItem[]>([]);

  constructor() {}

  async ngOnInit(): Promise<void> {
    try {
      const menu = await this.modulesService.getMenu();
      this.modulos.set(menu);
    } catch {
      this.modulos.set([]);
    }
  }

  selectMod(mod: MenuItem) {
    this.selectedMod = mod;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInsidePanel = this.panelRef?.nativeElement.contains(event.target);

    const clickedInsideSidebar = this.sidebarRef?.nativeElement.contains(event.target);

    if (!clickedInsidePanel && !clickedInsideSidebar) {
      this.selectedMod = null;
    }
  }
}
