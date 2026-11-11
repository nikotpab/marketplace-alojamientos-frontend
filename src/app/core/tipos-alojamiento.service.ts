import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { TIPOS } from './alojamientos.service';

/** Tipo de alojamiento administrado como dato de configuración (RF-35). */
export interface TipoAlojamientoConfig {
  codigo: string;
  nombre: string;
  activo: boolean;
}

/** Respaldo si la configuración no responde: los tipos iniciales del sistema. */
const RESPALDO: TipoAlojamientoConfig[] = TIPOS.map((t) => ({ codigo: t.valor, nombre: t.texto, activo: true }));

@Injectable({ providedIn: 'root' })
export class TiposAlojamientoService {
  private http = inject(HttpClient);

  /** Tipos activos, compartidos por búsqueda, formularios y listados. */
  readonly activos = signal<TipoAlojamientoConfig[]>(RESPALDO);

  /** Se consulta en cada pantalla que los usa, así un tipo nuevo aparece sin reiniciar. */
  cargarActivos() {
    this.http
      .get<TipoAlojamientoConfig[]>('/api/configuracion/tipos-alojamiento', { params: { activos: true } })
      .subscribe({ next: (t) => this.activos.set(t), error: () => {} });
  }

  nombre(codigo: string) {
    return this.activos().find((t) => t.codigo === codigo)?.nombre ?? RESPALDO.find((t) => t.codigo === codigo)?.nombre ?? codigo;
  }

  // --- Administrador ---

  todos(): Observable<TipoAlojamientoConfig[]> {
    return this.http.get<TipoAlojamientoConfig[]>('/api/admin/tipos-alojamiento');
  }

  /** El backend genera el código a partir del nombre y responde 409 si ya existe. */
  crear(nombre: string): Observable<TipoAlojamientoConfig> {
    return this.http.post<TipoAlojamientoConfig>('/api/admin/tipos-alojamiento', { nombre }).pipe(tap(() => this.cargarActivos()));
  }

  actualizar(codigo: string, cambios: Partial<Pick<TipoAlojamientoConfig, 'nombre' | 'activo'>>): Observable<TipoAlojamientoConfig> {
    return this.http
      .patch<TipoAlojamientoConfig>(`/api/admin/tipos-alojamiento/${encodeURIComponent(codigo)}`, cambios)
      .pipe(tap(() => this.cargarActivos()));
  }
}
