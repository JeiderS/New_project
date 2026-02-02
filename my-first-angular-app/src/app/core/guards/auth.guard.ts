import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabaseService.supabase.auth.getSession();
  if (data && data.session) {
    return true;
  } else {
    return router.parseUrl('/login');
  }
};

export const authGuardLoggedIn: CanActivateFn = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  const { data } = await supabaseService.supabase.auth.getSession();
  if (data && data.session) {
    return router.parseUrl('/dashboard');
  } else {
    return true;
  }
};
