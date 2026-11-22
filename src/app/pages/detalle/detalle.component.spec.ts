import { PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AlojamientoDetalle } from '../../core/detalle.service';
import { DetalleComponent } from './detalle.component';

const ALOJAMIENTO: AlojamientoDetalle = {
  id: 'a1', titulo: 'Casa del lago', descripcion: 'Frente al embalse', ciudad: 'Guatavita', direccion: 'Vereda 1', tipo: 'CASA',
  capacidad: 4, precioNoche: 200000, servicios: ['Wifi'], reglas: ['No fumar'], politicaCancelacion: 'Flexible',
  imagenes: Array.from({ length: 6 }, (_, i) => `https://img.com/${i + 1}.jpg`), calificacionPromedio: 4.5, resenas: [], estado: 'ACTIVA',
};

describe('DetalleComponent', () => {
  let fixture: ComponentFixture<DetalleComponent>;
  let comp: DetalleComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const disponibilidad = () => http.expectOne((r) => r.url === '/api/publicaciones/a1/disponibilidad');

  function crear(responder: () => void, activa = true) {
    TestBed.configureTestingModule({
      imports: [DetalleComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'a1' }) } } },
        // Las imágenes de prueba no salen de un dominio real: no hace falta revisar su preconexión.
        { provide: PRECONNECT_CHECK_BLOCKLIST, useValue: ['https://img.com'] },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalleComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    responder();
    fixture.detectChanges();
    if (comp.alojamiento()) {
      http.expectOne('/api/publicaciones/a1/resenas').flush([]);
      if (activa) disponibilidad().flush({ bloqueados: ['2099-01-03'], reservados: [] });
      fixture.detectChanges();
    }
  }

  const cargado = (a: Partial<AlojamientoDetalle> = {}) =>
    crear(() => http.expectOne('/api/alojamientos/a1').flush({ ...ALOJAMIENTO, ...a }), (a.estado ?? 'ACTIVA') === 'ACTIVA');

  afterEach(() => http.verify());

  it('muestra el alojamiento, su tipo, su calificación y el calendario', () => {
    cargado();
    expect(raiz.querySelector('h1')!.textContent).toContain('Casa del lago');
    expect(raiz.querySelector('.meta')!.textContent).toContain('Casa');
    expect(raiz.querySelector('.meta')!.textContent).toContain('★ 4.5');
    expect(raiz.querySelector('app-calendario')).not.toBeNull();
    expect(raiz.querySelectorAll('.galeria button.foto').length).toBe(5);
    expect(comp.disponibilidad().bloqueados).toEqual(['2099-01-03']);
    expect(raiz.textContent).toContain('Elige tus fechas en el calendario');
  });

  it('sin imágenes ni calificación lo indica', () => {
    cargado({ imagenes: [], calificacionPromedio: null, tipo: 'OTRO' });
    expect(raiz.textContent).toContain('Sin imágenes');
    expect(raiz.querySelector('.meta')!.textContent).not.toContain('★');
    expect(comp.tipoTexto()).toBe('');
  });

  it('un alojamiento no activo no muestra el calendario ni permite reservar', () => {
    cargado({ estado: 'PAUSADA' });
    expect(raiz.querySelector('app-calendario')).toBeNull();
    expect(raiz.textContent).toContain('no está disponible para reservas');
    expect(raiz.querySelector('.barra-movil')!.textContent).toContain('No disponible');
  });

  it('un alojamiento inexistente y un fallo dan mensajes distintos', () => {
    crear(() => http.expectOne('/api/alojamientos/a1').flush(null, { status: 404, statusText: 'Not Found' }));
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('no existe o ya no está disponible');

    TestBed.resetTestingModule();
    crear(() => http.expectOne('/api/alojamientos/a1').flush(null, { status: 500, statusText: 'Server Error' }));
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos cargar el alojamiento');
  });

  it('el visor abre todas las fotos y pasa de una a otra en círculo', () => {
    cargado();
    raiz.querySelector<HTMLButtonElement>('.galeria .todas')!.click();
    fixture.detectChanges();
    const visor = raiz.querySelector<HTMLDialogElement>('dialog.visor')!;
    expect(visor.open).toBeTrue();
    expect(visor.textContent).toContain('1 / 6');

    visor.querySelector<HTMLButtonElement>('.anterior')!.click();
    fixture.detectChanges();
    expect(comp.visor()).toBe(5);
    visor.querySelector<HTMLButtonElement>('.siguiente')!.click();
    expect(comp.visor()).toBe(0);

    visor.querySelector<HTMLButtonElement>('.cerrar')!.click();
    fixture.detectChanges();
    expect(raiz.querySelector('dialog.visor')).toBeNull();
    comp.mover(1, 6);
    expect(comp.visor()).toBeNull();
  });

  it('cuenta las noches del rango y permite cotizar', () => {
    cargado();
    comp.rango.set({ desde: '2099-01-10', hasta: '2099-01-12' });
    fixture.detectChanges();
    expect(comp.noches()).toBe(2);
    expect(raiz.querySelector('.reserva .noches')!.textContent).toContain('2 noches');
    expect(raiz.querySelector('.barra-movil')!.textContent).toContain('Cotizar');

    comp.rango.set({ desde: '2099-01-10', hasta: '2099-01-10' });
    fixture.detectChanges();
    expect(comp.noches()).toBe(0);
    expect(raiz.textContent).toContain('Elige la fecha de salida');
  });

  it('avisa si el rango cruza fechas no disponibles', () => {
    cargado();
    comp.rango.set({ desde: '2099-01-01', hasta: '2099-01-05' });
    fixture.detectChanges();
    expect(comp.cruzaNoDisponibles()).toBeTrue();
    expect(raiz.textContent).toContain('Tu selección incluye fechas no disponibles');
    expect(raiz.querySelector('.barra-movil a')!.textContent).toContain('Elegir fechas');
  });

  it('Elegir fechas lleva al calendario sin cambiar la dirección', () => {
    cargado();
    const desplazar = spyOn(HTMLElement.prototype, 'scrollIntoView');
    const evento = new MouseEvent('click', { cancelable: true });
    raiz.querySelector('.barra-movil a')!.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBeTrue();
    expect(desplazar).toHaveBeenCalled();
  });

  it('si la disponibilidad no carga deja el calendario libre', () => {
    cargado();
    comp.cargarDisponibilidad({ desde: '2099-01-01', hasta: '2099-02-28' });
    disponibilidad().flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.disponibilidad()).toEqual({ bloqueados: [], reservados: [] });
  });
});
