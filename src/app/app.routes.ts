import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado.component';
import { RecuperarComponent } from './pages/recuperar/recuperar.component';
import { PanelComponent } from './pages/panel/panel.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { BusquedaComponent } from './pages/busqueda/busqueda.component';
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
        component: PanelComponent,
        canActivate: [rolGuard],
        data: { roles: ['ANFITRION'], titulo: 'Panel del anfitrión' },
      },
      {
        path: 'admin',
        component: PanelComponent,
        canActivate: [rolGuard],
        data: { roles: ['ADMINISTRADOR'], titulo: 'Panel de administración' },
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
