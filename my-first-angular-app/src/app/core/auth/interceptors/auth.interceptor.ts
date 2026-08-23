import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      // A 401 here means either a stale/cross-tenant token
      // (TenantClaimValidationMiddleware) or a pre-deploy token with no
      // tenant claim at all — either way, the session is no longer valid and
      // the user must re-authenticate.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.signOut();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
