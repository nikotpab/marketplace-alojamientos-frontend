import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TiposAlojamientoService } from './tipos-alojamiento.service';

describe('TiposAlojamientoService', () => {
  let svc: TiposAlojamientoService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(TiposAlojamientoService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('mientras no carga usa los tipos iniciales del sistema', () => {
    expect(svc.nombre('CABANA')).toBe('Cabaña');
    expect(svc.nombre('DESCONOCIDO')).toBe('DESCONOCIDO');
  });

  it('carga los tipos activos y los usa para los nombres', () => {
    svc.cargarActivos();
    backend.expectOne('/api/configuracion/tipos-alojamiento').flush([{ codigo: 'GLAMPING', nombre: 'Glamping' }]);
    expect(svc.activos()).toEqual([{ codigo: 'GLAMPING', nombre: 'Glamping' }]);
    expect(svc.nombre('GLAMPING')).toBe('Glamping');
    expect(svc.nombre('CASA')).toBe('Casa');
  });

  it('si la configuración no responde conserva los tipos que tenía', () => {
    const antes = svc.activos();
    svc.cargarActivos();
    backend.expectOne('/api/configuracion/tipos-alojamiento').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(svc.activos()).toBe(antes);
  });

  it('actualizar envía el nombre y el estado completos y recarga los activos', () => {
    const tipo = { id: 'id con espacio', nombre: 'Casa', activo: true };
    svc.actualizar(tipo, { activo: false }).subscribe();
    const put = backend.expectOne('/api/admin/tipos-alojamiento/id%20con%20espacio');
    expect(put.request.body).toEqual({ nombre: 'Casa', activo: false });
    put.flush({ ...tipo, activo: false });
    backend.expectOne('/api/configuracion/tipos-alojamiento').flush([]);
  });
});
