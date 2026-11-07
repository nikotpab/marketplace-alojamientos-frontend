import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TipoAlojamiento } from './alojamientos.service';

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
  tipo: TipoAlojamiento;
  capacidad: number;
  precioNoche: number;
  servicios: string[];
  reglas: string[];
  politicaCancelacion: string;
  imagenes: string[];
  calificacionPromedio: number | null;
  resenas: Resena[];
  fechasNoDisponibles: string[]; // ISO yyyy-MM-dd
}

@Injectable({ providedIn: 'root' })
export class DetalleService {
  private http = inject(HttpClient);

  obtener(id: string): Observable<AlojamientoDetalle> {
    return this.http.get<AlojamientoDetalle>(`/api/alojamientos/${encodeURIComponent(id)}`);
  }
}
