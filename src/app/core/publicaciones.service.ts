import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type EstadoPublicacion = 'BORRADOR' | 'PENDIENTE_REVISION' | 'ACTIVA' | 'PAUSADA' | 'BLOQUEADA';

export const ESTADO_TEXTO: Record<EstadoPublicacion, string> = {
  BORRADOR: 'Borrador',
  PENDIENTE_REVISION: 'Pendiente de revisión',
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  BLOQUEADA: 'Bloqueada',
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
  /** Motivo del último rechazo del administrador (la publicación vuelve a BORRADOR). */
  motivoRechazo?: string | null;
  /** Motivo del bloqueo administrativo (solo en BLOQUEADA). */
  motivoBloqueo?: string | null;
  /** Nombre del anfitrión propietario (visible para el administrador). */
  anfitrion?: string;
}

/** Catálogos del backend (GET /catalogos) para los formularios. */
export interface Catalogos {
  tipos: { id: string; nombre: string; activo: boolean }[];
  servicios: { id: string; nombre: string }[];
  /** Políticas de cancelación ofrecidas. La devolución se calcula según la elegida. */
  politicas: { id: string; nombre: string }[];
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

  /**
   * Pide pasar de BORRADOR a PENDIENTE_REVISION. El backend vuelve a validar y, si falta algo,
   * responde 422 con { errores: { campo: mensaje } } y la publicación sigue en BORRADOR.
   */
  solicitarActivacion(id: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`/api/publicaciones/${encodeURIComponent(id)}/solicitar-activacion`, {});
  }

  /** ACTIVA → PAUSADA: deja de aparecer en búsquedas y de recibir reservas. */
  pausar(id: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`/api/publicaciones/${encodeURIComponent(id)}/pausar`, {});
  }

  /** PAUSADA → ACTIVA. Una BLOQUEADA solo la reactiva un administrador (el backend responde 403/409). */
  reactivar(id: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`/api/publicaciones/${encodeURIComponent(id)}/reactivar`, {});
  }

  // --- Administrador ---

  /** Todas las publicaciones (solo ADMINISTRADOR); opcionalmente filtradas por estado. */
  todas(estado?: EstadoPublicacion): Observable<Publicacion[]> {
    const params: Record<string, string> = {};
    if (estado) params['estado'] = estado;
    return this.http.get<Publicacion[]>('/api/admin/publicaciones', { params });
  }

  pendientesDeRevision(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>('/api/admin/publicaciones', { params: { estado: 'PENDIENTE_REVISION' } });
  }

  /** Pasa a ACTIVA y notifica al anfitrión. 403 si no es ADMINISTRADOR. */
  aprobar(id: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`/api/admin/publicaciones/${encodeURIComponent(id)}/aprobar`, {});
  }

  /** Vuelve a BORRADOR con motivo obligatorio y notifica al anfitrión. */
  rechazar(id: string, motivo: string): Observable<Publicacion> {
    return this.http.post<Publicacion>(`/api/admin/publicaciones/${encodeURIComponent(id)}/rechazar`, { motivo });
  }

  /**
   * Bloquea por información engañosa (204): pasa a BLOQUEADA, sale de las búsquedas, sus reservas
   * futuras quedan EN_REVISION, se registra en auditoría y se notifica al anfitrión.
   * El backend todavía no permite reactivar una publicación bloqueada (pendiente 10 de su README).
   */
  bloquear(id: string, motivo: string): Observable<void> {
    return this.http.post<void>(`/api/admin/publicaciones/${encodeURIComponent(id)}/bloqueo`, { motivo });
  }

  /** Solo los tipos de alojamiento activos en la configuración. */
  tiposActivos(): Observable<TipoConfigurado[]> {
    return this.http.get<TipoConfigurado[]>('/api/configuracion/tipos-alojamiento', {
      params: { activos: true },
    });
  }

  catalogos(): Observable<Catalogos> {
    return this.http.get<Catalogos>('/api/catalogos');
  }
}
