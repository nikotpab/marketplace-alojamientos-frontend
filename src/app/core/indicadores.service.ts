import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, timeout } from 'rxjs';
import { EstadoReserva } from './reservas.service';

export interface Indicadores {
  usuarios: { total: number; huespedes: number; anfitriones: number };
  publicacionesActivas: number;
  reservasPorEstado: Partial<Record<EstadoReserva, number>>;
  /** Suma de reservas confirmadas y completadas del periodo, en COP. */
  ingresosEstimados: number;
  ciudadesDemanda: { ciudad: string; reservas: number }[];
}

/** Más de 10 s: se corta la espera para no afectar el resto de la plataforma (RNF-10). */
export const PLAZO_DASHBOARD_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class IndicadoresService {
  private http = inject(HttpClient);

  consultar(desde: string, hasta: string): Observable<Indicadores> {
    return this.http
      .get<Indicadores>('/api/admin/indicadores', { params: { desde, hasta } })
      .pipe(timeout(PLAZO_DASHBOARD_MS));
  }
}
