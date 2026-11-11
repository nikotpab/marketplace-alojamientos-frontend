import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

/** Tipo del evento que originó la notificación (nombre del evento de dominio en el backend). */
export const TIPO_NOTIFICACION_TEXTO: Record<string, string> = {
  ReservaConfirmada: 'Reserva confirmada',
  ReservaCancelada: 'Cancelación',
  ReservaCompletada: 'Estadía completada',
  ReservaEnRevision: 'Reserva en revisión',
  DevolucionProcesada: 'Devolución',
  DevolucionFallida: 'Devolución no procesada',
  PublicacionAprobada: 'Publicación aprobada',
  PublicacionRechazada: 'Publicación rechazada',
  PublicacionBloqueada: 'Publicación bloqueada',
};

export interface Notificacion {
  id: string;
  tipo: string;
  mensaje: string;
  leida: boolean;
  creadoEn: string;
}

/** Respuesta de GET /notificaciones. */
interface Bandeja {
  noLeidas: number;
  notificaciones: Notificacion[];
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
    this.http.get<Bandeja>('/api/notificaciones').subscribe({
      next: (b) => {
        this.notificaciones.set([...b.notificaciones].sort((a, c) => c.creadoEn.localeCompare(a.creadoEn)));
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
    this.http.post(`/api/notificaciones/${id}/lectura`, {}).subscribe({ error: () => this.cargar() });
  }

  marcarTodas() {
    this.actualizarLocal((n) => ({ ...n, leida: true }));
    this.http.post('/api/notificaciones/lectura', {}).subscribe({ error: () => this.cargar() });
  }

  limpiar() {
    this.notificaciones.set([]);
    this.error.set(false);
  }

  private actualizarLocal(f: (n: Notificacion) => Notificacion) {
    this.notificaciones.update((l) => l.map(f));
  }
}
