import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportesComponent } from './reportes.component';

const EXPORTACION = {
  id: 'e1', actorId: 'u1', actor: 'Admin Uno', rol: 'ADMINISTRADOR', accion: 'ReporteExportado', entidad: 'Reporte', entidadId: null,
  resultado: 'EXITO', hashRegistro: 'h', fecha: '2026-11-20T15:00:00Z',
  detalle: { tipo: 'RESERVAS', formato: 'PDF', desde: '2026-10-01', hasta: '2026-10-31', ciudad: 'null', filas: 12 },
};
const SIN_PERIODO = { ...EXPORTACION, id: 'e2', fecha: '2026-11-19T15:00:00Z', detalle: { tipo: 'OTRO', formato: 'EXCEL', ciudad: 'Cali' } };

describe('ReportesComponent', () => {
  let fixture: ComponentFixture<ReportesComponent>;
  let comp: ReportesComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let clic: jasmine.Spy;

  const historial = () => http.expectOne((r) => r.url === '/api/admin/auditoria' && r.params.get('accion') === 'ReporteExportado');
  const reporte = () => http.expectOne((r) => r.url === '/api/admin/reportes');

  beforeEach(() => {
    clic = spyOn(HTMLAnchorElement.prototype, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:reporte');
    spyOn(URL, 'revokeObjectURL');
    TestBed.configureTestingModule({ imports: [ReportesComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReportesComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    historial().flush([SIN_PERIODO, EXPORTACION]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('muestra el historial de exportaciones con sus filtros, el más reciente primero', () => {
    const filas = raiz.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Reservas');
    expect(filas[0].textContent).toContain('PDF');
    expect(filas[0].textContent).toContain('Todas las ciudades');
    expect(filas[0].textContent).toContain('12');
    expect(filas[1].textContent).toContain('OTRO');
    expect(filas[1].textContent).toContain('Excel');
    expect(filas[1].textContent).toContain('Todo el periodo');
    expect(filas[1].textContent).toContain('Cali');
    expect(filas[1].textContent).toContain('—');
  });

  it('exporta con los filtros, descarga el archivo con el nombre del servidor y recarga el historial', () => {
    jasmine.clock().install();
    comp.solicitud = { tipo: 'USUARIOS', formato: 'EXCEL', desde: '2026-10-01', hasta: '2026-10-31', ciudad: '  Bogotá ' };
    comp.exportar();
    const peticion = reporte();
    expect(peticion.request.params.get('tipo')).toBe('USUARIOS');
    expect(peticion.request.params.get('ciudad')).toBe('Bogotá');
    peticion.flush(new Blob(['x']), { headers: { 'Content-Disposition': `attachment; filename*=UTF-8''usuarios%20octubre.xlsx` } });
    historial().flush([]);
    fixture.detectChanges();

    const enlace = clic.calls.mostRecent().object as HTMLAnchorElement;
    expect(enlace.download).toBe('usuarios octubre.xlsx');
    expect(comp.generando()).toBeFalse();
    expect(raiz.textContent).toContain('Reporte generado');
    jasmine.clock().tick(1000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reporte');
    jasmine.clock().uninstall();
  });

  it('sin nombre del servidor arma uno con el tipo, el periodo y el formato', () => {
    comp.solicitud = { tipo: 'INGRESOS_DEMANDA', formato: 'PDF', desde: '2026-10-01', hasta: '2026-10-31', ciudad: '' };
    comp.exportar();
    const peticion = reporte();
    expect(peticion.request.params.has('ciudad')).toBeFalse();
    peticion.flush(new Blob(['x']));
    historial().flush([]);
    expect((clic.calls.mostRecent().object as HTMLAnchorElement).download).toBe('reporte-ingresos_demanda-2026-10-01-a-2026-10-31.pdf');
  });

  it('una respuesta sin archivo no descarga nada', () => {
    comp.exportar();
    reporte().flush(null);
    historial().flush([]);
    expect(clic).not.toHaveBeenCalled();
  });

  it('no exporta con la fecha final antes de la inicial', () => {
    comp.solicitud = { ...comp.solicitud, desde: '2026-10-31', hasta: '2026-10-01' };
    expect(comp.rangoInvalido).toBeTrue();
    comp.exportar();
    http.expectNone((r) => r.url === '/api/admin/reportes');
  });

  it('un 400 pide revisar el periodo y otro error pide intentar de nuevo', () => {
    comp.exportar();
    reporte().flush(null, { status: 400, statusText: 'Bad Request' });
    expect(comp.error()).toContain('Revisa el periodo');

    comp.exportar();
    reporte().flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.error()).toBe('No pudimos generar el reporte. Intenta de nuevo.');
    expect(comp.generando()).toBeFalse();
  });

  it('si el historial no carga lo deja vacío', () => {
    comp.cargarHistorial();
    historial().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Aún no hay exportaciones.');
  });
});
