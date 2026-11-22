import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventoAuditoria } from '../../../core/auditoria.service';
import { AuditoriaComponent } from './auditoria.component';

const evento = (n: number, cambios: Partial<EventoAuditoria> = {}): EventoAuditoria => ({
  id: `e${n}`, actorId: 'u1', actor: 'Ana Admin', rol: 'ADMINISTRADOR', accion: 'PublicacionAprobada', entidad: 'Publicacion',
  entidadId: `p${n}`, resultado: 'EXITO', detalle: null, hashRegistro: '0123456789abcdef', fecha: `2026-11-${String(n % 28 + 1).padStart(2, '0')}T10:00:00Z`,
  ...cambios,
});

describe('AuditoriaComponent', () => {
  let fixture: ComponentFixture<AuditoriaComponent>;
  let comp: AuditoriaComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const consulta = () => http.expectOne((r) => r.url === '/api/admin/auditoria');

  function crear(eventos: EventoAuditoria[]) {
    TestBed.configureTestingModule({ imports: [AuditoriaComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AuditoriaComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    consulta().flush(eventos);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('muestra los eventos del más reciente al más antiguo con su resultado y su detalle', () => {
    crear([
      evento(1, { resultado: 'FALLIDO', actor: null, rol: null, entidadId: null }),
      evento(3, { resultado: 'DENEGADO', detalle: { 'Tarifa de servicio': '9 % → 10 %', filas: 3, ok: true, lista: [1] } }),
      evento(2),
    ]);
    const filas = raiz.querySelectorAll('tbody tr');
    expect(raiz.querySelector('.total')!.textContent).toContain('3 eventos');
    expect(filas[0].textContent).toContain('Denegado');
    expect(filas[0].textContent).toContain('Tarifa de servicio: 9 % → 10 % · filas: 3 · ok: true · lista: [1]');
    expect(filas[0].textContent).toContain('#p3');
    expect(filas[1].textContent).toContain('Éxito');
    expect(filas[2].textContent).toContain('Fallido');
    expect(filas[2].textContent).toContain('Sistema');
    expect(filas[2].textContent).toContain('Hash 0123456789…');
  });

  it('filtra por usuario en la lista ya cargada', () => {
    crear([evento(1), evento(2, { actor: 'Bruno' }), evento(3, { actor: null })]);
    comp.usuario.set('bru');
    fixture.detectChanges();
    expect(comp.filtrados().map((e) => e.id)).toEqual(['e2']);
    expect(raiz.querySelector('.total')!.textContent).toContain('1 evento');
  });

  it('sin eventos lo dice', () => {
    crear([]);
    expect(raiz.textContent).toContain('No hay eventos con estos filtros.');
    expect(raiz.querySelector('.paginacion')).toBeNull();
  });

  it('pagina de a 25 eventos', () => {
    crear(Array.from({ length: 30 }, (_, i) => evento(i)));
    expect(raiz.querySelectorAll('tbody tr').length).toBe(25);
    expect(raiz.querySelector('.paginacion')!.textContent).toContain('Página 1 de 2');

    [...raiz.querySelectorAll<HTMLButtonElement>('.paginacion button')].find((b) => b.textContent!.includes('Siguiente'))!.click();
    fixture.detectChanges();
    expect(raiz.querySelectorAll('tbody tr').length).toBe(5);
    expect(raiz.querySelector('.paginacion')!.textContent).toContain('Página 2 de 2');
  });

  it('envía solo los filtros elegidos', () => {
    crear([]);
    comp.filtros = { accion: 'ReservaCancelada', entidad: '', desde: '2026-11-01', hasta: '2026-11-30', resultado: 'FALLIDO' };
    comp.consultar();
    const peticion = consulta();
    expect(peticion.request.params.keys().sort()).toEqual(['accion', 'desde', 'hasta', 'resultado']);
    peticion.flush([]);
  });

  it('no consulta con la fecha final antes de la inicial', () => {
    crear([]);
    comp.filtros = { ...comp.filtros, desde: '2026-11-30', hasta: '2026-11-01' };
    expect(comp.rangoInvalido).toBeTrue();
    comp.consultar();
    http.expectNone((r) => r.url === '/api/admin/auditoria');
  });

  it('limpiar quita los filtros y vuelve a consultar', () => {
    crear([evento(1)]);
    comp.filtros.accion = 'ReservaCancelada';
    comp.usuario.set('ana');
    comp.limpiar();
    const peticion = consulta();
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush([]);
    expect(comp.usuario()).toBe('');
  });

  it('si la consulta falla lo dice', () => {
    crear([]);
    comp.consultar();
    consulta().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos consultar la auditoría');
    expect(comp.cargando()).toBeFalse();
  });

  it('un detalle vacío no muestra texto', () => {
    crear([]);
    expect(comp.textoDetalle(null)).toBe('');
  });
});
