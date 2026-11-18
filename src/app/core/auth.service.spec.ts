import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService, Sesion } from './auth.service';

const SESION: Sesion = { token: 'tok', usuario: { id: '1', nombre: 'Ana', correo: 'ana@a.co', rol: 'HUESPED' } };

describe('AuthService', () => {
  let svc: AuthService;
  let backend: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { backend.verify(); sessionStorage.clear(); });

  it('solicitarCodigoRegistro POST /api/auth/register/code con el correo', () => {
    svc.solicitarCodigoRegistro('ana@a.co').subscribe();
    const r = backend.expectOne('/api/auth/register/code');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ correo: 'ana@a.co' });
    r.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('registrar POST /api/auth/register con los datos completos', () => {
    const datos = { nombre: 'Ana', apellido: 'López', correo: 'ana@a.co', telefono: '3001234567', contrasena: 'P-123', rol: 'HUESPED' as const, codigo: '123456' };
    svc.registrar(datos).subscribe();
    const r = backend.expectOne('/api/auth/register');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(datos);
    r.flush({}, { status: 201, statusText: 'Created' });
  });

  it('login POST /api/auth/login y guarda la sesión', () => {
    let resultado: Sesion | undefined;
    svc.login({ correo: 'ana@a.co', contrasena: 'P-123' }).subscribe((s) => (resultado = s));
    backend.expectOne('/api/auth/login').flush(SESION);
    expect(resultado).toEqual(SESION);
    expect(svc.autenticado()).toBeTrue();
    expect(svc.token()).toBe('tok');
  });

  it('obtenerPerfil GET /api/usuarios/me', () => {
    svc.obtenerPerfil().subscribe();
    const r = backend.expectOne('/api/usuarios/me');
    expect(r.request.method).toBe('GET');
    r.flush({ nombre: 'Ana', apellido: 'L', correo: 'ana@a.co', telefono: '300', rol: 'HUESPED', activo: true });
  });

  it('actualizarPerfil PUT /api/usuarios/me', () => {
    svc.actualizarPerfil({ nombre: 'Ana', apellido: 'L', telefono: '300' }).subscribe();
    const r = backend.expectOne('/api/usuarios/me');
    expect(r.request.method).toBe('PUT');
    r.flush({});
  });

  it('cambiarEstadoCuenta PATCH /api/usuarios/me/estado', () => {
    svc.cambiarEstadoCuenta(false).subscribe();
    const r = backend.expectOne('/api/usuarios/me/estado');
    expect(r.request.method).toBe('PATCH');
    expect(r.request.body).toEqual({ activo: false });
    r.flush({});
  });

  it('solicitarRecuperacion POST /api/auth/password/recover', () => {
    svc.solicitarRecuperacion('ana@a.co').subscribe();
    const r = backend.expectOne('/api/auth/password/recover');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ correo: 'ana@a.co' });
    r.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('restablecerContrasena POST /api/auth/password/reset con token y nueva contraseña', () => {
    svc.restablecerContrasena('tk123', 'NuevaP-1').subscribe();
    const r = backend.expectOne('/api/auth/password/reset');
    expect(r.request.body).toEqual({ token: 'tk123', contrasenaNueva: 'NuevaP-1' });
    r.flush({});
  });

  it('cerrarSesion limpia la sesión en memoria y sessionStorage', () => {
    svc.login({ correo: 'ana@a.co', contrasena: 'P' }).subscribe();
    backend.expectOne('/api/auth/login').flush(SESION);
    expect(svc.autenticado()).toBeTrue();
    svc.cerrarSesion();
    expect(svc.autenticado()).toBeFalse();
    expect(sessionStorage.getItem('lr_sesion')).toBeNull();
  });

  it('tieneRol devuelve true cuando el usuario tiene el rol pedido', () => {
    svc.login({ correo: 'ana@a.co', contrasena: 'P' }).subscribe();
    backend.expectOne('/api/auth/login').flush(SESION);
    expect(svc.tieneRol(['HUESPED', 'ANFITRION'])).toBeTrue();
    expect(svc.tieneRol(['ADMINISTRADOR'])).toBeFalse();
  });

  it('propagates 401 error from login', () => {
    let err: any;
    svc.login({ correo: 'x@x.co', contrasena: 'mala' }).subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(err.status).toBe(401);
  });
});
