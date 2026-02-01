import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

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
    private readonly supabase: SupabaseService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
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

      const { error } = await this.supabase.signInWithPassword(email, password);
      if (error) throw error;
      this.router.navigate(['/dashboard']);
    } catch (error) {
      if (error instanceof Error) {
        alert('Error: ' + error.message);
      }
    } finally {
      this.loading = false;
    }
  }
}
