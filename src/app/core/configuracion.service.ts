import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Parámetros de la cotización (en porcentaje), editables sin redesplegar. */
export interface Tarifas {
  tarifaServicio: number;
  tarifaLimpieza: number;
  descuentoPromocional: number;
  descuentoEstanciaLarga: number;
  /** Noches mínimas para aplicar el descuento por estancia larga. */
  nochesEstanciaLarga: number;
}

export interface ConfiguracionTarifas extends Tarifas {
  modificadoPor: string | null;
  modificadoEn: string | null;
}

export interface CambioConfiguracion {
  fecha: string;
  usuario: string;
  campo: keyof Tarifas;
  anterior: number;
  nuevo: number;
}

export const CAMPOS_TARIFA: { campo: keyof Tarifas; texto: string; unidad: string; max: number }[] = [
  { campo: 'tarifaServicio', texto: 'Tarifa de servicio', unidad: '%', max: 100 },
  { campo: 'tarifaLimpieza', texto: 'Tarifa de limpieza', unidad: '%', max: 100 },
  { campo: 'descuentoPromocional', texto: 'Descuento promocional', unidad: '%', max: 100 },
  { campo: 'descuentoEstanciaLarga', texto: 'Descuento por estancia larga', unidad: '%', max: 100 },
  { campo: 'nochesEstanciaLarga', texto: 'Noches para estancia larga', unidad: 'noches', max: 365 },
];

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);

  tarifas(): Observable<ConfiguracionTarifas> {
    return this.http.get<ConfiguracionTarifas>('/api/admin/configuracion/tarifas');
  }

  /**
   * Aplica a las cotizaciones nuevas (≤ 1 min); las reservas confirmadas conservan sus valores.
   * El backend registra cada cambio en auditoría (ej. "Tarifa de servicio 9 % → 10 %").
   */
  actualizarTarifas(t: Tarifas): Observable<ConfiguracionTarifas> {
    return this.http.put<ConfiguracionTarifas>('/api/admin/configuracion/tarifas', t);
  }

  historial(): Observable<CambioConfiguracion[]> {
    return this.http.get<CambioConfiguracion[]>('/api/admin/configuracion/tarifas/historial');
  }
}
