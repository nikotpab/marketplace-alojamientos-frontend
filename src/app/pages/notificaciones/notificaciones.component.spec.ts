import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesComponent } from './notificaciones.component';

const LEIDA = { id: 'n1', tipo: 'ReservaConfirmada', mensaje: 'Tu reserva quedó confirmada.', leida: true, creadoEn: '2026-11-20T10:00:00Z' };
const NUEVA = { id: 'n2', tipo: 'EventoDesconocido', mensaje: 'Algo pasó.', leida: false, creadoEn: '2026-11-21T10:00:00Z' };

describe('NotificacionesComponent', () => {
  let fixture: ComponentFixture<NotificacionesComponent>;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  function crear(responder: () => void) {
    TestBed.configureTestingModule({ imports: [NotificacionesComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NotificacionesComponent);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    expect(raiz.textContent).toContain('Cargando…');
    responder();
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('muestra las notificaciones con su tipo y las nuevas sin leer', () => {
    crear(() => http.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [LEIDA, NUEVA] }));
    const items = raiz.querySelectorAll('.lista li');
    expect(raiz.querySelector('.sub')!.textContent).toContain('Tienes 1 sin leer.');
    expect(items[0].classList).toContain('nueva');
    expect(items[0].querySelector('.chip')!.textContent).toBe('Aviso');
    expect(items[1].querySelector('.chip')!.textContent).toBe('Reserva confirmada');
    expect(items[1].querySelector('button.leer')).toBeNull();
  });

  it('marcar una como leída la actualiza al instante', () => {
    crear(() => http.expectOne('/api/notificaciones').flush({ noLeidas: 1, notificaciones: [LEIDA, NUEVA] }));
    raiz.querySelector<HTMLButtonElement>('button.leer')!.click();
    http.expectOne('/api/notificaciones/n2/lectura').flush(null);
    fixture.detectChanges();
    expect(raiz.querySelector('.sub')!.textContent).toContain('Estás al día.');
    expect(raiz.querySelector<HTMLButtonElement>('button.todas')!.disabled).toBeTrue();
  });

  it('sin notificaciones lo dice', () => {
    crear(() => http.expectOne('/api/notificaciones').flush({ noLeidas: 0, notificaciones: [] }));
    expect(raiz.textContent).toContain('Aún no tienes notificaciones.');
  });

  it('si no cargan lo dice y permite reintentar', () => {
    crear(() => http.expectOne('/api/notificaciones').flush(null, { status: 503, statusText: 'Unavailable' }));
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos cargar tus notificaciones');

    raiz.querySelector<HTMLButtonElement>('button.reintentar')!.click();
    http.expectOne('/api/notificaciones').flush({ noLeidas: 0, notificaciones: [LEIDA] });
    fixture.detectChanges();
    expect(raiz.querySelectorAll('.lista li').length).toBe(1);
  });
});
