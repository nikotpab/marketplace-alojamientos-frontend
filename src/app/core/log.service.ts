import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export type NivelLog = 'INFO' | 'WARN' | 'ERROR';

/** Claves cuyo valor nunca se registra. */
const CLAVES_SENSIBLES = /contrasena|password|token|authorization|tarjeta|card|cvc|cvv|numero|secret/i;
/** JWT o secuencias de 13 a 19 dígitos (números de tarjeta) dentro de textos. */
const JWT = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const PAN = /\b(?:\d[ -]?){13,19}\b/g;

/** Enmascara recursivamente datos sensibles antes de registrarlos (RNF-25). */
export function enmascarar(valor: unknown, profundidad = 0): unknown {
  if (profundidad > 5) return '[…]';
  if (typeof valor === 'string') return valor.replace(JWT, '[TOKEN]').replace(PAN, '[TARJETA]');
  if (Array.isArray(valor)) return valor.map((v) => enmascarar(v, profundidad + 1));
  if (valor && typeof valor === 'object') {
    const r: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor)) r[k] = CLAVES_SENSIBLES.test(k) ? '[OCULTO]' : enmascarar(v, profundidad + 1);
    return r;
  }
  return valor;
}

/**
 * Logs estructurados del front en JSON (una línea por evento) con correlationId, para cruzarlos
 * con los logs del backend, que recibe el mismo identificador en el encabezado X-Correlation-Id.
 */
@Injectable({ providedIn: 'root' })
export class LogService {
  private auth = inject(AuthService);

  registrar(nivel: NivelLog, evento: string, datos: Record<string, unknown> = {}, correlationId?: string) {
    const entrada = {
      timestamp: new Date().toISOString(),
      nivel,
      evento,
      correlationId: correlationId ?? null,
      usuarioId: this.auth.usuario()?.id ?? null,
      rol: this.auth.usuario()?.rol ?? null,
      ruta: typeof location !== 'undefined' ? location.pathname : null,
      ...(enmascarar(datos) as Record<string, unknown>),
    };
    const linea = JSON.stringify(entrada);
    if (nivel === 'ERROR') console.error(linea);
    else if (nivel === 'WARN') console.warn(linea);
    else console.info(linea);
  }
}
