import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { RecuperarComponent } from './recuperar.component';

describe('RecuperarComponent', () => {
  let router: Router;

  function crear() {
    TestBed.configureTestingModule({
      imports: [RecuperarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    router = TestBed.inject(Router);
    return TestBed.createComponent(RecuperarComponent).componentInstance;
  }

  it('pedir otro enlace vuelve al primer paso y quita el token de la dirección', () => {
    const pagina = crear();
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    pagina.paso.set(2);

    pagina.pedirOtro();

    expect(pagina.paso()).toBe(1);
    expect(navegar).toHaveBeenCalledWith([], { queryParams: {} });
  });

  it('ir al inicio de sesión navega a /auth', () => {
    const pagina = crear();
    const navegar = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    pagina.irALogin();

    expect(navegar).toHaveBeenCalledWith('/auth');
  });
});

describe('RecuperarComponent, pasos', () => {
  let comp: RecuperarComponent;
  let auth: AuthService;

  const fallo = (status: number) => throwError(() => ({ status }));

  function crear(token: string | null = null) {
    TestBed.configureTestingModule({
      imports: [RecuperarComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } } },
      ],
    });
    auth = TestBed.inject(AuthService);
    comp = TestBed.createComponent(RecuperarComponent).componentInstance;
  }

  it('sin token empieza pidiendo el correo y con token pide la contraseña nueva', () => {
    crear();
    expect(comp.paso()).toBe(1);
    TestBed.resetTestingModule();
    crear('tok-1');
    expect(comp.paso()).toBe(2);
  });

  it('un correo inválido no envía la solicitud y se marca', () => {
    crear();
    const solicitar = spyOn(auth, 'solicitarRecuperacion');
    comp.correo.setValue({ correo: 'no-es-correo' });
    comp.solicitar();
    expect(solicitar).not.toHaveBeenCalled();
    expect(comp.invalido('correo', 'correo')).toBeTrue();
    expect(comp.invalido('correo', 'inexistente')).toBeFalse();
  });

  it('con un correo válido envía el enlace y lo dice', () => {
    crear();
    const solicitar = spyOn(auth, 'solicitarRecuperacion').and.returnValue(of(undefined));
    comp.correo.setValue({ correo: 'ana@correo.co' });
    comp.solicitar();
    expect(solicitar).toHaveBeenCalledWith('ana@correo.co');
    expect(comp.paso()).toBe(4);
    expect(comp.enviado()).toBeFalse();
  });

  it('si no se puede pedir el enlace lo dice', () => {
    crear();
    spyOn(auth, 'solicitarRecuperacion').and.returnValue(fallo(500));
    comp.correo.setValue({ correo: 'ana@correo.co' });
    comp.solicitar();
    expect(comp.error()).toContain('No se pudo iniciar la recuperación');
    expect(comp.cargando()).toBeFalse();
  });

  it('exige contraseñas de 8 caracteres que coincidan', () => {
    crear('tok-1');
    const restablecer = spyOn(auth, 'restablecerContrasena');
    comp.nueva.setValue({ contrasena: 'corta', confirmar: 'otra' });
    comp.guardar();
    expect(restablecer).not.toHaveBeenCalled();
    expect(comp.invalido('nueva', 'contrasena')).toBeTrue();
  });

  it('cambia la contraseña con el token del enlace', () => {
    crear('tok-1');
    const restablecer = spyOn(auth, 'restablecerContrasena').and.returnValue(of(undefined));
    comp.nueva.setValue({ contrasena: 'Segura123*', confirmar: 'Segura123*' });
    comp.guardar();
    expect(restablecer).toHaveBeenCalledWith('tok-1', 'Segura123*');
    expect(comp.paso()).toBe(3);
  });

  it('un enlace vencido y otro fallo dan mensajes distintos', () => {
    crear('tok-1');
    const restablecer = spyOn(auth, 'restablecerContrasena').and.returnValue(fallo(400));
    comp.nueva.setValue({ contrasena: 'Segura123*', confirmar: 'Segura123*' });
    comp.guardar();
    expect(comp.error()).toContain('ya venció');

    restablecer.and.returnValue(fallo(500));
    comp.guardar();
    expect(comp.error()).toBe('No se pudo cambiar la contraseña. Intenta de nuevo.');
    expect(comp.paso()).toBe(2);
  });
});
