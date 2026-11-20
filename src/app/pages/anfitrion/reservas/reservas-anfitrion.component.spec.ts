import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEsCo from '@angular/common/locales/es-CO';
import { ReservasAnfitrionComponent } from './reservas-anfitrion.component';

registerLocaleData(localeEsCo);

const RESERVAS = [
  {
    id: 'r1', codigo: 'LR-001', estado: 'CONFIRMADA', publicacionId: 'p1', alojamiento: 'Casa del lago',
    llegada: '2030-12-01', salida: '2030-12-05', huespedes: 2, total: 400000,
    contactoHuesped: { telefono: '3001234567', correo: 'h@correo.co' },
  },
  {
    id: 'r2', codigo: 'LR-002', estado: 'COMPLETADA', publicacionId: 'p1', alojamiento: 'Casa del lago',
    llegada: '2026-01-01', salida: '2026-01-05', huespedes: 1, total: 200000,
    contactoHuesped: null,
  },
];

describe('ReservasAnfitrionComponent', () => {
  let fixture: ComponentFixture<ReservasAnfitrionComponent>;
  let comp: ReservasAnfitrionComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReservasAnfitrionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReservasAnfitrionComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carga las reservas y las muestra todas por defecto', () => {
    http.expectOne('/api/reservas').flush(RESERVAS);
    fixture.detectChanges();
    expect(comp.reservas().length).toBe(2);
    expect(comp.visibles().length).toBe(2);
    expect(raiz.textContent).toContain('Casa del lago');
  });

  it('SCRUM-113: muestra el nombre del huésped también en las reservas sin contacto', () => {
    http.expectOne('/api/reservas').flush(RESERVAS.map((r) => ({ ...r, nombreHuesped: 'Laura Gómez' })));
    fixture.detectChanges();
    const huespedes = [...raiz.querySelectorAll('.huesped')].map((p) => p.textContent!.replace(/\s+/g, ' ').trim());
    expect(huespedes[0]).toContain('Laura Gómez · 3001234567');
    expect(huespedes[1]).toContain('Laura Gómez');
    expect(huespedes[1]).toContain('Contacto visible solo en reservas confirmadas');
  });

  it('error de red muestra mensaje de error', () => {
    http.expectOne('/api/reservas').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(comp.error()).toContain('No pudimos cargar');
    expect(raiz.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cargar');
  });

  it('filtrar por COMPLETADA muestra solo las completadas', () => {
    http.expectOne('/api/reservas').flush(RESERVAS);
    fixture.detectChanges();
    comp.filtro.set('COMPLETADA');
    fixture.detectChanges();
    expect(comp.visibles().length).toBe(1);
    expect(comp.visibles()[0].id).toBe('r2');
  });

  it('verContacto es true solo para CONFIRMADA con datos de contacto', () => {
    http.expectOne('/api/reservas').flush(RESERVAS);
    expect(comp.verContacto(RESERVAS[0] as any)).toBeTrue();
    expect(comp.verContacto(RESERVAS[1] as any)).toBeFalse();
  });

  it('filtro TODAS muestra todas las reservas', () => {
    http.expectOne('/api/reservas').flush(RESERVAS);
    fixture.detectChanges();
    comp.filtro.set('CONFIRMADA');
    fixture.detectChanges();
    comp.filtro.set('TODAS');
    fixture.detectChanges();
    expect(comp.visibles().length).toBe(2);
  });
});
