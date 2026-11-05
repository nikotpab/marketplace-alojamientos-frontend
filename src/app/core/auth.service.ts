import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type Rol = 'HUESPED' | 'ANFITRION';

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: Rol;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly api = '/api';

  registrar(datos: RegistroRequest): Observable<unknown> {
    return this.http.post(`${this.api}/auth/register`, datos);
  }
}
