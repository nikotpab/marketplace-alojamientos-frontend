import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuditoriaService } from './auditoria.service';

describe('AuditoriaService', () => {
  let svc: AuditoriaService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(AuditoriaService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('consultar sin filtros GET /api/admin/auditoria sin params', () => {
    svc.consultar({}).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/auditoria');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.keys().length).toBe(0);
    r.flush([]);
  });

  it('consultar con accion y fechas envía esos params', () => {
    svc.consultar({ accion: 'ReservaConfirmada', desde: '2026-01-01', hasta: '2026-01-31' }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/auditoria');
    expect(r.request.params.get('accion')).toBe('ReservaConfirmada');
    expect(r.request.params.get('desde')).toBe('2026-01-01');
    expect(r.request.params.get('hasta')).toBe('2026-01-31');
    r.flush([]);
  });

  it('no envía filtros con valor vacío o undefined', () => {
    svc.consultar({ accion: '', actorId: undefined, resultado: 'EXITO' }).subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/auditoria');
    expect(r.request.params.has('accion')).toBeFalse();
    expect(r.request.params.has('actorId')).toBeFalse();
    expect(r.request.params.get('resultado')).toBe('EXITO');
    r.flush([]);
  });

  it('propagates 403 when user is not admin', () => {
    let err: any;
    svc.consultar({}).subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/admin/auditoria').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(err.status).toBe(403);
  });
});
