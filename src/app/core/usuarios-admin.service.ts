import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RolUsuario } from './auth.service';

/** UsuarioResumen del backend (GET /admin/usuarios). */
export interface UsuarioAdmin {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
  /** false si el propio usuario desactivó su cuenta. */
  cuentaActiva: boolean;
  /** true si un administrador lo restringió: no puede iniciar sesión. */
  restringido: boolean;
  correoVerificado: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuariosAdminService {
  private http = inject(HttpClient);

  /** Todos los usuarios; la búsqueda se filtra en el front. */
  listar(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>('/api/admin/usuarios');
  }

  /**
   * Motivo obligatorio (204); el usuario no podrá iniciar sesión y queda en auditoría.
   * El backend aún no permite levantar la restricción.
   */
  restringir(id: string, motivo: string): Observable<void> {
    return this.http.post<void>(`/api/admin/usuarios/${encodeURIComponent(id)}/restriccion`, { motivo });
  }
}
