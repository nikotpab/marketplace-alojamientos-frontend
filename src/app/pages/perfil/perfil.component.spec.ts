import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, Perfil } from '../../core/auth.service';
import { PerfilComponent } from './perfil.component';

const PERFIL: Perfil = { nombre: 'Ana', apellido: 'Ruiz', correo: 'ana@correo.co', telefono: '3001234567', rol: 'HUESPED', activo: true };

describe('PerfilComponent', () => {
  let router: Router;
  let auth: AuthService;

  function crear() {
    TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    return TestBed.createComponent(PerfilComponent).componentInstance;
  }

  it('al desactivar la cuenta cierra la sesión y lo dice en el inicio de sesión', () => {
    const pagina = crear();
    pagina.perfil.set(PERFIL);
    spyOn(auth, 'cambiarEstadoCuenta').and.returnValue(of({ ...PERFIL, activo: false }));
    const cerrar = spyOn(auth, 'cerrarSesion');
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);

    pagina.cambiarEstado();

    expect(cerrar).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/auth'], { queryParams: { cuenta: 'desactivada' } });
  });

  it('cambiar la contraseña lleva a la recuperación', () => {
    const pagina = crear();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    pagina.cambiarContrasena();

    expect(navegar).toHaveBeenCalledWith('/recuperar');
  });
});
