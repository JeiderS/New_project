import { Component } from '@angular/core';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router,
  ) {}

  ngOnInit() {}

  async signOut(): Promise<void> {
    const { error } = await this.supabase.signOut();
    if (error) {
      alert('Error signing out: ' + error.message);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
