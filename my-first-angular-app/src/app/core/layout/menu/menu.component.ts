import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from '@shared/models/menu-item.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  @Input() item!: MenuItem;
  @Output() navigated = new EventEmitter<void>();

  readonly expanded = signal(false);

  toggle() {
    this.expanded.update((value) => !value);
  }

  onNavigate() {
    this.navigated.emit();
  }
}
