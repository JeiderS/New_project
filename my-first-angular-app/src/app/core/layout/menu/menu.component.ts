import { Component, Input } from '@angular/core';
import { MenuItem } from '@shared/models/menu-item.model';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {

  @Input() item!: MenuItem;

expanded = false;

toggle() {
  this.expanded = !this.expanded;
}

}
