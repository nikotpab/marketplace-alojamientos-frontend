import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DatosPublicacion, PublicacionesService } from './publicaciones.service';

const DATOS: DatosPublicacion = {
  titulo: 'Casa', descripcion: 'Bonita', ubicacion: 'Bogotá, Bogotá', tipo: 'CASA',
  capacidad: 4, precioNoche: 100000, servicios: ['WiFi'], reglas: [], imagenes: ['https://img.com/1.jpg'],
  politicaCancelacion: 'Flexible',
};

describe('PublicacionesService', () => {
  let svc: PublicacionesService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(PublicacionesService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('misPublicaciones GET /api/publicaciones/mias', () => {
    svc.misPublicaciones().subscribe();
    backend.expectOne('/api/publicaciones/mias').flush([]);
  });

  it('crear POST /api/publicaciones con los datos', () => {
    svc.crear(DATOS).subscribe();
    const r = backend.expectOne('/api/publicaciones');
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual(DATOS);
    r.flush({});
  });

  it('obtener GET /api/publicaciones/{id}', () => {
    svc.obtener('pub-1').subscribe();
    backend.expectOne('/api/publicaciones/pub-1').flush({});
  });

  it('actualizar PUT /api/publicaciones/{id} con los datos', () => {
    svc.actualizar('pub-1', DATOS).subscribe();
    const r = backend.expectOne('/api/publicaciones/pub-1');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual(DATOS);
    r.flush({});
  });

  it('solicitarActivacion POST /api/publicaciones/{id}/solicitar-activacion', () => {
    svc.solicitarActivacion('pub-1').subscribe();
    const r = backend.expectOne('/api/publicaciones/pub-1/solicitar-activacion');
    expect(r.request.method).toBe('POST');
    r.flush({});
  });

  it('pausar POST /api/publicaciones/{id}/pausar', () => {
    svc.pausar('pub-1').subscribe();
    backend.expectOne('/api/publicaciones/pub-1/pausar').flush({});
  });

  it('reactivar POST /api/publicaciones/{id}/reactivar', () => {
    svc.reactivar('pub-1').subscribe();
    backend.expectOne('/api/publicaciones/pub-1/reactivar').flush({});
  });

  it('todas GET /api/admin/publicaciones sin filtro', () => {
    svc.todas().subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/publicaciones');
    expect(r.request.method).toBe('GET');
    expect(r.request.params.has('estado')).toBeFalse();
    r.flush([]);
  });

  it('todas con estado pasa el parámetro', () => {
    svc.todas('ACTIVA').subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/publicaciones');
    expect(r.request.params.get('estado')).toBe('ACTIVA');
    r.flush([]);
  });

  it('aprobar POST /api/admin/publicaciones/{id}/aprobar', () => {
    svc.aprobar('pub-1').subscribe();
    backend.expectOne('/api/admin/publicaciones/pub-1/aprobar').flush({});
  });

  it('rechazar POST /api/admin/publicaciones/{id}/rechazar con motivo', () => {
    svc.rechazar('pub-1', 'Contenido inadecuado').subscribe();
    const r = backend.expectOne('/api/admin/publicaciones/pub-1/rechazar');
    expect(r.request.body).toEqual({ motivo: 'Contenido inadecuado' });
    r.flush({});
  });

  it('bloquear POST /api/admin/publicaciones/{id}/bloqueo con motivo', () => {
    svc.bloquear('pub-1', 'Información engañosa').subscribe();
    const r = backend.expectOne('/api/admin/publicaciones/pub-1/bloqueo');
    expect(r.request.body).toEqual({ motivo: 'Información engañosa' });
    r.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('tiposActivos GET /api/configuracion/tipos-alojamiento con activos=true', () => {
    svc.tiposActivos().subscribe();
    const r = backend.expectOne((req) => req.url === '/api/configuracion/tipos-alojamiento');
    expect(r.request.params.get('activos')).toBeTruthy();
    r.flush([]);
  });

  it('catalogos GET /api/catalogos', () => {
    svc.catalogos().subscribe();
    backend.expectOne('/api/catalogos').flush({ tipos: [], politicas: [], servicios: [] });
  });

  it('propagates 422 error from solicitarActivacion', () => {
    let err: any;
    svc.solicitarActivacion('pub-1').subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/publicaciones/pub-1/solicitar-activacion').flush(
      { errores: { titulo: 'Falta el título' } }, { status: 422, statusText: 'Unprocessable Entity' }
    );
    expect(err.status).toBe(422);
    expect(err.error.errores.titulo).toContain('título');
  });
});
