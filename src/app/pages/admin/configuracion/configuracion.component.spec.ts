import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionComponent } from './configuracion.component';

const TARIFAS = {
  porcentajeServicio: 10, porcentajeLimpieza: null, porcentajeDescuento: 0, porcentajeDescuentoEstanciaLarga: 5, nochesEstanciaLarga: 7,
};
const CAMBIO = {
  id: 'a1', actorId: 'u1', actor: 'Admin Uno', rol: 'ADMINISTRADOR', accion: 'TarifasActualizadas', entidad: 'Tarifas',
  entidadId: null, resultado: 'EXITO', detalle: { 'Tarifa de servicio': '9 % → 10 %' }, hashRegistro: 'abc', fecha: '2026-11-20T15:00:00Z',
};
const ERROR = { status: 500, statusText: 'Server Error' };

describe('ConfiguracionComponent', () => {
  let fixture: ComponentFixture<ConfiguracionComponent>;
  let comp: ConfiguracionComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const historial = () =>
    http.expectOne((r) => r.url === '/api/admin/auditoria' && r.params.get('accion') === 'TarifasActualizadas');
  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;

  function crear(responder: (h: HttpTestingController) => void) {
    TestBed.configureTestingModule({ imports: [ConfiguracionComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConfiguracionComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    responder(http);
    fixture.detectChanges();
  }

  const cargada = () =>
    crear((h) => {
      h.expectOne('/api/admin/tarifas').flush(TARIFAS);
      historial().flush([CAMBIO]);
    });

  afterEach(() => http.verify());

  it('carga las tarifas, toma la limpieza sin configurar como 0 y muestra el historial', () => {
    cargada();
    expect(comp.form.getRawValue().porcentajeLimpieza).toBe(0);
    expect(raiz.textContent).toContain('Última modificación: Admin Uno');
    expect(raiz.textContent).toContain('Tarifa de servicio: 9 % → 10 %');
  });

  it('si no carga las tarifas lo dice, y sin historial no muestra cambios', () => {
    crear((h) => {
      h.expectOne('/api/admin/tarifas').flush(null, ERROR);
      historial().flush(null, ERROR);
    });
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos cargar la configuración');
    expect(comp.historial()).toEqual([]);
    expect(raiz.textContent).not.toContain('Cargando configuración');
  });

  it('sin cambios no abre la confirmación', () => {
    cargada();
    comp.revisar();
    fixture.detectChanges();
    expect(comp.diferencias()).toBeNull();
    expect(raiz.textContent).toContain('No hay cambios para guardar.');
  });

  it('un valor fuera de rango se marca y no abre la confirmación', () => {
    cargada();
    comp.form.controls.porcentajeServicio.setValue(150);
    comp.revisar();
    fixture.detectChanges();
    expect(comp.diferencias()).toBeNull();
    expect(raiz.textContent).toContain('Ingresa un valor entre 0 y 100.');
  });

  it('muestra el valor anterior y el nuevo, y al confirmar guarda y recarga el historial', () => {
    cargada();
    comp.form.controls.porcentajeServicio.setValue(12);
    comp.form.markAsDirty();
    comp.revisar();
    fixture.detectChanges();
    expect(comp.diferencias()).toEqual([{ texto: 'Tarifa de servicio', anterior: 10, nuevo: 12, unidad: '%' }]);
    expect(raiz.querySelector('app-dialogo')!.textContent).toContain('Tarifa de servicio: 10 % → 12 %');

    boton('Confirmar').click();
    const put = http.expectOne('/api/admin/tarifas');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ ...TARIFAS, porcentajeServicio: 12, porcentajeLimpieza: 0 });
    put.flush(null, { status: 204, statusText: 'No Content' });
    historial().flush([]);
    fixture.detectChanges();

    expect(comp.diferencias()).toBeNull();
    expect(comp.actual()!.porcentajeServicio).toBe(12);
    expect(raiz.textContent).toContain('Configuración guardada');
    expect(raiz.textContent).toContain('Aún no hay cambios registrados.');
  });

  it('si no guarda conserva los valores anteriores y lo dice', () => {
    cargada();
    comp.form.controls.nochesEstanciaLarga.setValue(10);
    comp.revisar();
    comp.guardar();
    http.expectOne('/api/admin/tarifas').flush(null, ERROR);
    fixture.detectChanges();
    expect(comp.diferencias()).toBeNull();
    expect(comp.guardando()).toBeFalse();
    expect(comp.actual()!.nochesEstanciaLarga).toBe(7);
    expect(raiz.textContent).toContain('Los valores anteriores siguen vigentes');
  });

  it('descartar vuelve a los valores vigentes', () => {
    cargada();
    comp.form.controls.porcentajeDescuento.setValue(30);
    comp.form.markAsDirty();
    comp.aviso.set('No hay cambios para guardar.');
    comp.descartar();
    expect(comp.form.getRawValue().porcentajeDescuento).toBe(0);
    expect(comp.aviso()).toBe('');
    expect(comp.form.pristine).toBeTrue();
  });
});
