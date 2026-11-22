import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
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

describe('PerfilComponent en pantalla', () => {
  let fixture: ComponentFixture<PerfilComponent>;
  let comp: PerfilComponent;
  let raiz: HTMLElement;
  let auth: AuthService;

  const fallo = (status: number) => throwError(() => ({ status }));

  afterEach(() => sessionStorage.clear());

  function crear(perfil: ReturnType<AuthService['obtenerPerfil']> = of(PERFIL)) {
    TestBed.configureTestingModule({
      imports: [PerfilComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    spyOn(auth, 'obtenerPerfil').and.returnValue(perfil);
    fixture = TestBed.createComponent(PerfilComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  }

  it('muestra el perfil con sus iniciales y su rol, y llena el formulario', () => {
    crear();
    expect(raiz.querySelector('.avatar')!.textContent).toBe('AR');
    expect(raiz.querySelector('.cabecera')!.textContent).toContain('Huésped');
    expect(comp.form.getRawValue()).toEqual({ nombre: 'Ana', apellido: 'Ruiz', telefono: '3001234567' });
  });

  it('sin conexión muestra los datos de la sesión y lo dice', () => {
    sessionStorage.setItem('lr_sesion', JSON.stringify({ token: 't', usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@correo.co', rol: 'ANFITRION' } }));
    crear(fallo(0));
    expect(comp.nombreCompleto()).toBe('Ana');
    expect(comp.etiquetaRol()).toBe('Anfitrión');
    expect(raiz.textContent).toContain('No se pudo cargar tu perfil completo');
  });

  it('sin conexión ni sesión deja el perfil vacío', () => {
    crear(fallo(0));
    expect(comp.perfil()).toBeNull();
    expect(comp.iniciales()).toBe('');
    expect(comp.etiquetaRol()).toBe('');
  });

  it('no guarda datos inválidos y marca los campos', () => {
    crear();
    const actualizar = spyOn(auth, 'actualizarPerfil');
    comp.form.setValue({ nombre: '', apellido: 'R', telefono: '123' });
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(actualizar).not.toHaveBeenCalled();
    expect(raiz.textContent).toContain('Ingresa tu nombre');
    expect(raiz.textContent).toContain('Ingresa tu apellido');
    expect(comp.invalido('telefono')).toBeTrue();
    expect(comp.invalido('inexistente')).toBeFalse();
  });

  it('guarda los cambios y lo confirma', () => {
    crear();
    spyOn(auth, 'actualizarPerfil').and.returnValue(of({ ...PERFIL, nombre: 'Ana María' }));
    comp.form.controls.nombre.setValue('Ana María');
    comp.guardar();
    fixture.detectChanges();
    expect(comp.nombreCompleto()).toBe('Ana María Ruiz');
    expect(raiz.querySelector('.exito')!.textContent).toContain('Cambios guardados.');
    expect(comp.guardando()).toBeFalse();
  });

  it('explica por qué no se guardaron los cambios', () => {
    crear();
    const actualizar = spyOn(auth, 'actualizarPerfil').and.returnValue(fallo(400));
    comp.guardar();
    expect(comp.error()).toBe('Revisa los datos ingresados.');

    actualizar.and.returnValue(fallo(500));
    comp.guardar();
    expect(comp.error()).toContain('No se pudieron guardar los cambios');
    expect(comp.exito()).toBeFalse();
  });

  it('pide confirmación antes de desactivar y permite cancelar', () => {
    crear();
    raiz.querySelector<HTMLButtonElement>('button.peligro')!.click();
    fixture.detectChanges();
    expect(raiz.textContent).toContain('¿Seguro que quieres desactivar tu cuenta?');
    comp.cancelarConfirmacion();
    expect(comp.confirmando()).toBeFalse();
  });

  it('reactiva una cuenta desactivada sin cerrar la sesión', () => {
    crear(of({ ...PERFIL, activo: false }));
    expect(raiz.textContent).toContain('Cuenta desactivada');
    spyOn(auth, 'cambiarEstadoCuenta').and.returnValue(of(PERFIL));
    const cerrar = spyOn(auth, 'cerrarSesion');
    comp.pedirConfirmacion();
    comp.cambiarEstado();
    fixture.detectChanges();
    expect(comp.perfil()!.activo).toBeTrue();
    expect(cerrar).not.toHaveBeenCalled();
    expect(raiz.textContent).toContain('Cuenta activa');
  });

  it('si no cambia el estado lo dice, y sin perfil no hace nada', () => {
    crear();
    const cambiar = spyOn(auth, 'cambiarEstadoCuenta').and.returnValue(fallo(500));
    comp.cambiarEstado();
    expect(comp.errorEstado()).toContain('No se pudo cambiar el estado');
    expect(comp.cambiandoEstado()).toBeFalse();

    comp.perfil.set(null);
    comp.cambiarEstado();
    expect(cambiar).toHaveBeenCalledTimes(1);
  });
});
