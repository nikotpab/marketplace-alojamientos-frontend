import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RolUsuario } from './auth.service';

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: RolUsuario;
  /** false si el propio usuario desactivó su cuenta. */
  activo: boolean;
  /** true si un administrador lo restringió: no puede iniciar sesión. */
  restringido: boolean;
  motivoRestriccion?: string | null;
  registradoEn: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private http = inject(HttpClient);

  listar(busqueda = ''): Observable<UsuarioAdmin[]> {
    let params = new HttpParams();
    if (busqueda.trim()) params = params.set('q', busqueda.trim());
    return this.http.get<UsuarioAdmin[]>('/api/admin/usuarios', { params });
  }

  /** Motivo obligatorio; el usuario no podrá iniciar sesión y queda registrado en auditoría. */
  restringir(id: string, motivo: string): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`/api/admin/usuarios/${encodeURIComponent(id)}/restringir`, { motivo });
  }

  levantarRestriccion(id: string): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`/api/admin/usuarios/${encodeURIComponent(id)}/levantar-restriccion`, {});
  }
}
