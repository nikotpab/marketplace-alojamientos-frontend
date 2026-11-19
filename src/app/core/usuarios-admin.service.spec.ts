import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UsuariosAdminService } from './usuarios-admin.service';

describe('UsuariosAdminService', () => {
  let svc: UsuariosAdminService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(UsuariosAdminService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('listar GET /api/admin/usuarios', () => {
    svc.listar().subscribe();
    const r = backend.expectOne('/api/admin/usuarios');
    expect(r.request.method).toBe('GET');
    r.flush([]);
  });

  it('restringir POST /api/admin/usuarios/{id}/restriccion con motivo', () => {
    svc.restringir('usr-1', 'Fraude').subscribe();
    const r = backend.expectOne('/api/admin/usuarios/usr-1/restriccion');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ motivo: 'Fraude' });
    r.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('restringir codifica id con caracteres especiales', () => {
    svc.restringir('id/con-slash', 'Test').subscribe();
    backend.expectOne('/api/admin/usuarios/id%2Fcon-slash/restriccion').flush(null, { status: 204, statusText: 'No Content' });
  });

  it('propagates 403 on listar when not admin', () => {
    let err: any;
    svc.listar().subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/admin/usuarios').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(err.status).toBe(403);
  });
});
