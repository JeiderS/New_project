import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  inject,
  computed,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/auth/services/supabase.service';
import { AlertHelper } from '@shared/utils/alert.helper';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private supabaseService = inject(SupabaseService);
  menuOpen = false;

  userName = computed(() => this.supabaseService.getUserName());
  readonly title = input.required<string>();
  readonly kicker = input<string>('');
  readonly description = input<string>('');

  constructor(
    private readonly router: Router,
    private readonly alert: AlertHelper,
  ) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabaseService.signOut();
    if (error) {
      this.alert.showError(error, 'No se pudo cerrar sesion');
      return;
    }

    this.alert.showSuccess('Sesion cerrada correctamente');
    this.router.navigate(['/login']);
  }

  closeMenu() {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.user-profile')) {
      this.menuOpen = false;
    }
  }
}
