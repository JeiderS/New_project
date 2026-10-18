import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertService } from '@core/alerts/alert.service';
import { ModulesService } from '@core/services/modules.service';
import { LoadingService } from '@core/loading/loading.service';
import { MenuItem } from '@shared/models/menu-item.model';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  signInForm!: FormGroup;

  constructor(
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly alertService: AlertService,
    private readonly modulesService: ModulesService,
    private readonly loadingService: LoadingService,
  ) {
    this.initForm();
  }

  ngOnInit() {}

  initForm(): void {
    this.signInForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit(): Promise<void> {
    try {
      this.loadingService.show('Iniciando sesion...');
      const email = this.signInForm.value.email as string;
      const password = this.signInForm.value.password as string;

      await this.authService.login(email, password);
      const landingRoute = await this.resolveLandingRoute();
      this.router.navigate([landingRoute]);
    } catch (error) {
      this.alertService.error(error, 'No se pudo iniciar sesion');
    } finally {
      this.loadingService.hide();
    }
  }

  private async resolveLandingRoute(): Promise<string> {
    try {
      const menu = await this.modulesService.getMenu();
      return this.containsUsersRoute(menu) ? '/users' : '/dashboard';
    } catch {
      return '/dashboard';
    }
  }

  private containsUsersRoute(items: MenuItem[]): boolean {
    return items.some(
      (item) => item.route === 'users' || (item.children ? this.containsUsersRoute(item.children) : false),
    );
  }
}
