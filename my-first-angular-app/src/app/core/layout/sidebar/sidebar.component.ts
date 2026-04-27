import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  @ViewChild('panel') panelRef!: ElementRef;
  @ViewChild('sidebar') sidebarRef!: ElementRef;

  selectedMod: any = null;
  expandedChild: any = null;

  modulos = [
    {
      nombre: 'Administration',
      icon: 'fa fa-cog',
      children: [
        {
          nombre: 'Security',
          icon: 'fa fa-lock',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
        {
          nombre: 'Security',
           icon: 'fa fa-chart-bar',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
        {
          nombre: 'Security',
          icon: 'fa fa-lock',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
        {
          nombre: 'Security',
          icon: 'fa fa-lock',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
      ],
    },
    {
      nombre: 'Productos',
      icon: 'fa fa-box',
      children: [
        {
          nombre: 'Security1',
          icon: 'fa fa-lock',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
      ],
    },
    {
      nombre: 'Categorias',
      icon: 'fa fa-tags',
      children: [
        {
          nombre: 'Security2',
          icon: 'fa fa-lock',
          route: '/dashboard',
          children: [
            { nombre: 'Analytics', icon: 'fa fa-chart-bar', route: '/dashboard/analytics' },
            { nombre: 'Reports', icon: 'fa fa-file-alt', route: '/dashboard/reports' },
          ],
        },
      ],
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  selectMod(mod: any) {
    this.selectedMod = mod;
    this.expandedChild = null;
  }

  selectChild(child: any) {
    this.expandedChild = this.expandedChild === child ? null : child;
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
