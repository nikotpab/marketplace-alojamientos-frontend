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

  /** Administrador: la reseña deja de mostrarse y de contar en el promedio. Queda en auditoría. */
  ocultar(resenaId: string): Observable<void> {
    return this.http.post<void>(`/api/admin/resenas/${encodeURIComponent(resenaId)}/ocultamiento`, {});
  }
}
