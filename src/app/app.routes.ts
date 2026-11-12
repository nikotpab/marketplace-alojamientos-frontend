import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { BusquedaComponent } from './pages/busqueda/busqueda.component';
import { rolGuard } from './core/auth.guard';

/**
 * Cada pantalla se carga bajo demanda (loadComponent): el bundle inicial solo trae el layout y Explorar,
 * y las pantallas de anfitrión y administrador llegan cuando alguien con ese rol las abre.
 */
export const routes: Routes = [
  { path: 'auth', loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent) },
  { path: 'recuperar', loadComponent: () => import('./pages/recuperar/recuperar.component').then((m) => m.RecuperarComponent) },
  { path: 'verificar-correo', loadComponent: () => import('./pages/verificar-correo/verificar-correo.component').then((m) => m.VerificarCorreoComponent) },
  { path: 'acceso-denegado', loadComponent: () => import('./pages/acceso-denegado/acceso-denegado.component').then((m) => m.AccesoDenegadoComponent) },

  // Rutas protegidas dentro del layout: cada una declara los roles permitidos (sin roles = denegada)
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Públicas: se puede explorar sin cuenta
      { path: '', pathMatch: 'full', redirectTo: 'buscar' },
      // Explorar es la página de inicio: se carga con el bundle inicial para no esperar un segundo pedido (mejor LCP)
      { path: 'buscar', component: BusquedaComponent },
      { path: 'alojamientos/:id', loadComponent: () => import('./pages/detalle/detalle.component').then((m) => m.DetalleComponent) },

      {
        path: 'reservas',
        loadComponent: () => import('./pages/reservas/mis-reservas.component').then((m) => m.MisReservasComponent),
        canActivate: [rolGuard],
        data: { roles: ['HUESPED'] },
      },
      {
        path: 'anfitrion/reservas',
        loadComponent: () => import('./pages/anfitrion/reservas/reservas-anfitrion.component').then((m) => m.ReservasAnfitrionComponent),
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Cotizar y reservar requiere sesión de huésped
        path: 'alojamientos/:id/cotizar',
        loadComponent: () => import('./pages/cotizacion/cotizacion.component').then((m) => m.CotizacionComponent),
        canActivate: [rolGuard],
        data: { roles: ['HUESPED'] },
      },

      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent),
        canActivate: [rolGuard],
        data: { roles: ['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
        canActivate: [rolGuard],
        data: { roles: ['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] },
      },
      // /inicio era una página de relleno: se conserva el enlace antiguo redirigiendo a Explorar
      { path: 'inicio', redirectTo: 'buscar' },
      {
        path: 'anfitrion',
        loadComponent: () => import('./pages/anfitrion/mis-publicaciones/mis-publicaciones.component').then((m) => m.MisPublicacionesComponent),
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        path: 'anfitrion/publicaciones/nueva',
        loadComponent: () => import('./pages/anfitrion/publicacion-form/publicacion-form.component').then((m) => m.PublicacionFormComponent),
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Solo el anfitrión propietario; la propiedad la verifica el backend (403)
        path: 'anfitrion/publicaciones/:id/disponibilidad',
        loadComponent: () => import('./pages/anfitrion/disponibilidad/disponibilidad.component').then((m) => m.DisponibilidadComponent),
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Propietario o administrador; la propiedad la verifica el backend (403 si no corresponde)
        path: 'anfitrion/publicaciones/:id/editar',
        loadComponent: () => import('./pages/anfitrion/publicacion-form/publicacion-form.component').then((m) => m.PublicacionFormComponent),
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/publicaciones',
        loadComponent: () => import('./pages/admin/publicaciones/todas-publicaciones.component').then((m) => m.TodasPublicacionesComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/revision',
        loadComponent: () => import('./pages/admin/revision/revision.component').then((m) => m.RevisionComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/moderacion',
        loadComponent: () => import('./pages/admin/moderacion/moderacion.component').then((m) => m.ModeracionComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/auditoria',
        loadComponent: () => import('./pages/admin/auditoria/auditoria.component').then((m) => m.AuditoriaComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/tipos-alojamiento',
        loadComponent: () => import('./pages/admin/tipos/tipos.component').then((m) => m.TiposComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/reportes',
        loadComponent: () => import('./pages/admin/reportes/reportes.component').then((m) => m.ReportesComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/configuracion',
        loadComponent: () => import('./pages/admin/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent),
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
    ],
  },

  { path: '**', redirectTo: 'buscar' },
];
