import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReservasService, SolicitudReserva } from './reservas.service';

const SOLICITUD: SolicitudReserva = {
  publicacionId: 'p1', llegada: '2030-12-01', salida: '2030-12-05', huespedes: 2, adicionales: [],
};

describe('ReservasService', () => {
  let svc: ReservasService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(ReservasService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('misReservas GET /api/reservas', () => {
    svc.misReservas().subscribe();
    const r = backend.expectOne('/api/reservas');
    expect(r.request.method).toBe('GET');
    r.flush([]);
  });

  it('reservasAnfitrion GET /api/reservas', () => {
    svc.reservasAnfitrion().subscribe();
    const r = backend.expectOne('/api/reservas');
    expect(r.request.method).toBe('GET');
    r.flush([]);
  });

  it('confirmar POST /api/reservas con clave de idempotencia y métodoPagoId', () => {
    svc.confirmar(SOLICITUD, 'clave-123', 'pm_card_visa').subscribe();
    const r = backend.expectOne('/api/reservas');
    expect(r.request.method).toBe('POST');
    expect(r.request.headers.get('Idempotency-Key')).toBe('clave-123');
    expect(r.request.body.metodoPagoId).toBe('pm_card_visa');
    expect(r.request.body.publicacionId).toBe('p1');
    r.flush({});
  });

  it('estimarDevolucion GET /api/reservas/{id}/cancelacion/estimacion', () => {
    svc.estimarDevolucion('res-1').subscribe();
    const r = backend.expectOne('/api/reservas/res-1/cancelacion/estimacion');
    expect(r.request.method).toBe('GET');
    r.flush({ valorDevolucion: 50000, politica: 'Flexible' });
  });

  it('cancelar POST /api/reservas/{id}/cancelacion con motivo', () => {
    svc.cancelar('res-1', 'Cambio de planes').subscribe();
    const r = backend.expectOne('/api/reservas/res-1/cancelacion');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ motivo: 'Cambio de planes' });
    r.flush({});
  });

  it('estimarDevolucion codifica caracteres especiales en URLs', () => {
    svc.estimarDevolucion('id/con-slash').subscribe();
    backend.expectOne('/api/reservas/id%2Fcon-slash/cancelacion/estimacion').flush({});
  });

  it('propagates error 409 from confirmar', () => {
    let err: any;
    svc.confirmar(SOLICITUD, 'k', 'pm').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/reservas').flush({}, { status: 409, statusText: 'Conflict' });
    expect(err.status).toBe(409);
  });
});
