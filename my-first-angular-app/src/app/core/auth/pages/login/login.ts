import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AlertHelper } from '../../../../shared/utils/alert.helper';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  signInForm!: FormGroup;
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly alert: AlertHelper,
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
      this.loading = true;
      const email = this.signInForm.value.email as string;
      const password = this.signInForm.value.password as string;

      await this.authService.login(email, password);
      this.router.navigate(['/dashboard']);
    } catch (error) {
      this.alert.showError(error, 'No se pudo iniciar sesion');
    } finally {
      this.loading = false;
    }
  }
}
