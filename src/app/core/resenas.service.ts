import { HttpClient } from '@angular/common/http';
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
}
