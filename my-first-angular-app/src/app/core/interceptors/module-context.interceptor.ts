import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Adjunta X-Module-Code a toda request tomando el primer segmento de la URL
 * activa (ej. '/roles/5' -> 'roles', '/admin' -> 'admin'). Ninguna pantalla,
 * ruta o servicio lo declara: viaja siempre, para cualquier módulo presente
 * o futuro, porque se deriva directo de dónde está parado el usuario.
 */
export const moduleContextInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const firstSegment = router.url.split('?')[0].split('/')[1];

  if (!firstSegment) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'X-Module-Code': firstSegment } }));
};
