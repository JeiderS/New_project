import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlertHelper } from '../../../helper/alert.helper';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
    private readonly alert: AlertHelper,
  ) {}

  async signOut(): Promise<void> {
    const { error } = await this.supabase.signOut();
    if (error) {
      this.alert.showError(error, 'No se pudo cerrar sesion');
      return;
    }

    this.alert.showSuccess('Sesion cerrada correctamente');
    this.router.navigate(['/login']);
  }
}
