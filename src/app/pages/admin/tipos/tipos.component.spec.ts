import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TiposComponent } from './tipos.component';

const CASA = { id: 't1', nombre: 'Casa', activo: true };
const FINCA = { id: 't2', nombre: 'Finca', activo: false };
const ERROR = { status: 500, statusText: 'Server Error' };

describe('TiposComponent', () => {
  let fixture: ComponentFixture<TiposComponent>;
  let comp: TiposComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  function crear(responder: (h: HttpTestingController) => void = (h) => h.expectOne('/api/admin/tipos-alojamiento').flush([CASA, FINCA])) {
    TestBed.configureTestingModule({ imports: [TiposComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TiposComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    responder(http);
    fixture.detectChanges();
  }

  /** Después de crear o editar, el servicio vuelve a pedir los tipos activos para formularios y filtros. */
  const recargaActivos = () => http.expectOne('/api/configuracion/tipos-alojamiento').flush([]);

  afterEach(() => http.verify());

  it('lista los tipos con su estado', () => {
    crear();
    const filas = raiz.querySelectorAll('tbody tr');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Activo');
    expect(filas[0].textContent).toContain('Desactivar');
    expect(filas[1].textContent).toContain('Inactivo');
    expect(filas[1].textContent).toContain('Activar');
  });

  it('si no carga lo dice', () => {
    crear((h) => h.expectOne('/api/admin/tipos-alojamiento').flush(null, ERROR));
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos cargar los tipos');
  });

  it('sin tipos muestra la tabla vacía', () => {
    crear((h) => h.expectOne('/api/admin/tipos-alojamiento').flush([]));
    expect(raiz.textContent).toContain('No hay tipos configurados.');
  });

  it('agrega un tipo nuevo con el nombre sin espacios', () => {
    crear();
    comp.nuevo = '  Glamping ';
    comp.crear();
    const post = http.expectOne('/api/admin/tipos-alojamiento');
    expect(post.request.body).toEqual({ nombre: 'Glamping', activo: true });
    post.flush({ id: 't3', nombre: 'Glamping', activo: true });
    recargaActivos();
    fixture.detectChanges();

    expect(comp.tipos().length).toBe(3);
    expect(comp.nuevo).toBe('');
    expect(raiz.textContent).toContain('Tipo "Glamping" agregado');
  });

  it('no agrega un nombre de menos de 3 letras', () => {
    crear();
    comp.nuevo = ' ab ';
    comp.crear();
    http.expectNone('/api/admin/tipos-alojamiento');
    expect(comp.creando()).toBeFalse();
  });

  it('un nombre repetido y un fallo dan mensajes distintos', () => {
    crear();
    comp.nuevo = 'Casa';
    comp.crear();
    http.expectOne('/api/admin/tipos-alojamiento').flush(null, { status: 409, statusText: 'Conflict' });
    expect(comp.aviso()).toBe('Ya existe un tipo con ese nombre.');

    comp.crear();
    http.expectOne('/api/admin/tipos-alojamiento').flush(null, ERROR);
    expect(comp.aviso()).toContain('No pudimos agregar el tipo');
    expect(comp.creando()).toBeFalse();
  });

  it('renombra un tipo y envía también su estado', () => {
    crear();
    raiz.querySelector<HTMLButtonElement>('tbody tr .btn-mini')!.click();
    fixture.detectChanges();
    expect(comp.editando()).toBe('t1');
    expect(raiz.querySelector('input[aria-label="Nuevo nombre"]')).not.toBeNull();

    comp.nombreEditado = 'Casa campestre';
    comp.guardarNombre(CASA);
    const put = http.expectOne('/api/admin/tipos-alojamiento/t1');
    expect(put.request.body).toEqual({ nombre: 'Casa campestre', activo: true });
    put.flush({ ...CASA, nombre: 'Casa campestre' });
    recargaActivos();
    fixture.detectChanges();

    expect(comp.editando()).toBeNull();
    expect(raiz.textContent).toContain('Casa campestre');
    expect(comp.aviso()).toBe('Nombre actualizado.');
  });

  it('no guarda un nombre editado de menos de 3 letras', () => {
    crear();
    comp.editar(CASA);
    comp.nombreEditado = ' x ';
    comp.guardarNombre(CASA);
    http.expectNone('/api/admin/tipos-alojamiento/t1');
    expect(comp.editando()).toBe('t1');
  });

  it('desactiva y activa un tipo', () => {
    crear();
    comp.alternar(CASA);
    const put = http.expectOne('/api/admin/tipos-alojamiento/t1');
    expect(put.request.body).toEqual({ nombre: 'Casa', activo: false });
    put.flush({ ...CASA, activo: false });
    recargaActivos();
    expect(comp.aviso()).toContain('"Casa" desactivado');

    comp.alternar(FINCA);
    http.expectOne('/api/admin/tipos-alojamiento/t2').flush({ ...FINCA, activo: true });
    recargaActivos();
    expect(comp.aviso()).toBe('"Finca" activado.');
    expect(comp.tipos().every((t) => t.activo !== undefined)).toBeTrue();
  });

  it('si no guarda el cambio lo dice', () => {
    crear();
    comp.alternar(CASA);
    http.expectOne('/api/admin/tipos-alojamiento/t1').flush(null, ERROR);
    expect(comp.aviso()).toContain('No pudimos guardar el cambio');
  });
});
