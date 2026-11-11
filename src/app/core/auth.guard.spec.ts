import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService, RolUsuario } from './auth.service';
import { rolGuard } from './auth.guard';

describe('rolGuard', () => {
  let sesion: { autenticado: boolean; rol: RolUsuario | null };

  const authFalso = {
    autenticado: () => sesion.autenticado,
    tieneRol: (roles: RolUsuario[]) => !!sesion.rol && roles.includes(sesion.rol),
  };

  function ejecutar(roles?: RolUsuario[]) {
    const ruta = { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => rolGuard(ruta, {} as RouterStateSnapshot));
  }

  function destino(resultado: unknown) {
    return TestBed.inject(Router).serializeUrl(resultado as UrlTree);
  }

  beforeEach(() => {
    sesion = { autenticado: false, rol: null };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authFalso }],
    });
  });

  it('sin sesión redirige a /auth', () => {
    expect(destino(ejecutar(['HUESPED']))).toBe('/auth');
  });

  it('con sesión pero sin el rol pedido redirige a /acceso-denegado', () => {
    sesion = { autenticado: true, rol: 'ANFITRION' };
    expect(destino(ejecutar(['ADMINISTRADOR']))).toBe('/acceso-denegado');
  });

  it('una ruta sin roles declarados queda denegada por defecto', () => {
    sesion = { autenticado: true, rol: 'ADMINISTRADOR' };
    expect(destino(ejecutar())).toBe('/acceso-denegado');
  });

  it('permite el paso cuando el rol coincide', () => {
    sesion = { autenticado: true, rol: 'HUESPED' };
    expect(ejecutar(['HUESPED', 'ANFITRION'])).toBeTrue();
  });
});
