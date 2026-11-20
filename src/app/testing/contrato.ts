import { HttpInterceptorFn } from '@angular/common/http';
import openapi from '../../contract/openapi.json';

const paths = openapi.paths as Record<string, Record<string, unknown>>;

/**
 * Comprueba que el método HTTP y la URL existen en el contrato OpenAPI del backend.
 * - Elimina la query string antes de comparar.
 * - Convierte /api/x a /api/v1/x (el versionApiInterceptor hace esto en producción).
 * - Compara la ruta contra las plantillas del OpenAPI reemplazando {param} por [^/]+.
 */
export function existeOperacion(metodo: string, url: string): boolean {
  const sinQuery = url.split('?')[0];
  const versionada = /^\/api(?!\/v\d)/.test(sinQuery)
    ? sinQuery.replace('/api', '/api/v1')
    : sinQuery;

  const m = metodo.toLowerCase();

  if (paths[versionada]?.[m]) return true;

  for (const template of Object.keys(paths)) {
    if (!paths[template][m]) continue;
    const regex = new RegExp(
      '^' + template.replace(/\{[^}]+\}/g, '[^/]+') + '$'
    );
    if (regex.test(versionada)) return true;
  }

  return false;
}

/**
 * Interceptor de pruebas: valida cada petición contra el contrato OpenAPI.
 * No modifica la petición; solo lanza un error si la operación no existe.
 * Debe ir ANTES de versionApiInterceptor para que las URLs lleguen sin /v1/.
 */
export const verificarContratoInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api')) {
    if (!existeOperacion(req.method, req.url)) {
      throw new Error(
        `El backend no define ${req.method} ${req.url.split('?')[0]} en el contrato`
      );
    }
  }
  return next(req);
};
