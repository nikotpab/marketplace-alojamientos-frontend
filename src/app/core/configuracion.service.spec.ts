import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfiguracionService, Tarifas } from './configuracion.service';

const TARIFAS: Tarifas = {
  porcentajeServicio: 10,
  porcentajeLimpieza: 5,
  porcentajeDescuento: 3,
  porcentajeDescuentoEstanciaLarga: 8,
  nochesEstanciaLarga: 7,
};

describe('ConfiguracionService', () => {
  let svc: ConfiguracionService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    svc = TestBed.inject(ConfiguracionService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('tarifas GET /api/admin/tarifas', () => {
    svc.tarifas().subscribe();
    const r = backend.expectOne('/api/admin/tarifas');
    expect(r.request.method).toBe('GET');
    r.flush(TARIFAS);
  });

  it('actualizarTarifas PUT /api/admin/tarifas con cuerpo completo', () => {
    svc.actualizarTarifas(TARIFAS).subscribe();
    const r = backend.expectOne('/api/admin/tarifas');
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual(TARIFAS);
    r.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('historial GET /api/admin/auditoria filtrando por TarifasActualizadas', () => {
    svc.historial().subscribe();
    const r = backend.expectOne((req) => req.url === '/api/admin/auditoria');
    expect(r.request.params.get('accion')).toBe('TarifasActualizadas');
    r.flush([]);
  });

  it('historial mapea eventos a CambioTarifas[] ordenados desc', () => {
    let result: any[];
    svc.historial().subscribe((v) => (result = v));
    backend.expectOne((req) => req.url === '/api/admin/auditoria').flush([
      {
        id: 'ev1', actorId: 'u1', actor: 'admin', rol: 'ADMIN',
        accion: 'TarifasActualizadas', entidad: 'Tarifas', entidadId: null,
        resultado: 'EXITO', hashRegistro: 'h1', fecha: '2026-01-10T08:00:00Z',
        detalle: { 'Tarifa de servicio': '9 % → 10 %' },
      },
      {
        id: 'ev2', actorId: 'u1', actor: 'admin', rol: 'ADMIN',
        accion: 'TarifasActualizadas', entidad: 'Tarifas', entidadId: null,
        resultado: 'EXITO', hashRegistro: 'h2', fecha: '2026-01-15T12:00:00Z',
        detalle: { 'Tarifa de limpieza': '4 % → 5 %' },
      },
    ]);
    expect(result![0].fecha).toBe('2026-01-15T12:00:00Z');
    expect(result![1].fecha).toBe('2026-01-10T08:00:00Z');
    expect(result![0].usuario).toBe('admin');
  });

  it('propagates 403 on tarifas when not admin', () => {
    let err: any;
    svc.tarifas().subscribe({ error: (e) => (err = e) });
    backend.expectOne('/api/admin/tarifas').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(err.status).toBe(403);
  });
});
