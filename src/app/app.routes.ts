import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado.component';
import { RecuperarComponent } from './pages/recuperar/recuperar.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { BusquedaComponent } from './pages/busqueda/busqueda.component';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { MisPublicacionesComponent } from './pages/anfitrion/mis-publicaciones/mis-publicaciones.component';
import { PublicacionFormComponent } from './pages/anfitrion/publicacion-form/publicacion-form.component';
import { RevisionComponent } from './pages/admin/revision/revision.component';
import { TodasPublicacionesComponent } from './pages/admin/publicaciones/todas-publicaciones.component';
import { DisponibilidadComponent } from './pages/anfitrion/disponibilidad/disponibilidad.component';
import { CotizacionComponent } from './pages/cotizacion/cotizacion.component';
import { MisReservasComponent } from './pages/reservas/mis-reservas.component';
import { ReservasAnfitrionComponent } from './pages/anfitrion/reservas/reservas-anfitrion.component';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones.component';
import { UsuariosComponent } from './pages/admin/usuarios/usuarios.component';
import { ModeracionComponent } from './pages/admin/moderacion/moderacion.component';
import { AuditoriaComponent } from './pages/admin/auditoria/auditoria.component';
import { ConfiguracionComponent } from './pages/admin/configuracion/configuracion.component';
import { TiposComponent } from './pages/admin/tipos/tipos.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ReportesComponent } from './pages/admin/reportes/reportes.component';
import { VerificarCorreoComponent } from './pages/verificar-correo/verificar-correo.component';
import { LayoutComponent } from './layout/layout.component';
import { rolGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent, title: 'Iniciar sesión' },
  { path: 'recuperar', component: RecuperarComponent, title: 'Recuperar contraseña' },
  { path: 'verificar-correo', component: VerificarCorreoComponent, title: 'Verificar correo' },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent, title: 'Acceso denegado' },

  // Rutas protegidas dentro del layout: cada una declara los roles permitidos (sin roles = denegada)
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Públicas: se puede explorar sin cuenta
      { path: '', pathMatch: 'full', redirectTo: 'buscar' },
      { path: 'buscar', component: BusquedaComponent, title: 'Explorar alojamientos' },
      { path: 'alojamientos/:id', component: DetalleComponent, title: 'Detalle del alojamiento' },

      {
        path: 'reservas',
        component: MisReservasComponent,
        title: 'Mis reservas',
        canActivate: [rolGuard],
        data: { roles: ['HUESPED'] },
      },
      {
        path: 'anfitrion/reservas',
        component: ReservasAnfitrionComponent,
        title: 'Reservas de mis alojamientos',
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Cotizar y reservar requiere sesión de huésped
        path: 'alojamientos/:id/cotizar',
        component: CotizacionComponent,
        title: 'Cotización y pago',
        canActivate: [rolGuard],
        data: { roles: ['HUESPED'] },
      },

      {
        path: 'notificaciones',
        component: NotificacionesComponent,
        title: 'Notificaciones',
        canActivate: [rolGuard],
        data: { roles: ['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'perfil',
        component: PerfilComponent,
        title: 'Mi perfil',
        canActivate: [rolGuard],
        data: { roles: ['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] },
      },
      // /inicio era una página de relleno: se conserva el enlace antiguo redirigiendo a Explorar
      { path: 'inicio', redirectTo: 'buscar' },
      {
        path: 'anfitrion',
        component: MisPublicacionesComponent,
        title: 'Mis alojamientos',
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        path: 'anfitrion/publicaciones/nueva',
        component: PublicacionFormComponent,
        title: 'Nueva publicación',
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Solo el anfitrión propietario; la propiedad la verifica el backend (403)
        path: 'anfitrion/publicaciones/:id/disponibilidad',
        component: DisponibilidadComponent,
        title: 'Disponibilidad',
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Propietario o administrador; la propiedad la verifica el backend (403 si no corresponde)
        path: 'anfitrion/publicaciones/:id/editar',
        component: PublicacionFormComponent,
        title: 'Editar publicación',
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'admin',
        component: DashboardComponent,
        title: 'Panel de administración',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/publicaciones',
        component: TodasPublicacionesComponent,
        title: 'Publicaciones',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/revision',
        component: RevisionComponent,
        title: 'Revisión de publicaciones',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/usuarios',
        component: UsuariosComponent,
        title: 'Usuarios',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/moderacion',
        component: ModeracionComponent,
        title: 'Moderación',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/auditoria',
        component: AuditoriaComponent,
        title: 'Auditoría',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/tipos-alojamiento',
        component: TiposComponent,
        title: 'Tipos de alojamiento',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/reportes',
        component: ReportesComponent,
        title: 'Reportes',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/configuracion',
        component: ConfiguracionComponent,
        title: 'Configuración',
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
    ],
  },

  { path: '**', redirectTo: 'buscar' },
];
