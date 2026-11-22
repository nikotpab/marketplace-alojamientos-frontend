import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Sesion } from './auth.service';
import { LogService, enmascarar } from './log.service';

describe('enmascarar (logs sin datos sensibles)', () => {
  it('oculta claves sensibles', () => {
    const r = enmascarar({ correo: 'a@b.co', contrasena: 'secreta123', token: 'abc', tarjeta: { numero: '4242' } }) as Record<string, unknown>;
    expect(r['correo']).toBe('a@b.co');
    expect(r['contrasena']).toBe('[OCULTO]');
    expect(r['token']).toBe('[OCULTO]');
    expect(r['tarjeta']).toBe('[OCULTO]');
  });

  it('reemplaza JWT y números de tarjeta dentro de textos', () => {
    const texto = enmascarar('Bearer eyJhbGciOi.eyJzdWIiOi.firma pagó con 4242 4242 4242 4242') as string;
    expect(texto).toContain('[TOKEN]');
    expect(texto).toContain('[TARJETA]');
    expect(texto).not.toContain('4242 4242');
  });
});

describe('LogService', () => {
  let log: LogService;

  function crear(sesion: Sesion | null) {
    sessionStorage.clear();
    if (sesion) sessionStorage.setItem('lr_sesion', JSON.stringify(sesion));
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    log = TestBed.inject(LogService);
  }

  afterEach(() => sessionStorage.clear());

  it('escribe una línea JSON por nivel con el usuario, la ruta y los datos enmascarados', () => {
    crear({ token: 'tok', usuario: { id: 'u1', nombre: 'Ana', correo: 'ana@a.co', rol: 'ADMINISTRADOR' } });
    const error = spyOn(console, 'error');
    log.registrar('ERROR', 'HTTP_ERROR', { estado: 500, token: 'secreto' }, 'c-1');
    const entrada = JSON.parse(error.calls.mostRecent().args[0]);
    expect(entrada).toEqual(jasmine.objectContaining({
      nivel: 'ERROR', evento: 'HTTP_ERROR', correlationId: 'c-1', usuarioId: 'u1', rol: 'ADMINISTRADOR', estado: 500, token: '[OCULTO]',
    }));
    expect(entrada.ruta).toBe(location.pathname);
  });

  it('sin sesión ni datos registra los avisos y la información sin usuario', () => {
    crear(null);
    const aviso = spyOn(console, 'warn');
    const info = spyOn(console, 'info');
    log.registrar('WARN', 'LENTO');
    log.registrar('INFO', 'INICIO');
    const entrada = JSON.parse(aviso.calls.mostRecent().args[0]);
    expect(entrada.usuarioId).toBeNull();
    expect(entrada.correlationId).toBeNull();
    expect(JSON.parse(info.calls.mostRecent().args[0]).evento).toBe('INICIO');
  });
});

describe('enmascarar (límites)', () => {
  it('recorre listas y corta los objetos demasiado profundos', () => {
    const profundo = { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } };
    expect(enmascarar(['4242 4242 4242 4242', 7])).toEqual(['[TARJETA]', 7]);
    expect(JSON.stringify(enmascarar(profundo))).toContain('[…]');
    expect(enmascarar(null)).toBeNull();
  });
});
