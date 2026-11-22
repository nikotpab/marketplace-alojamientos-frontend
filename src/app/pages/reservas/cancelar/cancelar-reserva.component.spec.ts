import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cancelacion, Reserva } from '../../../core/reservas.service';
import { CancelarReservaComponent } from './cancelar-reserva.component';

const RESERVA: Reserva = {
  id: 'r1', codigo: 'LR-1234', estado: 'CONFIRMADA', publicacionId: 'p1', alojamiento: 'Casa del lago',
  llegada: '2099-01-10', salida: '2099-01-12', huespedes: 2, total: 500000,
};
const ESTIMACION = '/api/reservas/r1/cancelacion/estimacion';
const CANCELACION = '/api/reservas/r1/cancelacion';

describe('CancelarReservaComponent', () => {
  let fixture: ComponentFixture<CancelarReservaComponent>;
  let comp: CancelarReservaComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let canceladas: Cancelacion[];
  let cerrado: boolean;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const alerta = () => raiz.querySelector('[role="alert"]')?.textContent?.trim();

  function crear(reserva: Reserva = RESERVA) {
    TestBed.configureTestingModule({ imports: [CancelarReservaComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CancelarReservaComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('reserva', reserva);
    canceladas = [];
    cerrado = false;
    comp.cancelada.subscribe((c) => canceladas.push(c));
    comp.cerrar.subscribe(() => (cerrado = true));
    fixture.detectChanges();
  }

  /** Escribe el motivo y pasa a la revisión con la devolución estimada. */
  function aRevision() {
    comp.motivo = '  Cambio de planes  ';
    boton('Ver devolución').click();
    http.expectOne(ESTIMACION).flush({ valorDevolucion: 300000, politica: 'Flexible' });
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('muestra la reserva y pide el motivo', () => {
    crear();
    expect(raiz.textContent).toContain('Casa del lago');
    expect(raiz.textContent).toContain('Código LR-1234');
    expect(raiz.querySelector('textarea')).not.toBeNull();
  });

  it('sin título del alojamiento usa un texto genérico', () => {
    crear({ ...RESERVA, alojamiento: undefined });
    expect(raiz.querySelector('strong')!.textContent).toBe('Alojamiento');
  });

  it('exige un motivo de al menos 5 caracteres antes de calcular la devolución', () => {
    crear();
    comp.motivo = ' ab ';
    boton('Ver devolución').click();
    fixture.detectChanges();
    http.expectNone(ESTIMACION);
    expect(alerta()).toContain('mínimo 5 caracteres');
  });

  it('muestra la devolución y al confirmar cancela con el motivo sin espacios', () => {
    crear();
    aRevision();
    expect(raiz.querySelector('.devolucion')!.textContent).toContain('Flexible');
    expect(raiz.querySelector('.devolucion .total')!.textContent).toContain('300,000');

    boton('Confirmar cancelación').click();
    const post = http.expectOne(CANCELACION);
    expect(post.request.body).toEqual({ motivo: 'Cambio de planes' });
    const cancelacion = { fecha: '2099-01-01T10:00:00Z', motivo: 'Cambio de planes', valorDevolucion: 300000 } as Cancelacion;
    post.flush(cancelacion);
    expect(canceladas).toEqual([cancelacion]);
    expect(comp.procesando()).toBeFalse();
  });

  it('si no se puede estimar muestra el motivo del backend o un mensaje general', () => {
    crear();
    comp.motivo = 'Cambio de planes';
    comp.revisar();
    http.expectOne(ESTIMACION).flush({ detail: 'La estadía ya comenzó.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(alerta()).toBe('La estadía ya comenzó.');

    comp.revisar();
    http.expectOne(ESTIMACION).flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.error()).toContain('No pudimos calcular la devolución');
    expect(comp.paso()).toBe('motivo');
  });

  it('si no se puede cancelar lo explica y la reserva sigue confirmada', () => {
    crear();
    aRevision();

    comp.confirmar();
    http.expectOne(CANCELACION).flush({ detail: 'Ya fue cancelada.' }, { status: 409, statusText: 'Conflict' });
    expect(comp.error()).toBe('Ya fue cancelada.');

    comp.confirmar();
    http.expectOne(CANCELACION).flush(null, { status: 409, statusText: 'Conflict' });
    expect(comp.error()).toContain('ya no se puede cancelar');

    comp.confirmar();
    http.expectOne(CANCELACION).flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(alerta()).toContain('Tu reserva sigue confirmada');
    expect(canceladas).toEqual([]);
  });

  it('mientras procesa no repite la petición', () => {
    crear();
    comp.motivo = 'Cambio de planes';
    comp.revisar();
    comp.revisar();
    comp.confirmar();
    http.expectOne(ESTIMACION).flush({ valorDevolucion: 0, politica: 'Estricta' });
    http.expectNone(CANCELACION);
    expect(comp.paso()).toBe('revision');
  });

  it('Volver y Mantener mi reserva cierran sin cancelar', () => {
    crear();
    boton('Volver').click();
    expect(cerrado).toBeTrue();

    cerrado = false;
    aRevision();
    boton('Mantener mi reserva').click();
    expect(cerrado).toBeTrue();
    expect(canceladas).toEqual([]);
  });
});
