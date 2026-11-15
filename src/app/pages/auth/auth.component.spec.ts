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

  function llenarYCrear(correo = 'laura@correo.co') {
    boton('Crear cuenta').click();
    fixture.detectChanges();
    pantalla.registro.setValue({ nombre: 'Laura', apellido: 'Gómez', correo, telefono: '3001234567', contrasena: CONTRASENA });
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
