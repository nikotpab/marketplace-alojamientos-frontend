import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Fechas ISO (yyyy-MM-dd) por estado. Las no listadas están disponibles. */
export interface Disponibilidad {
  bloqueados: string[];
  reservados: string[];
}

export type EstadoPeriodo = 'DISPONIBLE' | 'BLOQUEADO';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private http = inject(HttpClient);

  consultar(publicacionId: string, desde: string, hasta: string): Observable<Disponibilidad> {
    return this.http.get<Disponibilidad>(
      `/api/publicaciones/${encodeURIComponent(publicacionId)}/disponibilidad`,
      { params: { desde, hasta } },
    );
  }

  /**
   * Marca un rango como disponible o bloqueado. Solo el anfitrión propietario (403 si no);
   * el backend rechaza (409) si el rango incluye días con reservas confirmadas.
   */
  actualizar(publicacionId: string, desde: string, hasta: string, estado: EstadoPeriodo): Observable<Disponibilidad> {
    return this.http.put<Disponibilidad>(
      `/api/publicaciones/${encodeURIComponent(publicacionId)}/disponibilidad`,
      { desde, hasta, estado },
    );
  }
}
