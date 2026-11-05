import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RolUsuario } from './auth.service';

/**
 * Protege rutas por rol. La ruta debe declarar `data: { roles: [...] }`.
 * Una ruta sin roles declarados queda denegada por defecto.
 */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data?.['roles'] as RolUsuario[] | undefined;

  if (!auth.autenticado()) return router.createUrlTree(['/auth']);
  if (!roles || roles.length === 0) return router.createUrlTree(['/acceso-denegado']);
  if (!auth.tieneRol(roles)) return router.createUrlTree(['/acceso-denegado']);
  return true;
};
