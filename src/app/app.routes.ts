import { Routes } from '@angular/router';
import { AuthComponent } from './pages/auth/auth.component';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado.component';
import { RecuperarComponent } from './pages/recuperar/recuperar.component';
import { PanelComponent } from './pages/panel/panel.component';
import { rolGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'recuperar', component: RecuperarComponent },
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },

  // Rutas protegidas: cada una declara los roles permitidos (sin roles = denegada)
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

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
