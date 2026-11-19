import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ResenasService } from './resenas.service';

describe('ResenasService', () => {
  let svc: ResenasService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(ResenasService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('crear POST /api/reservas/{reservaId}/resena', () => {
    svc.crear('res-1', { calificacion: 5, contenido: 'Excelente' }).subscribe();
    const r = backend.expectOne('/api/reservas/res-1/resena');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ calificacion: 5, contenido: 'Excelente' });
    r.flush({});
  });

  it('dePublicacion GET /api/publicaciones/{id}/resenas', () => {
    svc.dePublicacion('pub-1').subscribe();
    const r = backend.expectOne('/api/publicaciones/pub-1/resenas');
    expect(r.request.method).toBe('GET');
    r.flush([]);
  });

  it('ocultar POST /api/admin/resenas/{id}/ocultamiento', () => {
    svc.ocultar('res-1').subscribe();
    const r = backend.expectOne('/api/admin/resenas/res-1/ocultamiento');
    expect(r.request.method).toBe('POST');
    r.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('codifica caracteres especiales en el id de la reserva', () => {
    svc.crear('id/con-slash', { calificacion: 4, contenido: 'Ok' }).subscribe();
    backend.expectOne('/api/reservas/id%2Fcon-slash/resena').flush({});
  });

  it('propagates 409 from crear (ya existe reseña)', () => {
    let err: any;
    svc.crear('res-1', { calificacion: 5, contenido: 'x' }).subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/reservas/res-1/resena').flush({}, { status: 409, statusText: 'Conflict' });
    expect(err.status).toBe(409);
  });
});
