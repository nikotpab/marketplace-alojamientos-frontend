import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DisponibilidadComponent } from './disponibilidad.component';

const DATOS = { bloqueados: ['2099-01-03'], reservados: ['2099-01-20'] };
const URL_DISPONIBILIDAD = '/api/publicaciones/p1/disponibilidad';

describe('DisponibilidadComponent', () => {
  let fixture: ComponentFixture<DisponibilidadComponent>;
  let comp: DisponibilidadComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('.panel button')].find((b) => b.textContent!.includes(texto))!;

  function crear(responder: (h: HttpTestingController) => void = (h) => h.expectOne((r) => r.url === URL_DISPONIBILIDAD).flush(DATOS)) {
    TestBed.configureTestingModule({
      imports: [DisponibilidadComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'p1' }) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DisponibilidadComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    responder(http);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('carga la disponibilidad del periodo visible y pide elegir fechas', () => {
    crear();
    expect(comp.datos()).toEqual(DATOS);
    expect(raiz.querySelector('.panel')!.textContent).toContain('Sin selección');
  });

  it('si no carga lo dice, salvo un 403 que redirige el interceptor', () => {
    crear((h) => h.expectOne((r) => r.url === URL_DISPONIBILIDAD).flush(null, { status: 403, statusText: 'Forbidden' }));
    expect(comp.error()).toBe('');

    comp.cargar({ desde: '2099-01-01', hasta: '2099-02-28' });
    http.expectOne((r) => r.url === URL_DISPONIBILIDAD).flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.error()).toContain('No pudimos cargar la disponibilidad');
  });

  it('bloquea el rango elegido y limpia la selección', () => {
    crear();
    comp.rango.set({ desde: '2099-01-05', hasta: '2099-01-07' });
    fixture.detectChanges();
    expect(raiz.querySelector('.panel')!.textContent).toContain('3 días');

    boton('Bloquear').click();
    const put = http.expectOne(URL_DISPONIBILIDAD);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ desde: '2099-01-05', hasta: '2099-01-07', estado: 'BLOQUEADO' });
    put.flush({ ...DATOS, bloqueados: ['2099-01-03', '2099-01-05', '2099-01-06', '2099-01-07'] });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('Fechas bloqueadas.');
    expect(comp.rango()).toBeNull();
    expect(comp.datos().bloqueados.length).toBe(4);
  });

  it('marca un día como disponible', () => {
    crear();
    comp.rango.set({ desde: '2099-01-03', hasta: '2099-01-03' });
    fixture.detectChanges();
    expect(raiz.querySelector('.panel')!.textContent).toContain('1 día');

    boton('Marcar disponible').click();
    http.expectOne(URL_DISPONIBILIDAD).flush({ ...DATOS, bloqueados: [] });
    expect(comp.aviso()).toBe('Fechas marcadas como disponibles.');
  });

  it('un rango con días reservados no se puede editar', () => {
    crear();
    comp.rango.set({ desde: '2099-01-18', hasta: '2099-01-22' });
    fixture.detectChanges();
    expect(raiz.querySelector('.panel .error')!.textContent).toContain('reservas confirmadas');
    expect(raiz.querySelector('.panel .acciones')).toBeNull();
    comp.marcar('BLOQUEADO');
    http.expectNone(URL_DISPONIBILIDAD);
  });

  it('sin rango no guarda nada', () => {
    crear();
    comp.marcar('BLOQUEADO');
    http.expectNone(URL_DISPONIBILIDAD);
    expect(comp.guardando()).toBeFalse();
  });

  it('un 409, un 403 y otro fallo al guardar se tratan distinto', () => {
    crear();
    comp.rango.set({ desde: '2099-01-05', hasta: '2099-01-07' });

    comp.marcar('BLOQUEADO');
    http.expectOne(URL_DISPONIBILIDAD).flush(null, { status: 409, statusText: 'Conflict' });
    expect(comp.error()).toContain('días con reservas confirmadas');

    comp.marcar('BLOQUEADO');
    http.expectOne(URL_DISPONIBILIDAD).flush(null, { status: 403, statusText: 'Forbidden' });
    expect(comp.error()).toBe('');

    comp.marcar('BLOQUEADO');
    http.expectOne(URL_DISPONIBILIDAD).flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.error()).toBe('No pudimos guardar el cambio. Intenta de nuevo.');
    expect(comp.guardando()).toBeFalse();
  });
});
