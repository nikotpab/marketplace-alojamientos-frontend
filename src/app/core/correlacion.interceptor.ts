import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LogService } from './log.service';

export const CABECERA_CORRELACION = 'X-Correlation-Id';

/** Clasifica la petición por módulo para filtrar los logs por tipo de evento. */
function tipoEvento(url: string): string {
  if (url.includes('/auth/')) return 'AUTENTICACION';
  if (url.includes('/admin/')) return 'ADMINISTRACION';
  if (url.includes('/cancelar')) return 'CANCELACION';
  if (url.includes('/resena')) return 'RESENA';
  if (url.includes('/reservas')) return 'RESERVA';
  if (url.includes('/publicaciones')) return 'PUBLICACION';
  return 'API';
}

/**
 * Asigna un correlationId a cada llamada a la API y registra los errores en JSON con ese
 * identificador (sin cuerpo de la petición: puede contener datos personales).
 */
export const correlacionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const log = inject(LogService);
  const id = req.headers.get(CABECERA_CORRELACION) ?? crypto.randomUUID();
  const inicio = performance.now();

  return next(req.clone({ setHeaders: { [CABECERA_CORRELACION]: id } })).pipe(
    catchError((e: HttpErrorResponse) => {
      log.registrar(
        e.status >= 500 || e.status === 0 ? 'ERROR' : 'WARN',
        'HTTP_ERROR',
        {
          tipoEvento: tipoEvento(req.url),
          metodo: req.method,
          url: req.urlWithParams,
          estado: e.status,
          codigo: (e.error as { codigo?: string } | null)?.codigo ?? null,
          duracionMs: Math.round(performance.now() - inicio),
        },
        e.headers?.get(CABECERA_CORRELACION) ?? id,
      );
      return throwError(() => e);
    }),
  );
};
