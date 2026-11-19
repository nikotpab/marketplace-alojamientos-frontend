  import { provideHttpClient, withInterceptors } from '@angular/common/http';
  import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
  import { TestBed } from '@angular/core/testing';
  import { verificarContratoInterceptor } from '../testing/contrato';
  import { ReportesService } from './reportes.service';

  describe('ReportesService', () => {
    let svc: ReportesService;
    let backend: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
      svc = TestBed.inject(ReportesService);
      backend = TestBed.inject(HttpTestingController);
    });

    afterEach(() => backend.verify());

    it('exportar GET /api/admin/reportes con tipo y formato obligatorios', () => {
      svc.exportar({ tipo: 'RESERVAS', formato: 'PDF', desde: '2026-01-01', hasta: '2026-01-31' }).subscribe();
      const r = backend.expectOne((req) => req.url === '/api/admin/reportes');
      expect(r.request.method).toBe('GET');
      expect(r.request.params.get('tipo')).toBe('RESERVAS');
      expect(r.request.params.get('formato')).toBe('PDF');
      expect(r.request.params.get('desde')).toBe('2026-01-01');
      expect(r.request.params.get('hasta')).toBe('2026-01-31');
      r.flush(new Blob());
    });

    it('exportar envía ciudad cuando se indica', () => {
      svc.exportar({ tipo: 'USUARIOS', formato: 'EXCEL', desde: '2026-01-01', hasta: '2026-01-31', ciudad: 'Bogotá' }).subscribe();
      const r = backend.expectOne((req) => req.url === '/api/admin/reportes');
      expect(r.request.params.get('ciudad')).toBe('Bogotá');
      r.flush(new Blob());
    });

    it('exportar no envía ciudad cuando no se indica', () => {
      svc.exportar({ tipo: 'USUARIOS', formato: 'PDF', desde: '2026-01-01', hasta: '2026-01-31' }).subscribe();
      const r = backend.expectOne((req) => req.url === '/api/admin/reportes');
      expect(r.request.params.has('ciudad')).toBeFalse();
      r.flush(new Blob());
    });

    it('historial GET /api/admin/auditoria filtrando por ReporteExportado', () => {
      svc.historial().subscribe();
      const r = backend.expectOne((req) => req.url === '/api/admin/auditoria');
      expect(r.request.params.get('accion')).toBe('ReporteExportado');
      r.flush([]);
    });

    it('historial mapea eventos de auditoría a Exportacion[]', () => {
      let result: any[];
      svc.historial().subscribe((v) => (result = v));
      backend.expectOne((req) => req.url === '/api/admin/auditoria').flush([
        {
          id: 'ev1', actorId: 'u1', actor: 'admin', rol: 'ADMIN',
          accion: 'ReporteExportado', entidad: 'Reporte', entidadId: null,
          resultado: 'EXITO', hashRegistro: 'h1', fecha: '2026-01-15T10:00:00Z',
          detalle: { tipo: 'RESERVAS', formato: 'PDF', desde: '2026-01-01', hasta: '2026-01-31', ciudad: null, filas: 42 },
        },
      ]);
      expect(result![0].tipo).toBe('RESERVAS');
      expect(result![0].formato).toBe('PDF');
      expect(result![0].filas).toBe(42);
      expect(result![0].usuario).toBe('admin');
    });
  });
