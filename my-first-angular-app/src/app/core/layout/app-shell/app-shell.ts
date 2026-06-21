import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlertHelper } from '../../../shared/utils/alert.helper';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alert: AlertHelper,
  ) {}

  signOut(): void {
    this.authService.signOut();
    this.alert.showSuccess('Sesion cerrada correctamente');
    this.router.navigate(['/login']);
  }
}
