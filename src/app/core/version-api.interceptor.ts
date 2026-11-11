import { HttpInterceptorFn } from '@angular/common/http';

/** Versión de la API publicada por el backend. */
export const VERSION_API = 'v1';

/**
 * Los servicios llaman a `/api/...`; aquí se agrega la versión (`/api/v1/...`). Así funciona igual
 * en desarrollo (proxy de Angular hacia localhost:8080) y en producción (Caddy reenvía `/api/*`
 * tal cual al backend), sin reescribir rutas en el proxy.
 */
export const versionApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/') || req.url.startsWith(`/api/${VERSION_API}/`)) return next(req);
  return next(req.clone({ url: `/api/${VERSION_API}/${req.url.slice('/api/'.length)}` }));
};
