import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CABECERA_CORRELACION, correlacionInterceptor } from './correlacion.interceptor';
import { LogService } from './log.service';

describe('correlacionInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let registrar: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([correlacionInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    registrar = spyOn(TestBed.inject(LogService), 'registrar');
  });

  afterEach(() => backend.verify());

  const fallar = (url: string, status: number, opciones: { metodo?: string; error?: unknown; headers?: Record<string, string> } = {}) => {
    http.request(opciones.metodo ?? 'GET', url).subscribe({ error: () => {} });
    backend.expectOne(url).flush(opciones.error ?? null, { status, statusText: 'Error', headers: opciones.headers });
  };

  it('no toca las peticiones que no van a la API', () => {
    http.get('/assets/i18n.json').subscribe();
    const r = backend.expectOne('/assets/i18n.json');
    expect(r.request.headers.has(CABECERA_CORRELACION)).toBeFalse();
    r.flush({});
  });

  it('agrega un identificador nuevo o conserva el que ya trae', () => {
    http.get('/api/publicaciones/mias').subscribe();
    const nueva = backend.expectOne('/api/publicaciones/mias');
    expect(nueva.request.headers.get(CABECERA_CORRELACION)).toMatch(/^[0-9a-f-]{36}$/);
    nueva.flush([]);

    http.get('/api/catalogos', { headers: { [CABECERA_CORRELACION]: 'abc-123' } }).subscribe();
    const propia = backend.expectOne('/api/catalogos');
    expect(propia.request.headers.get(CABECERA_CORRELACION)).toBe('abc-123');
    propia.flush({});
    expect(registrar).not.toHaveBeenCalled();
  });

  it('registra un 5xx como ERROR con el código del backend y el identificador que devuelve', () => {
    fallar('/api/reservas', 503, { metodo: 'POST', error: { codigo: 'PAGO_NO_DISPONIBLE' }, headers: { [CABECERA_CORRELACION]: 'del-backend' } });
    expect(registrar).toHaveBeenCalledWith(
      'ERROR',
      'HTTP_ERROR',
      jasmine.objectContaining({ tipoEvento: 'RESERVA', metodo: 'POST', url: '/api/reservas', estado: 503, codigo: 'PAGO_NO_DISPONIBLE' }),
      'del-backend',
    );
  });

  it('registra un 4xx como WARN y un error de red como ERROR', () => {
    fallar('/api/auth/login', 401);
    expect(registrar.calls.mostRecent().args[0]).toBe('WARN');
    expect(registrar.calls.mostRecent().args[2].codigo).toBeNull();

    fallar('/api/admin/usuarios', 0);
    expect(registrar.calls.mostRecent().args[0]).toBe('ERROR');
  });

  it('clasifica cada error por el módulo de la URL', () => {
    const casos: [string, string][] = [
      ['/api/auth/login', 'AUTENTICACION'],
      ['/api/admin/tarifas', 'ADMINISTRACION'],
      ['/api/reservas/r1/cancelar', 'CANCELACION'],
      ['/api/reservas/r1/resena', 'RESENA'],
      ['/api/reservas/mias', 'RESERVA'],
      ['/api/publicaciones/p1', 'PUBLICACION'],
      ['/api/notificaciones', 'API'],
    ];
    for (const [url, tipo] of casos) {
      fallar(url, 400);
      expect(registrar.calls.mostRecent().args[2].tipoEvento).withContext(url).toBe(tipo);
    }
  });
});
