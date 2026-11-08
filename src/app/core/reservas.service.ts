import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface SolicitudReserva {
  publicacionId: string;
  llegada: string;
  salida: string;
  huespedes: number;
  adicionales: string[];
}

export interface Reserva {
  id: string;
  codigo: string;
  estado: 'CONFIRMADA' | 'CANCELADA';
  publicacionId: string;
  llegada: string;
  salida: string;
  huespedes: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private http = inject(HttpClient);

  /**
   * Confirmación inmediata. El backend vuelve a verificar que no haya superposición
   * y responde 409 ("periodo no disponible") si otra reserva tomó las fechas.
   *
   * `claveIdempotencia` identifica el intento de confirmación: si la misma solicitud llega
   * repetida (doble clic, reintento de red), el backend devuelve el resultado original sin
   * crear otra reserva ni otro cobro, y reenvía la misma clave a Stripe.
   */
  confirmar(s: SolicitudReserva, claveIdempotencia: string): Observable<Reserva> {
    return this.http.post<Reserva>('/api/reservas', s, {
      headers: new HttpHeaders({ 'Idempotency-Key': claveIdempotencia }),
    });
  }
}
