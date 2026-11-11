import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { EstadoReserva } from './reservas.service';

/** Indicadores del backend (GET /admin/dashboard). */
export interface Indicadores {
  desde: string;
  hasta: string;
  /** Total actual de usuarios. */
  usuarios: number;
  publicacionesActivas: number;
  reservasPorEstado: Partial<Record<EstadoReserva, number>>;
  /** Suma de las tarifas de servicio de reservas confirmadas y completadas del periodo (lo que gana la plataforma). */
  ingresosEstimados: number;
  /** Ciudades ordenadas de mayor a menor demanda. */
  ciudadesConMayorDemanda: string[];
}

/** Más de 10 s: se corta la espera para no afectar el resto de la plataforma (RNF-10). */
export const PLAZO_DASHBOARD_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class IndicadoresService {
  private http = inject(HttpClient);

  consultar(desde: string, hasta: string): Observable<Indicadores> {
    return this.http
      .get<Indicadores>('/api/admin/dashboard', { params: { desde, hasta } })
      .pipe(timeout(PLAZO_DASHBOARD_MS));
  }
}
