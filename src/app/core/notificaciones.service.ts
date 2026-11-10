import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

/** Eventos que generan una notificación al usuario afectado (RF-24). */
export type TipoNotificacion =
  | 'RESERVA_CONFIRMADA'
  | 'PAGO_APROBADO'
  | 'CANCELACION'
  | 'DEVOLUCION'
  | 'DECISION_PUBLICACION';

export const TIPO_NOTIFICACION_TEXTO: Record<TipoNotificacion, string> = {
  RESERVA_CONFIRMADA: 'Reserva confirmada',
  PAGO_APROBADO: 'Pago aprobado',
  CANCELACION: 'Cancelación',
  DEVOLUCION: 'Devolución',
  DECISION_PUBLICACION: 'Publicación',
};

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  mensaje: string;
  fecha: string;
  leida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private http = inject(HttpClient);

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly noLeidas = computed(() => this.notificaciones().filter((n) => !n.leida).length);
  readonly cargando = signal(false);
  /** Si el servicio de notificaciones falla, solo se avisa en su pantalla: nada más se bloquea. */
  readonly error = signal(false);

  /** Las más recientes primero. El backend las entrega de forma asíncrona (outbox). */
  cargar() {
    this.cargando.set(true);
    this.http.get<Notificacion[]>('/api/notificaciones').subscribe({
      next: (lista) => {
        this.notificaciones.set([...lista].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        this.error.set(false);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  marcarLeida(id: string) {
    this.actualizarLocal((n) => (n.id === id ? { ...n, leida: true } : n));
    this.http.patch(`/api/notificaciones/${id}/leida`, {}).subscribe({ error: () => this.cargar() });
  }

  marcarTodas() {
    this.actualizarLocal((n) => ({ ...n, leida: true }));
    this.http.post('/api/notificaciones/marcar-leidas', {}).subscribe({ error: () => this.cargar() });
  }

  limpiar() {
    this.notificaciones.set([]);
    this.error.set(false);
  }

  private actualizarLocal(f: (n: Notificacion) => Notificacion) {
    this.notificaciones.update((l) => l.map(f));
  }
}
