import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TIPOS } from './alojamientos.service';

/** Tipo activo para formularios y filtros (GET /configuracion/tipos-alojamiento). */
export interface TipoActivo {
  codigo: string;
  nombre: string;
}

/** Tipo administrado como dato de configuración (RF-35), vista del administrador. */
export interface TipoAlojamientoConfig {
  id: string;
  nombre: string;
  activo: boolean;
}

/** Respaldo si la configuración no responde: los tipos iniciales del sistema. */
const RESPALDO: TipoActivo[] = TIPOS.map((t) => ({ codigo: t.valor, nombre: t.texto }));

@Injectable({ providedIn: 'root' })
export class TiposAlojamientoService {
  private http = inject(HttpClient);

  /** Tipos activos, compartidos por búsqueda, formularios y listados. */
  readonly activos = signal<TipoActivo[]>(RESPALDO);

  /** Se consulta en cada pantalla que los usa, así un tipo nuevo aparece sin reiniciar. */
  cargarActivos() {
    this.http
      .get<TipoActivo[]>('/api/configuracion/tipos-alojamiento')
      .subscribe({ next: (t) => this.activos.set(t), error: () => {} });
  }

  nombre(codigo: string) {
    return this.activos().find((t) => t.codigo === codigo)?.nombre ?? RESPALDO.find((t) => t.codigo === codigo)?.nombre ?? codigo;
  }

  // --- Administrador ---

  todos(): Observable<TipoAlojamientoConfig[]> {
    return this.http.get<TipoAlojamientoConfig[]>('/api/admin/tipos-alojamiento');
  }

  crear(nombre: string): Observable<TipoAlojamientoConfig> {
    return this.http
      .post<TipoAlojamientoConfig>('/api/admin/tipos-alojamiento', { nombre, activo: true })
      .pipe(tap(() => this.cargarActivos()));
  }

  /** El backend recibe siempre el nombre y el estado completos. */
  actualizar(t: TipoAlojamientoConfig, cambios: Partial<Pick<TipoAlojamientoConfig, 'nombre' | 'activo'>>): Observable<TipoAlojamientoConfig> {
    return this.http
      .put<TipoAlojamientoConfig>(`/api/admin/tipos-alojamiento/${encodeURIComponent(t.id)}`, {
        nombre: cambios.nombre ?? t.nombre,
        activo: cambios.activo ?? t.activo,
      })
      .pipe(tap(() => this.cargarActivos()));
  }
}
