import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { verificarContratoInterceptor } from '../testing/contrato';
import { DetalleService } from './detalle.service';

describe('DetalleService', () => {
  let svc: DetalleService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
    svc = TestBed.inject(DetalleService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('obtener GET /api/alojamientos/{id}', () => {
    svc.obtener('aloj-1').subscribe();
    const r = backend.expectOne('/api/alojamientos/aloj-1');
    expect(r.request.method).toBe('GET');
    r.flush({});
  });

  it('codifica id con caracteres especiales', () => {
    svc.obtener('id/con-slash').subscribe();
    backend.expectOne('/api/alojamientos/id%2Fcon-slash').flush({});
  });

  it('propagates 404 when alojamiento not found', () => {
    let err: any;
    svc.obtener('no-existe').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/alojamientos/no-existe').flush({}, { status: 404, statusText: 'Not Found' });
    expect(err.status).toBe(404);
  });
});
