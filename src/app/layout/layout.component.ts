import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, RolUsuario } from '../core/auth.service';

interface Enlace {
  texto: string;
  ruta: string;
}

const ENLACES: Record<RolUsuario, Enlace[]> = {
  HUESPED: [
    { texto: 'Inicio', ruta: '/inicio' },
    { texto: 'Explorar', ruta: '/buscar' },
    { texto: 'Mi perfil', ruta: '/perfil' },
  ],
  ANFITRION: [
    { texto: 'Mis alojamientos', ruta: '/anfitrion' },
    { texto: 'Mi perfil', ruta: '/perfil' },
  ],
  ADMINISTRADOR: [
    { texto: 'Panel', ruta: '/admin' },
    { texto: 'Publicaciones', ruta: '/admin/publicaciones' },
    { texto: 'Revisión', ruta: '/admin/revision' },
    { texto: 'Configuración', ruta: '/admin/configuracion' },
    { texto: 'Mi perfil', ruta: '/perfil' },
  ],
};

const ENLACES_VISITANTE: Enlace[] = [{ texto: 'Explorar', ruta: '/buscar' }];

const ETIQUETA_ROL: Record<RolUsuario, string> = {
  HUESPED: 'Huésped',
  ANFITRION: 'Anfitrión',
  ADMINISTRADOR: 'Administrador',
};

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  enlaces = computed(() => {
    const u = this.auth.usuario();
    return u ? ENLACES[u.rol] : ENLACES_VISITANTE;
  });

  etiquetaRol = computed(() => {
    const u = this.auth.usuario();
    return u ? ETIQUETA_ROL[u.rol] : '';
  });

  iniciales = computed(() => {
    const nombre = this.auth.usuario()?.nombre ?? '';
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  });

  salir() {
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/auth');
  }
}
