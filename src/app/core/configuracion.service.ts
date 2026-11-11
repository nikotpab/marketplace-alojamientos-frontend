import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuditoriaService } from './auditoria.service';

/** ConfiguracionTarifas del backend: porcentajes de la cotización, editables sin redesplegar. */
export interface Tarifas {
  porcentajeServicio: number;
  porcentajeLimpieza: number;
  porcentajeDescuento: number;
  porcentajeDescuentoEstanciaLarga: number;
  /** Noches mínimas para aplicar el descuento por estancia larga. */
  nochesEstanciaLarga: number;
}

/** Un cambio de tarifas leído de la auditoría (evento TarifasActualizadas). */
export interface CambioTarifas {
  fecha: string;
  usuario: string;
  /** Ej. { "Tarifa de servicio": "9 % → 10 %" } (solo lo que cambió). */
  cambios: Record<string, unknown>;
}

export const CAMPOS_TARIFA: { campo: keyof Tarifas; texto: string; unidad: string; min: number; max: number }[] = [
  { campo: 'porcentajeServicio', texto: 'Tarifa de servicio', unidad: '%', min: 0, max: 100 },
  { campo: 'porcentajeLimpieza', texto: 'Tarifa de limpieza', unidad: '%', min: 0, max: 100 },
  { campo: 'porcentajeDescuento', texto: 'Descuento promocional', unidad: '%', min: 0, max: 100 },
  { campo: 'porcentajeDescuentoEstanciaLarga', texto: 'Descuento por estancia larga', unidad: '%', min: 0, max: 100 },
  { campo: 'nochesEstanciaLarga', texto: 'Noches para estancia larga', unidad: 'noches', min: 1, max: 365 },
];

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private auditoria = inject(AuditoriaService);

  tarifas(): Observable<Tarifas> {
    return this.http.get<Tarifas>('/api/admin/tarifas');
  }

  /**
   * 204. Aplica a las cotizaciones nuevas de inmediato; las reservas confirmadas conservan sus valores.
   * El backend registra el cambio en auditoría como TarifasActualizadas.
   */
  actualizarTarifas(t: Tarifas): Observable<void> {
    return this.http.put<void>('/api/admin/tarifas', t);
  }

  /** El historial de cambios es la auditoría filtrada por TarifasActualizadas (más reciente primero). */
  historial(): Observable<CambioTarifas[]> {
    return this.auditoria.consultar({ accion: 'TarifasActualizadas' }).pipe(
      map((eventos) =>
        eventos
          .map((e) => ({ fecha: e.fecha, usuario: e.actor ?? '—', cambios: e.detalle ?? {} }))
          .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      ),
    );
  }
}
