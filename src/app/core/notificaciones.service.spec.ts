import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { verificarContratoInterceptor } from '../testing/contrato';
import { Notificacion, NotificacionesService } from './notificaciones.service';

const N1: Notificacion = { id: 'n1', tipo: 'ReservaConfirmada', mensaje: 'Reserva confirmada', leida: false, creadoEn: '2026-01-02T10:00:00Z' };
const N2: Notificacion = { id: 'n2', tipo: 'ReservaCancelada', mensaje: 'Cancelada', leida: true, creadoEn: '2026-01-01T08:00:00Z' };

describe('NotificacionesService', () => {
  let svc: NotificacionesService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([verificarContratoInterceptor])), provideHttpClientTesting()] });
    svc = TestBed.inject(NotificacionesService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('cargar GET /api/notificaciones y popula la señal en orden descendente', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [N2, N1] });
    expect(svc.notificaciones()[0].id).toBe('n1');
    expect(svc.notificaciones()[1].id).toBe('n2');
    expect(svc.cargando()).toBeFalse();
    expect(svc.error()).toBeFalse();
  });

  it('cargar con error activa la señal de error', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({}, { status: 503, statusText: 'Service Unavailable' });
    expect(svc.error()).toBeTrue();
    expect(svc.cargando()).toBeFalse();
  });

  it('noLeidas computed cuenta las no leídas', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [N1, N2] });
    expect(svc.noLeidas()).toBe(1);
  });

  it('marcarLeida POST /api/notificaciones/{id}/lectura y actualiza local', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [N1] });
    svc.marcarLeida('n1');
    backend.expectOne('/api/notificaciones/n1/lectura').flush({});
    expect(svc.notificaciones()[0].leida).toBeTrue();
  });

  it('marcarTodas POST /api/notificaciones/lectura y actualiza todas localmente', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [N1] });
    svc.marcarTodas();
    backend.expectOne('/api/notificaciones/lectura').flush({});
    expect(svc.noLeidas()).toBe(0);
  });

  it('limpiar vacía la lista', () => {
    svc.cargar();
    backend.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [N1] });
    svc.limpiar();
    expect(svc.notificaciones()).toEqual([]);
  });
});
