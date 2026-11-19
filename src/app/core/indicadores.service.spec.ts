import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { verificarContratoInterceptor } from '../testing/contrato';
import { IndicadoresService, PLAZO_DASHBOARD_MS } from './indicadores.service';

describe('IndicadoresService', () => {
  let svc: IndicadoresService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
    svc = TestBed.inject(IndicadoresService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('consultar GET /api/admin/dashboard con desde y hasta', () => {
    svc.consultar('2026-01-01', '2026-01-31').subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/dashboard');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.get('desde')).toBe('2026-01-01');
    expect(r.request.params.get('hasta')).toBe('2026-01-31');
    r.flush({
      desde: '2026-01-01', hasta: '2026-01-31',
      usuarios: 100, publicacionesActivas: 20,
      reservasPorEstado: {}, ingresosEstimados: 0,
      ciudadesConMayorDemanda: [],
    });
  });

  it('propagates 403 when user is not admin', () => {
    let err: any;
    svc.consultar('2026-01-01', '2026-01-31').subscribe({ error: (e) => (err = e) });
    backend.expectOne((req) => req.url === '/api/admin/dashboard').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(err.status).toBe(403);
  });

  it(`timeout emitido después de ${PLAZO_DASHBOARD_MS} ms`, fakeAsync(() => {
    let err: any;
    svc.consultar('2026-01-01', '2026-01-31').subscribe({ error: (e) => (err = e) });
    backend.expectOne((req) => req.url === '/api/admin/dashboard');
    tick(PLAZO_DASHBOARD_MS);
    expect(err).toBeDefined();
  }));
});
