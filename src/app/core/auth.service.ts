import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export type Rol = 'HUESPED' | 'ANFITRION';
export type RolUsuario = Rol | 'ADMINISTRADOR';

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: Rol;
}

export interface LoginRequest {
  correo: string;
  contrasena: string;
}

export interface Perfil {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: RolUsuario;
  activo: boolean;
}

export type PerfilEditable = Pick<Perfil, 'nombre' | 'apellido' | 'telefono'>;

export interface RecuperacionResponse {
  token: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

const CLAVE_SESION = 'lr_sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly api = '/api';

  private sesion = signal<Sesion | null>(this.leerSesion());

  usuario = computed(() => this.sesion()?.usuario ?? null);
  token = computed(() => this.sesion()?.token ?? null);
  autenticado = computed(() => this.sesion() !== null);

  registrar(datos: RegistroRequest): Observable<unknown> {
    return this.http.post(`${this.api}/auth/register`, datos);
  }

  login(datos: LoginRequest): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.api}/auth/login`, datos)
      .pipe(tap((s) => this.guardarSesion(s)));
  }

  /** Perfil del usuario autenticado (el backend lo identifica por el token). */
  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.api}/usuarios/me`);
  }

  actualizarPerfil(datos: PerfilEditable): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.api}/usuarios/me`, datos);
  }

  /** Activa o desactiva la cuenta del usuario autenticado (queda en auditoría en el backend). */
  cambiarEstadoCuenta(activo: boolean): Observable<Perfil> {
    return this.http.patch<Perfil>(`${this.api}/usuarios/me/estado`, { activo });
  }

  /** Paso 1: solicita el procedimiento de recuperación (simulado, sin correo real). */
  solicitarRecuperacion(correo: string): Observable<RecuperacionResponse> {
    return this.http.post<RecuperacionResponse>(`${this.api}/auth/password/recover`, { correo });
  }

  /** Paso 2: define la nueva contraseña con el token del procedimiento. */
  restablecerContrasena(token: string, contrasenaNueva: string): Observable<unknown> {
    return this.http.post(`${this.api}/auth/password/reset`, { token, contrasenaNueva });
  }

  cerrarSesion() {
    this.sesion.set(null);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch {}
  }

  tieneRol(roles: RolUsuario[]): boolean {
    const u = this.usuario();
    return !!u && roles.includes(u.rol);
  }

  private guardarSesion(s: Sesion) {
    this.sesion.set(s);
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(s));
    } catch {}
  }

  private leerSesion(): Sesion | null {
    try {
      const raw = sessionStorage.getItem(CLAVE_SESION);
      return raw ? (JSON.parse(raw) as Sesion) : null;
    } catch {
      return null;
    }
  }
}
