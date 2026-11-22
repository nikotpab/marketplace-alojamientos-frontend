import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLAZO_DASHBOARD_MS } from '../../../core/indicadores.service';
import { DashboardComponent } from './dashboard.component';

const DATOS = {
  desde: '2026-10-23', hasta: '2026-11-22', usuarios: 1200, publicacionesActivas: 85,
  reservasPorEstado: { CONFIRMADA: 6, COMPLETADA: 3, CANCELADA: 1 }, ingresosEstimados: 450000,
  ciudadesConMayorDemanda: ['Cartagena', 'Medellín'],
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let comp: DashboardComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const consulta = () => http.expectOne((r) => r.url === '/api/admin/dashboard');
  const chip = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('.periodos button')].find((b) => b.textContent!.includes(texto))!;

  function crear() {
    TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
  }

  afterEach(() => http.verify());

  it('consulta los últimos 30 días y muestra los indicadores y el reparto por estado', () => {
    crear();
    const peticion = consulta();
    expect(peticion.request.params.get('hasta')).toBe(iso(new Date()));
    peticion.flush(DATOS);
    fixture.detectChanges();

    const kpis = raiz.querySelector('.kpis')!.textContent!;
    expect(kpis).toContain('1,200');
    expect(kpis).toContain('85');
    expect(comp.totalReservas()).toBe(10);
    expect(raiz.querySelector<HTMLElement>('[data-estado="CONFIRMADA"]')!.style.width).toBe('60%');
    expect(raiz.querySelector<HTMLElement>('[data-estado="EN_REVISION"]')!.style.width).toBe('0%');
    expect(raiz.querySelector('.ranking')!.textContent).toContain('Cartagena');
  });

  it('sin reservas muestra el ranking vacío y las barras en cero', () => {
    crear();
    consulta().flush({ ...DATOS, reservasPorEstado: {}, ciudadesConMayorDemanda: [] });
    fixture.detectChanges();
    expect(comp.totalReservas()).toBe(0);
    expect(comp.porcentaje(0, 0)).toBe(0);
    expect(raiz.textContent).toContain('Sin reservas en el periodo.');
  });

  it('cambiar de periodo vuelve a consultar con el rango del periodo', () => {
    crear();
    consulta().flush(DATOS);
    fixture.detectChanges();

    chip('Últimos 7 días').click();
    expect(consulta().request.params.get('desde')).toBe(iso(new Date(Date.now() - 7 * 86_400_000)));

    chip('Este año').click();
    const anio = consulta();
    expect(anio.request.params.get('desde')).toBe(`${new Date().getFullYear()}-01-01`);
    anio.flush(DATOS);
  });

  it('el periodo personalizado espera a que se aplique un rango válido', () => {
    crear();
    consulta().flush(DATOS);
    fixture.detectChanges();

    chip('Personalizado').click();
    fixture.detectChanges();
    http.expectNone((r) => r.url === '/api/admin/dashboard');
    expect(raiz.querySelector('form.admin-filtros')).not.toBeNull();

    comp.desde = '2026-11-10';
    comp.hasta = '2026-11-01';
    expect(comp.rangoInvalido).toBeTrue();
    comp.consultar();
    http.expectNone((r) => r.url === '/api/admin/dashboard');

    comp.hasta = '2026-11-20';
    comp.consultar();
    const peticion = consulta();
    expect(peticion.request.params.get('desde')).toBe('2026-11-10');
    expect(peticion.request.params.get('hasta')).toBe('2026-11-20');
    peticion.flush(DATOS);
  });

  it('si falla lo dice y permite reintentar', () => {
    crear();
    consulta().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const alerta = raiz.querySelector('[role="alert"]')!;
    expect(alerta.textContent).toContain('No pudimos cargar los indicadores');

    alerta.querySelector('button')!.click();
    consulta().flush(DATOS);
    fixture.detectChanges();
    expect(comp.error()).toBe('');
    expect(raiz.querySelector('.kpis')).not.toBeNull();
  });

  it('si tarda más del plazo deja de esperar y lo dice', fakeAsync(() => {
    crear();
    const peticion = consulta();
    tick(PLAZO_DASHBOARD_MS);
    expect(peticion.cancelled).toBeTrue();
    expect(comp.cargando()).toBeFalse();
    expect(comp.error()).toContain('tardaron demasiado');
  }));
});
