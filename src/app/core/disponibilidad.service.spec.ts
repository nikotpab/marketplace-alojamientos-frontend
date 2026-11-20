import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { verificarContratoInterceptor } from '../testing/contrato';
import { DisponibilidadService } from './disponibilidad.service';

describe('DisponibilidadService', () => {
  let svc: DisponibilidadService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
    svc = TestBed.inject(DisponibilidadService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('consultar GET /api/publicaciones/{id}/disponibilidad con desde y hasta', () => {
    svc.consultar('pub-1', '2030-12-01', '2030-12-31').subscribe();
    const r = backend.expectOne((req) => req.url === '/api/publicaciones/pub-1/disponibilidad');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.get('desde')).toBe('2030-12-01');
    expect(r.request.params.get('hasta')).toBe('2030-12-31');
    r.flush({ bloqueados: [], reservados: [] });
  });

  it('actualizar PUT /api/publicaciones/{id}/disponibilidad con cuerpo correcto', () => {
    svc.actualizar('pub-1', '2030-12-01', '2030-12-10', 'BLOQUEADO').subscribe();
    const r = backend.expectOne('/api/publicaciones/pub-1/disponibilidad');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ desde: '2030-12-01', hasta: '2030-12-10', estado: 'BLOQUEADO' });
    r.flush({ bloqueados: ['2030-12-01'], reservados: [] });
  });

  it('propagates 409 when range has confirmed reservations', () => {
    let err: any;
    svc.actualizar('pub-1', '2030-12-01', '2030-12-05', 'BLOQUEADO').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/publicaciones/pub-1/disponibilidad').flush({}, { status: 409, statusText: 'Conflict' });
    expect(err.status).toBe(409);
  });
});
