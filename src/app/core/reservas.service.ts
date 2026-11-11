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

/** PROCESADA: devolución simulada registrada. NO_PROCESADA: falló; la reserva igual queda cancelada. */
export type EstadoDevolucion = 'PROCESADA' | 'NO_PROCESADA';

/** Registro de la cancelación y su devolución (trazabilidad, RF-23). */
export interface Cancelacion {
  motivo: string;
  fecha: string;
  /** Nombre de quien canceló. */
  canceladaPor: string;
  valorDevolucion: number;
  estadoDevolucion: EstadoDevolucion;
}

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
  /** Solo en reservas CANCELADAS. */
  cancelacion?: Cancelacion | null;
}

/** Valor que se devolvería si el huésped cancela hoy, según la política de la publicación. */
export interface PrevisualizacionCancelacion {
  /** Nombre de la política de cancelación (Flexible, Moderada, Estricta…). */
  politica: string;
  /** Regla aplicada hoy, ej. "100 % hasta 5 días antes de la llegada". */
  reglaAplicada: string;
  porcentajeDevolucion: number;
  totalPagado: number;
  /** Conceptos que no se devuelven (la tarifa de servicio no es reembolsable). */
  noReembolsable: number;
  valorDevolucion: number;
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
  previsualizarCancelacion(id: string): Observable<PrevisualizacionCancelacion> {
    return this.http.get<PrevisualizacionCancelacion>(`/api/reservas/${encodeURIComponent(id)}/cancelacion`);
  }

  /**
   * Cancela la reserva con motivo obligatorio. El backend aplica la política, deja la reserva
   * CANCELADA, libera el periodo y notifica al huésped y al anfitrión.
   */
  cancelar(id: string, motivo: string): Observable<Reserva> {
    return this.http.post<Reserva>(`/api/reservas/${encodeURIComponent(id)}/cancelar`, { motivo });
  }
}
