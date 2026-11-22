import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Resena {
  id: string;
  autor: string;
  calificacion: number;
  comentario: string;
  fecha: string;
}

export interface AlojamientoDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  ciudad: string;
  direccion: string;
  tipo: string;
  capacidad: number;
  precioNoche: number;
  servicios: string[];
  reglas: string[];
  politicaCancelacion: string;
  imagenes: string[];
  calificacionPromedio: number | null;
  resenas: Resena[];
  /** Estado de la publicación; el calendario y la reserva solo aplican a ACTIVA. */
  estado: string;
}

@Injectable({ providedIn: 'root' })
export class DetalleService {
  private readonly http = inject(HttpClient);

  obtener(id: string): Observable<AlojamientoDetalle> {
    return this.http.get<AlojamientoDetalle>(`/api/alojamientos/${encodeURIComponent(id)}`);
  }
}
