import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Login/refresh/logout no llevan Bearer (son AllowAnonymous del lado del
// backend) y nunca deben disparar un intento de refresh si fallan con 401 —
// si no, un login con contraseña incorrecta terminaría llamando a /refresh.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

// Estado compartido entre invocaciones del interceptor (mismo módulo, misma
// instancia): evita que N requests que expiran al mismo tiempo disparen N
// refresh en paralelo. refreshedToken$ multicastea el token nuevo a las que
// quedaron esperando.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => req.url.includes(path));

  const token = authService.getToken();
  const authReq = req.clone({
    setHeaders: token && !isAuthEndpoint ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // El refresh token ya no sirve (vencido/revocado) o es un endpoint de
      // auth el que falló: no hay nada que refrescar, sesión terminada.
      if (isAuthEndpoint) {
        authService.signOut();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return handleExpiredAccessToken(authReq, next, authService, router);
    }),
  );
};

function handleExpiredAccessToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshedToken$.next(null);

    return authService.refreshToken().pipe(
      switchMap((newToken) => {
        isRefreshing = false;
        refreshedToken$.next(newToken);
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
      }),
      catchError((refreshError: unknown) => {
        isRefreshing = false;
        authService.signOut();
        router.navigate(['/login']);
        return throwError(() => refreshError);
      }),
    );
  }

  // Ya hay un refresh en curso: esperar su resultado en vez de pedir otro.
  return refreshedToken$.pipe(
    filter((newToken): newToken is string => newToken !== null),
    take(1),
    switchMap((newToken) => next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))),
  );
}
