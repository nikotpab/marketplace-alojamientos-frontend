import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado.component';
import { RecuperarComponent } from './pages/recuperar/recuperar.component';
import { PanelComponent } from './pages/panel/panel.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { BusquedaComponent } from './pages/busqueda/busqueda.component';
import { DetalleComponent } from './pages/detalle/detalle.component';
import { MisPublicacionesComponent } from './pages/anfitrion/mis-publicaciones/mis-publicaciones.component';
import { PublicacionFormComponent } from './pages/anfitrion/publicacion-form/publicacion-form.component';
import { RevisionComponent } from './pages/admin/revision/revision.component';
import { TodasPublicacionesComponent } from './pages/admin/publicaciones/todas-publicaciones.component';
import { DisponibilidadComponent } from './pages/anfitrion/disponibilidad/disponibilidad.component';
import { LayoutComponent } from './layout/layout.component';
import { rolGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'recuperar', component: RecuperarComponent },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },

  // Rutas protegidas dentro del layout: cada una declara los roles permitidos (sin roles = denegada)
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Públicas: se puede explorar sin cuenta
      { path: 'buscar', component: BusquedaComponent },
      { path: 'alojamientos/:id', component: DetalleComponent },

      {
        path: 'perfil',
        component: PerfilComponent,
        canActivate: [rolGuard],
        data: { roles: ['HUESPED', 'ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'inicio',
        component: PanelComponent,
        canActivate: [rolGuard],
        data: { roles: ['HUESPED'], titulo: 'Inicio · Huésped' },
      },
      {
        path: 'anfitrion',
        component: MisPublicacionesComponent,
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        path: 'anfitrion/publicaciones/nueva',
        component: PublicacionFormComponent,
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Solo el anfitrión propietario; la propiedad la verifica el backend (403)
        path: 'anfitrion/publicaciones/:id/disponibilidad',
        component: DisponibilidadComponent,
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'] },
      },
      {
        // Propietario o administrador; la propiedad la verifica el backend (403 si no corresponde)
        path: 'anfitrion/publicaciones/:id/editar',
        component: PublicacionFormComponent,
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION', 'ADMINISTRADOR'] },
      },
      {
        path: 'admin',
        component: PanelComponent,
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'], titulo: 'Panel de administración' },
      },
      {
        path: 'admin/publicaciones',
        component: TodasPublicacionesComponent,
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/revision',
        component: RevisionComponent,
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'] },
      },
      {
        path: 'admin/configuracion',
        component: PanelComponent,
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'], titulo: 'Configuración' },
      },
    ],
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
