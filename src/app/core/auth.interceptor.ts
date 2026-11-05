import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((e) => {
      const esAuth = req.url.includes('/auth/');
      if (e.status === 403 && !esAuth) router.navigateByUrl('/acceso-denegado');
      if (e.status === 401 && !esAuth) {
        auth.cerrarSesion();
        router.navigateByUrl('/auth');
      }
      return throwError(() => e);
    }),
  );
};
