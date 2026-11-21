import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const MAX_COMENTARIO = 1000;

export interface NuevaResena {
  calificacion: number;
  /** Texto de la reseña; el backend lo recibe como `contenido`. */
  contenido: string;
}

/** Reseña visible de una publicación (ResenaVisible del backend). */
export interface ResenaVisible {
  id: string;
  autor: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

/** SCRUM-111 · RF-29: motivos con que se reporta una reseña (MotivoReporte del backend). */
export type MotivoReporte = 'OFENSIVA' | 'SPAM' | 'INFORMACION_FALSA' | 'OTRO';

export const MOTIVO_REPORTE_TEXTO: Record<MotivoReporte, string> = {
  OFENSIVA: 'Ofensiva o irrespetuosa',
  SPAM: 'Spam o publicidad',
  INFORMACION_FALSA: 'Información falsa',
  OTRO: 'Otro motivo',
};

export const MAX_COMENTARIO_REPORTE = 500;

/** Reseña visible que alguien reportó (ResenaConReportes del backend), para Moderación. */
export interface ResenaReportada extends ResenaVisible {
  publicacionId: string;
  reportes: number;
  motivos: MotivoReporte[];
  ultimoReporte: string;
}

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private http = inject(HttpClient);

  /**
   * Reseña de una reserva COMPLETADA del huésped autenticado. El backend valida la propiedad
   * y el estado, y admite una sola reseña por reserva (409).
   * El texto siempre se muestra escapado (interpolación de Angular).
   */
  crear(reservaId: string, r: NuevaResena): Observable<ResenaVisible> {
    return this.http.post<ResenaVisible>(`/api/reservas/${encodeURIComponent(reservaId)}/resena`, r);
  }

  /** Reseñas visibles de una publicación; las ocultadas por un administrador no llegan. */
  dePublicacion(publicacionId: string): Observable<ResenaVisible[]> {
    return this.http.get<ResenaVisible[]>(`/api/publicaciones/${encodeURIComponent(publicacionId)}/resenas`);
  }

  /**
   * SCRUM-111 (204): cualquier usuario con sesión, una vez por reseña y nunca la propia (409 con el
   * mensaje del backend). Queda en auditoría.
   */
  reportar(resenaId: string, motivo: MotivoReporte, comentario?: string): Observable<void> {
    return this.http.post<void>(`/api/resenas/${encodeURIComponent(resenaId)}/reportes`, { motivo, comentario: comentario || undefined });
  }

  /** Administrador: las reseñas visibles reportadas, de la más reportada a la menos. */
  reportadas(): Observable<ResenaReportada[]> {
    return this.http.get<ResenaReportada[]>('/api/admin/resenas/reportadas');
  }

  /** Administrador: la reseña deja de mostrarse y de contar en el promedio. Queda en auditoría. */
  ocultar(resenaId: string): Observable<void> {
    return this.http.post<void>(`/api/admin/resenas/${encodeURIComponent(resenaId)}/ocultamiento`, {});
  }
}
