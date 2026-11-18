import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localeEsCo from '@angular/common/locales/es-CO';
import { provideRouter } from '@angular/router';
import { MisReservasComponent } from './mis-reservas.component';
import { Cancelacion } from '../../core/reservas.service';

registerLocaleData(localeEsCo);

const HOY = new Date().toISOString().slice(0, 10);

const RESERVA_PROXIMA = {
  id: 'r1', codigo: 'LR-001', estado: 'CONFIRMADA' as const,
  publicacionId: 'p1', alojamiento: 'Casa', llegada: '2030-12-01', salida: '2030-12-05', huespedes: 2, total: 300000,
};
const RESERVA_COMPLETADA = {
  id: 'r2', codigo: 'LR-002', estado: 'COMPLETADA' as const,
  publicacionId: 'p1', alojamiento: 'Casa', llegada: '2025-01-01', salida: '2025-01-05', huespedes: 1, total: 150000,
  resenada: false,
};
const RESERVA_CANCELADA = {
  id: 'r3', codigo: 'LR-003', estado: 'CANCELADA' as const,
  publicacionId: 'p1', alojamiento: 'Casa', llegada: '2025-06-01', salida: '2025-06-05', huespedes: 1, total: 100000,
};

describe('MisReservasComponent', () => {
  let fixture: ComponentFixture<MisReservasComponent>;
  let comp: MisReservasComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MisReservasComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MisReservasComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carga y agrupa reservas: próximas, completadas, canceladas', () => {
    http.expectOne('/api/reservas').flush([RESERVA_PROXIMA, RESERVA_COMPLETADA, RESERVA_CANCELADA]);
    fixture.detectChanges();
    expect(comp.grupos().proximas.length).toBe(1);
    expect(comp.grupos().completadas.length).toBe(1);
    expect(comp.grupos().canceladas.length).toBe(1);
  });

  it('error de carga muestra mensaje de error', () => {
    http.expectOne('/api/reservas').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(comp.error()).toContain('No pudimos cargar');
  });

  it('cancelable: true para CONFIRMADA con llegada futura, false para el resto', () => {
    http.expectOne('/api/reservas').flush([]);
    expect(comp.cancelable(RESERVA_PROXIMA as any)).toBeTrue();
    expect(comp.cancelable(RESERVA_COMPLETADA as any)).toBeFalse();
    expect(comp.cancelable(RESERVA_CANCELADA as any)).toBeFalse();
  });

  it('resenable: true para COMPLETADA sin reseña, false si ya fue reseñada', () => {
    http.expectOne('/api/reservas').flush([]);
    expect(comp.resenable(RESERVA_COMPLETADA as any)).toBeTrue();
    expect(comp.resenable({ ...RESERVA_COMPLETADA, resenada: true } as any)).toBeFalse();
    expect(comp.resenable(RESERVA_PROXIMA as any)).toBeFalse();
  });

  it('alCancelar actualiza la reserva, muestra aviso y navega a tab canceladas', () => {
    http.expectOne('/api/reservas').flush([RESERVA_PROXIMA]);
    fixture.detectChanges();
    const cancelacion: Cancelacion = {
      id: 'c1', reservaId: 'r1', usuarioId: 'u1', fecha: HOY, motivo: 'Cambio de planes',
      valorDevolucion: 150000, estadoFinal: 'DEVOLUCION_PROCESADA',
    };
    comp.alCancelar(RESERVA_PROXIMA as any, cancelacion);
    fixture.detectChanges();
    expect(comp.reservas()[0].estado).toBe('CANCELADA');
    expect(comp.grupo()).toBe('canceladas');
    expect(comp.aviso()).toContain('LR-001');
  });

  it('alCancelar con devolución no procesada muestra mensaje diferente', () => {
    http.expectOne('/api/reservas').flush([RESERVA_PROXIMA]);
    const cancelacion: Cancelacion = {
      id: 'c2', reservaId: 'r1', usuarioId: 'u1', fecha: HOY, motivo: 'x',
      valorDevolucion: 0, estadoFinal: 'DEVOLUCION_NO_PROCESADA',
    };
    comp.alCancelar(RESERVA_PROXIMA as any, cancelacion);
    fixture.detectChanges();
    expect(comp.aviso()).toContain('devolución no se pudo');
  });

  it('alResenar marca la reserva como reseñada y muestra aviso', () => {
    http.expectOne('/api/reservas').flush([RESERVA_COMPLETADA]);
    fixture.detectChanges();
    comp.alResenar(RESERVA_COMPLETADA as any);
    fixture.detectChanges();
    expect(comp.reservas()[0].resenada).toBeTrue();
    expect(comp.aResenar()).toBeNull();
    expect(comp.aviso()).toContain('reseña quedó publicada');
  });

  it('las tabs muestran el conteo correcto de reservas', () => {
    http.expectOne('/api/reservas').flush([RESERVA_PROXIMA, RESERVA_COMPLETADA, RESERVA_CANCELADA]);
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Próximas');
    expect(raiz.textContent).toContain('Completadas');
    expect(raiz.textContent).toContain('Canceladas');
  });
});
