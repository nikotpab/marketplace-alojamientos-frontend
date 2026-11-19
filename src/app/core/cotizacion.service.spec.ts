import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CotizacionService, SolicitudCotizacion } from './cotizacion.service';

const SOLICITUD: SolicitudCotizacion = {
  publicacionId: 'p1', llegada: '2030-12-01', salida: '2030-12-05', huespedes: 2, adicionales: ['svc1'],
};

describe('CotizacionService', () => {
  let svc: CotizacionService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(CotizacionService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('cotizar POST /api/cotizaciones con la solicitud completa', () => {
    svc.cotizar(SOLICITUD).subscribe();
    const r = backend.expectOne('/api/cotizaciones');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(SOLICITUD);
    r.flush({
      noches: 4, precioNoche: 100000, subtotal: 400000, tarifaLimpieza: 0,
      porcentajeServicio: 10, tarifaServicio: 40000, descuentos: [], adicionales: [],
      total: 440000, moneda: 'COP', adicionalesDisponibles: [],
    });
  });

  it('propagates 409 when dates are unavailable', () => {
    let err: any;
    svc.cotizar(SOLICITUD).subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/cotizaciones').flush({}, { status: 409, statusText: 'Conflict' });
    expect(err.status).toBe(409);
  });
});
