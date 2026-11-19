import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthComponent } from './auth.component';

/** SCRUM-152: registro en dos pasos, con el código que llega al correo. */
describe('AuthComponent · registro con código', () => {
  const CONTRASENA = 'Contrasena-de-prueba-1';
  let fixture: ComponentFixture<AuthComponent>;
  let pantalla: AuthComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let navegar: jasmine.Spy;

  const boton = (texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.trim().startsWith(texto))!;
  const ventana = () => raiz.querySelector('app-ventana-codigo');

  function llenarYCrear(correo = 'laura@correo.co', confirmar = CONTRASENA) {
    boton('Crear cuenta').click();
    fixture.detectChanges();
    pantalla.registro.setValue({ nombre: 'Laura', apellido: 'Gómez', correo, telefono: '3001234567', contrasena: CONTRASENA, confirmar });
    raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function escribirCodigo(codigo: string) {
    const campo = raiz.querySelector<HTMLInputElement>('#codigo-registro')!;
    campo.value = codigo;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    boton('Confirmar y crear cuenta').click();
    fixture.detectChanges();
  }

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(AuthComponent);
    pantalla = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('pide el código, crea la cuenta con él e inicia la sesión', () => {
    llenarYCrear();
    const pedido = http.expectOne('/api/auth/register/code');
    expect(pedido.request.body).toEqual({ correo: 'laura@correo.co' });
    pedido.flush(null, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(ventana()).not.toBeNull();

    escribirCodigo('048213');
    const registro = http.expectOne('/api/auth/register');
    expect(registro.request.body).toEqual(jasmine.objectContaining({ correo: 'laura@correo.co', rol: 'HUESPED', codigo: '048213' }));
    // SCRUM-153: la confirmación no viaja a la API.
    expect(Object.keys(registro.request.body)).not.toContain('confirmar');
    registro.flush({}, { status: 201, statusText: 'Created' });

    const login = http.expectOne('/api/auth/login');
    expect(login.request.body).toEqual({ correo: 'laura@correo.co', contrasena: CONTRASENA });
    login.flush({ token: 't', usuario: { id: '1', nombre: 'Laura', correo: 'laura@correo.co', rol: 'HUESPED' } });
    fixture.detectChanges();

    expect(navegar).toHaveBeenCalledWith('/buscar');
    expect(ventana()).toBeNull();
    // La contraseña no se guarda en el navegador: solo la sesión.
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(CONTRASENA);
    expect(JSON.stringify({ ...localStorage })).not.toContain(CONTRASENA);
    expect(pantalla.registro.getRawValue().contrasena).toBe('');
  });

  it('con un código incorrecto muestra el mensaje de la API y la ventana sigue abierta', () => {
    llenarYCrear();
    http.expectOne('/api/auth/register/code').flush(null, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();

    escribirCodigo('000000');
    http.expectOne('/api/auth/register').flush(
      { campos: { codigo: 'El código no es correcto o venció. Revisa el correo o pide uno nuevo.' } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(ventana()).not.toBeNull();
    expect(ventana()!.textContent).toContain('El código no es correcto o venció');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('con contraseñas distintas no pide el código y lo explica junto a la confirmación', () => {
    llenarYCrear('laura@correo.co', 'Otra-contrasena-2');

    http.expectNone('/api/auth/register/code');
    expect(ventana()).toBeNull();
    expect(raiz.querySelector('#registro-confirmar-error')?.textContent).toContain('Las contraseñas no coinciden');
    expect(raiz.querySelector('#registro-confirmar')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('sin confirmar la contraseña no pide el código', () => {
    llenarYCrear('laura@correo.co', '');

    http.expectNone('/api/auth/register/code');
    expect(raiz.querySelector('#registro-confirmar-error')?.textContent).toContain('Confirma tu contraseña');
  });

  it('con un correo sin dominio completo no pide el código y muestra un ejemplo', () => {
    llenarYCrear('luicuadros07@gmail');

    http.expectNone('/api/auth/register/code');
    expect(raiz.querySelector('#registro-correo-error')?.textContent).toContain('nombre@gmail.com');
  });

  it('con un teléfono que no empieza por 3 o no tiene 10 dígitos no pide el código', () => {
    boton('Crear cuenta').click();
    fixture.detectChanges();
    for (const telefono of ['2001234567', '300123456']) {
      pantalla.registro.setValue({ nombre: 'Laura', apellido: 'Gómez', correo: 'laura@correo.co', telefono, contrasena: CONTRASENA, confirmar: CONTRASENA });
      raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
      fixture.detectChanges();

      http.expectNone('/api/auth/register/code');
      expect(raiz.querySelector('#registro-telefono-error')?.textContent).toContain('10 dígitos, empezando por 3');
    }
  });

  it('si el correo ya tiene cuenta no abre la ventana y marca el correo', () => {
    llenarYCrear();
    http.expectOne('/api/auth/register/code').flush({}, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(ventana()).toBeNull();
    expect(raiz.textContent).toContain('Este correo ya está registrado');
  });

  it('"Cambiar correo" vuelve al formulario sin perder los datos', () => {
    llenarYCrear();
    http.expectOne('/api/auth/register/code').flush(null, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();

    boton('Cambiar correo').click();
    fixture.detectChanges();

    expect(ventana()).toBeNull();
    expect(pantalla.registro.getRawValue().correo).toBe('laura@correo.co');
  });

  it('una cuenta antigua sin verificar va a recuperar la contraseña', () => {
    pantalla.login.setValue({ correo: 'antigua@correo.co', contrasena: CONTRASENA });
    raiz.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    http.expectOne('/api/auth/login').flush({ codigo: 'CORREO_NO_VERIFICADO' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('Recupera tu contraseña');
    boton('Recuperar contraseña y confirmar mi correo').click();
    expect(navegar).toHaveBeenCalledWith('/recuperar');
  });
});

describe('AuthComponent · inicio de sesión', () => {
  const PASS = 'Pass-de-prueba-1';
  let fixture: ComponentFixture<AuthComponent>;
  let pantalla: AuthComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let navegar: jasmine.Spy;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(AuthComponent);
    pantalla = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); sessionStorage.clear(); });

  it('con credenciales correctas navega según el rol HUESPED', () => {
    pantalla.login.setValue({ correo: 'h@correo.co', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({ token: 't', usuario: { id: '1', nombre: 'H', correo: 'h@correo.co', rol: 'HUESPED' } });
    expect(navegar).toHaveBeenCalledWith('/buscar');
  });

  it('con credenciales correctas navega según el rol ANFITRION', () => {
    pantalla.login.setValue({ correo: 'a@correo.co', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({ token: 't', usuario: { id: '2', nombre: 'A', correo: 'a@correo.co', rol: 'ANFITRION' } });
    expect(navegar).toHaveBeenCalledWith('/anfitrion');
  });

  it('con credenciales correctas navega según el rol ADMINISTRADOR', () => {
    pantalla.login.setValue({ correo: 'ad@correo.co', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({ token: 't', usuario: { id: '3', nombre: 'Ad', correo: 'ad@correo.co', rol: 'ADMINISTRADOR' } });
    expect(navegar).toHaveBeenCalledWith('/admin');
  });

  it('con 401 muestra correo o contraseña incorrectos', () => {
    pantalla.login.setValue({ correo: 'h@correo.co', contrasena: 'mala' });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Correo o contraseña incorrectos');
    expect(navegar).not.toHaveBeenCalled();
  });

  it('con 423 muestra advertencia de cuenta bloqueada 30 minutos', () => {
    pantalla.login.setValue({ correo: 'h@correo.co', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({}, { status: 423, statusText: 'Locked' });
    fixture.detectChanges();
    expect(raiz.textContent).toContain('30 minutos');
  });

  it('con CUENTA_DESACTIVADA muestra mensaje de cuenta desactivada', () => {
    pantalla.login.setValue({ correo: 'h@correo.co', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectOne('/api/auth/login').flush({ codigo: 'CUENTA_DESACTIVADA' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(raiz.textContent).toContain('desactivada');
  });

  it('con formulario inválido (correo vacío) no llama a la API', () => {
    pantalla.login.setValue({ correo: '', contrasena: PASS });
    pantalla.iniciarSesion();
    http.expectNone('/api/auth/login');
  });
});
