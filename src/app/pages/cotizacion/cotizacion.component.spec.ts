import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Cotizacion } from '../../core/cotizacion.service';
import { CotizacionComponent } from './cotizacion.component';

registerLocaleData(localeEsCo);

const COTIZACION: Cotizacion = {
  noches: 3,
  precioNoche: 200000,
  subtotal: 600000,
  tarifaLimpieza: 0,
  porcentajeServicio: 10,
  tarifaServicio: 60000,
  descuentos: [],
  adicionales: [],
  total: 660000,
  moneda: 'COP',
  adicionalesDisponibles: [],
};

describe('CotizacionComponent (flujo de cotización y pago)', () => {
  let backend: HttpTestingController;
  let pagina: CotizacionComponent;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'alojamientos/:id/cotizar', component: CotizacionComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
    pagina = await harness.navigateByUrl('/alojamientos/p1/cotizar?llegada=2026-12-09&salida=2026-12-12', CotizacionComponent);
    backend.expectOne('/api/alojamientos/p1').flush({ id: 'p1', titulo: 'Casa campestre', ciudad: 'Villa de Leyva', capacidad: 4 });
  });

  afterEach(() => backend.verify());

  it('pide la cotización con las fechas de la URL y muestra el total', () => {
    const req = backend.expectOne('/api/cotizaciones');
    expect(req.request.body).toEqual(jasmine.objectContaining({ publicacionId: 'p1', llegada: '2026-12-09', salida: '2026-12-12', huespedes: 1 }));
    req.flush(COTIZACION);
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('660.000');
  });

  it('confirma la reserva con la clave de idempotencia y el método de pago de prueba', () => {
    backend.expectOne('/api/cotizaciones').flush(COTIZACION);
    pagina.confirmar('pm_card_visa');

    const req = backend.expectOne('/api/reservas');
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    expect(req.request.body.metodoPagoId).toBe('pm_card_visa');
    req.flush({ id: 'r1', codigo: 'LR-2026-0001', estado: 'CONFIRMADA', publicacionId: 'p1', llegada: '2026-12-09',
      salida: '2026-12-12', huespedes: 1, total: 660000 });
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('LR-2026-0001');
  });

  it('un pago rechazado no confirma la reserva y el reintento usa otra clave', () => {
    backend.expectOne('/api/cotizaciones').flush(COTIZACION);

    pagina.confirmar('pm_card_chargeDeclined');
    const primero = backend.expectOne('/api/reservas');
    const clave1 = primero.request.headers.get('Idempotency-Key');
    primero.flush({ detail: 'Pago rechazado' }, { status: 402, statusText: 'Payment Required' });
    expect(pagina.reserva()).toBeNull();
    expect(pagina.errorReserva()).toContain('rechazado');

    pagina.confirmar('pm_card_visa');
    const segundo = backend.expectOne('/api/reservas');
    expect(segundo.request.headers.get('Idempotency-Key')).not.toBe(clave1);
    segundo.flush({}, { status: 503, statusText: 'Service Unavailable' });
  });

  it('si la pasarela no responde, el reintento conserva la clave para no cobrar dos veces', () => {
    backend.expectOne('/api/cotizaciones').flush(COTIZACION);

    pagina.confirmar('pm_card_visa');
    const primero = backend.expectOne('/api/reservas');
    const clave = primero.request.headers.get('Idempotency-Key');
    primero.flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(pagina.errorReserva()).toContain('no se procesó');

    pagina.confirmar('pm_card_visa');
    const segundo = backend.expectOne('/api/reservas');
    expect(segundo.request.headers.get('Idempotency-Key')).toBe(clave);
    segundo.flush({}, { status: 503, statusText: 'Service Unavailable' });
  });
});
