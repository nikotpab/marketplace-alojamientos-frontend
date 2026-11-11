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

/** EN_REVISION: la publicación fue bloqueada y la reserva queda en revisión manual. */
export type EstadoReserva = 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA' | 'EN_REVISION';

export const ESTADO_RESERVA_TEXTO: Record<EstadoReserva, string> = {
  CONFIRMADA: 'Confirmada',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
  EN_REVISION: 'En revisión manual',
};

/** Estado final de la cancelación según la devolución simulada (RF-23). */
export type EstadoFinalCancelacion = 'DEVOLUCION_PROCESADA' | 'DEVOLUCION_NO_PROCESADA' | 'SIN_DEVOLUCION';

/** Registro de la cancelación (POST /reservas/{id}/cancelacion). */
export interface Cancelacion {
  id: string;
  reservaId: string;
  usuarioId: string;
  fecha: string;
  motivo: string;
  valorDevolucion: number;
  estadoFinal: EstadoFinalCancelacion;
}

/** Reserva tal como la devuelve GET /reservas (ReservaVista del backend). */
export interface Reserva {
  id: string;
  codigo: string;
  estado: EstadoReserva;
  publicacionId: string;
  /** Título del alojamiento (no viene en la respuesta de confirmación). */
  alojamiento?: string;
  llegada: string;
  salida: string;
  huespedes: number;
  noches?: number;
  total: number;
  /**
   * Teléfono y correo del huésped (vista del anfitrión). El backend solo los envía si la reserva
   * está CONFIRMADA; en otro caso llega null.
   */
  contactoHuesped?: { telefono: string | null; correo: string | null } | null;
  /** Solo en el front: cancelación hecha en esta sesión (el historial no la trae). */
  cancelacion?: Cancelacion | null;
  /** Solo en el front: reseña publicada en esta sesión. */
  resenada?: boolean;
}

/** Devolución que se haría si el huésped cancela hoy. */
export interface EstimacionDevolucion {
  valorDevolucion: number;
  /** Nombre de la política de cancelación aplicada. */
  politica: string;
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private http = inject(HttpClient);

  /** Reservas del huésped autenticado (el backend filtra por el rol del token). */
  misReservas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas');
  }

  /** Reservas de los alojamientos del anfitrión autenticado (mismo endpoint, rol ANFITRION). */
  reservasAnfitrion(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>('/api/reservas');
  }

  /**
   * Confirmación inmediata. El backend vuelve a verificar que no haya superposición
   * y responde 409 ("periodo no disponible") si otra reserva tomó las fechas.
   *
   * `claveIdempotencia` identifica el intento de confirmación: si la misma solicitud llega
   * repetida (doble clic, reintento de red), el backend devuelve el resultado original sin
   * crear otra reserva ni otro cobro, y reenvía la misma clave a Stripe.
   *
   * `metodoPagoId` es el identificador (token) del método de pago de prueba de Stripe:
   * nunca se envían ni se guardan números de tarjeta. La reserva solo se crea si el pago
   * es aprobado; 402 = pago rechazado, 503 = pasarela no disponible (circuit breaker).
   */
  confirmar(s: SolicitudReserva, claveIdempotencia: string, metodoPagoId: string): Observable<Reserva> {
    return this.http.post<Reserva>('/api/reservas', { ...s, metodoPagoId }, {
      headers: new HttpHeaders({ 'Idempotency-Key': claveIdempotencia }),
    });
  }

  /** Calcula la devolución sin cancelar: el huésped la revisa antes de confirmar. */
  estimarDevolucion(id: string): Observable<EstimacionDevolucion> {
    return this.http.get<EstimacionDevolucion>(`/api/reservas/${encodeURIComponent(id)}/cancelacion/estimacion`);
  }

  /**
   * Cancela con motivo obligatorio. El backend aplica la política, deja la reserva CANCELADA,
   * libera el periodo y notifica. 409 si la política no tiene reglas o la reserva ya no se puede cancelar.
   */
  cancelar(id: string, motivo: string): Observable<Cancelacion> {
    return this.http.post<Cancelacion>(`/api/reservas/${encodeURIComponent(id)}/cancelacion`, { motivo });
  }
}
