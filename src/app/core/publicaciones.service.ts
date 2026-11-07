import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type EstadoPublicacion = 'BORRADOR' | 'PENDIENTE_REVISION' | 'ACTIVA' | 'RECHAZADA' | 'INACTIVA';

export const ESTADO_TEXTO: Record<EstadoPublicacion, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  ACTIVA: 'Activa',
  RECHAZADA: 'Rechazada',
  INACTIVA: 'Inactiva',
};

/** Datos que ingresa el anfitrión. En borrador todos pueden ir incompletos. */
export interface DatosPublicacion {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  tipo: string;
  capacidad: number | null;
  precioNoche: number | null;
  servicios: string[];
  reglas: string[];
  imagenes: string[];
  politicaCancelacion: string;
}

export interface Publicacion extends DatosPublicacion {
  id: string;
  estado: EstadoPublicacion;
  actualizadaEn: string;
}

export interface TipoConfigurado {
  codigo: string;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);

  /** Publicaciones del anfitrión autenticado (el backend filtra por propietario). */
  misPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>('/api/publicaciones/mias');
  }

  /** Crea la publicación; el backend la deja en BORRADOR y la asigna al anfitrión del token. */
  crear(datos: DatosPublicacion): Observable<Publicacion> {
    return this.http.post<Publicacion>('/api/publicaciones', datos);
  }

  obtener(id: string): Observable<Publicacion> {
    return this.http.get<Publicacion>(`/api/publicaciones/${encodeURIComponent(id)}`);
  }

  /** Solo el propietario o un ADMINISTRADOR; el backend verifica la propiedad y responde 403 si no. */
  actualizar(id: string, datos: DatosPublicacion): Observable<Publicacion> {
    return this.http.put<Publicacion>(`/api/publicaciones/${encodeURIComponent(id)}`, datos);
  }

  /** Solo los tipos de alojamiento activos en la configuración. */
  tiposActivos(): Observable<TipoConfigurado[]> {
    return this.http.get<TipoConfigurado[]>('/api/configuracion/tipos-alojamiento', {
      params: { activos: true },
    });
  }
}
