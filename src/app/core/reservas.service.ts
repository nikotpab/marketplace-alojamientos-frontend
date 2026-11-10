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

/** REVISION_MANUAL: la publicación fue bloqueada y la reserva queda pendiente de revisión. */
export type EstadoReserva = 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'REVISION_MANUAL';

export const ESTADO_RESERVA_TEXTO: Record<EstadoReserva, string> = {
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  REVISION_MANUAL: 'En revisión manual',
};

export interface Reserva {
  id: string;
  codigo: string;
  estado: EstadoReserva;
  publicacionId: string;
  llegada: string;
  salida: string;
  huespedes: number;
  total: number;
  /** Datos del alojamiento para mostrar en listados. */
  alojamiento?: { titulo: string; ciudad: string };
  /**
   * Datos del huésped (vista del anfitrión). El backend solo envía teléfono y correo
   * si la reserva está CONFIRMADA con ese anfitrión; en otro caso llegan nulos.
   */
  huesped?: { nombre: string; telefono: string | null; correo: string | null };
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private http = inject(HttpClient);

  /** Reservas del huésped autenticado. */
  misReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas/mias');
  }

  /** Reservas de los alojamientos del anfitrión autenticado. */
  reservasAnfitrion(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/anfitrion/reservas');
  }

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
