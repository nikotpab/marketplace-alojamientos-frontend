import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const MAX_COMENTARIO = 1000;

export interface NuevaResena {
  calificacion: number;
  comentario: string;
}

export interface ResenaPublicada {
  id: string;
  reservaId: string;
  publicacionId: string;
  autor: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

/** Resumen público de reseñas; las ocultadas por un administrador no se incluyen ni cuentan. */
export interface ResumenResenas {
  promedio: number | null;
  total: number;
  /** Cantidad de reseñas por calificación (clave 1 a 5). */
  distribucion: Record<string, number>;
  resenas: ResenaPublicada[];
  pagina: number;
  totalPaginas: number;
}

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private http = inject(HttpClient);

  /**
   * Reseña de una reserva COMPLETADA del huésped autenticado. El backend valida la propiedad
   * y el estado (422) y admite una sola reseña por reserva (409).
   * El texto se guarda tal cual y siempre se muestra escapado (interpolación de Angular).
   */
  crear(reservaId: string, r: NuevaResena): Observable<ResenaPublicada> {
    return this.http.post<ResenaPublicada>(`/api/reservas/${encodeURIComponent(reservaId)}/resena`, r);
  }

  /** Reseñas visibles de una publicación, paginadas (más recientes primero). */
  dePublicacion(publicacionId: string, pagina = 0): Observable<ResumenResenas> {
    const params = new HttpParams().set('pagina', pagina).set('tamano', 10);
    return this.http.get<ResumenResenas>(`/api/alojamientos/${encodeURIComponent(publicacionId)}/resenas`, { params });
  }
}
