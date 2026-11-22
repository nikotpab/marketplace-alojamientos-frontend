import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { PaginaAlojamientos } from '../../core/alojamientos.service';
import { BusquedaComponent } from './busqueda.component';

registerLocaleData(localeEsCo);

const PAGINA: PaginaAlojamientos = {
  contenido: [
    { id: 'a1', titulo: 'Cabaña del lago', ciudad: 'Guatavita', tipo: 'CABANA', capacidad: 4, precioNoche: 250000,
      calificacion: 4.7, imagen: null, servicios: ['WiFi'] },
  ],
  total: 1,
  pagina: 0,
  totalPaginas: 1,
};

describe('BusquedaComponent', () => {
  let backend: HttpTestingController;
  let harness: RouterTestingHarness;

  function responderTipos() {
    backend.match('/api/configuracion/tipos-alojamiento').forEach((r) => r.flush([{ codigo: 'CABANA', nombre: 'Cabaña' }]));
    backend.match('/api/catalogos').forEach((r) =>
      r.flush({ tipos: [], politicas: [], servicios: [{ id: 's1', nombre: 'WiFi' }, { id: 's2', nombre: 'Chimenea' }] }),
    );
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'buscar', component: BusquedaComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => backend.verify());

  it('busca al cargar la página usando los filtros de la URL', async () => {
    const pagina = await harness.navigateByUrl('/buscar?ciudad=Guatavita&huespedes=2', BusquedaComponent);
    responderTipos();
    const req = backend.expectOne((r) => r.url === '/api/alojamientos');
    expect(req.request.params.get('ciudad')).toBe('Guatavita');
    expect(req.request.params.get('huespedes')).toBe('2');
    req.flush(PAGINA);
    harness.detectChanges();

    expect(pagina.form.controls.ciudad.value).toBe('Guatavita');
    expect(harness.routeNativeElement?.textContent).toContain('1 alojamiento');
  });

  it('ofrece en los filtros los servicios del catálogo del backend', async () => {
    const pagina = await harness.navigateByUrl('/buscar', BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(PAGINA);

    expect(pagina.servicios()).toEqual(['WiFi', 'Chimenea']);
  });

  it('muestra el nombre del tipo y no el código', async () => {
    await harness.navigateByUrl('/buscar', BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(PAGINA);
    harness.detectChanges();

    const tarjeta = harness.routeNativeElement?.querySelector('.tarjeta')?.textContent ?? '';
    expect(tarjeta).toContain('Cabaña');
    expect(tarjeta).not.toContain('CABANA');
  });

  it('al buscar guarda los filtros en la URL', async () => {
    const pagina = await harness.navigateByUrl('/buscar', BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(PAGINA);

    pagina.form.controls.ciudad.setValue('Cali');
    pagina.buscar();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/buscar?ciudad=Cali');
    const req = backend.expectOne((r) => r.url === '/api/alojamientos');
    expect(req.request.params.get('ciudad')).toBe('Cali');
    req.flush({ ...PAGINA, contenido: [], total: 0 });
  });

  it('limpiar quita los filtros de la dirección', async () => {
    const pagina = await harness.navigateByUrl('/buscar?ciudad=Cali', BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(PAGINA);

    pagina.limpiar();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/buscar');
    backend.match((r) => r.url === '/api/alojamientos').forEach((r) => r.flush(PAGINA));
  });

  it('no busca si la salida no es posterior a la llegada', async () => {
    await harness.navigateByUrl('/buscar?llegada=2026-12-10&salida=2026-12-09', BusquedaComponent);
    responderTipos();
    backend.expectNone((r) => r.url === '/api/alojamientos');
    expect(backend.match(() => true).length).toBe(0);
  });

  const URL_COMPLETA = '/buscar?ciudad=Paipa&llegada=2099-01-10&salida=2099-01-13&huespedes=1&tipo=CABANA&precioMin=100000&precioMax=300000&servicios=WiFi,Chimenea';

  async function abrir(url: string, pagina: PaginaAlojamientos = PAGINA) {
    const comp = await harness.navigateByUrl(url, BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(pagina);
    harness.detectChanges();
    return comp;
  }

  it('muestra un chip por cada filtro de la URL y calcula las noches', async () => {
    const pagina = await abrir(URL_COMPLETA);
    expect(pagina.chips().map((c) => c.clave)).toEqual([
      'ciudad', 'fechas', 'huespedes', 'tipo', 'precioMin', 'precioMax', 'servicio:WiFi', 'servicio:Chimenea',
    ]);
    expect(pagina.chips()[2].texto).toBe('1 huésped');
    expect(pagina.chips()[3].texto).toBe('Cabaña');
    expect(pagina.noches()).toBe(3);
    expect(pagina.totalEstadia(250000)).toBe(750000);
  });

  it('quitar un chip borra ese filtro y repite la búsqueda', async () => {
    const pagina = await abrir(URL_COMPLETA);
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const params = () => navegar.calls.mostRecent().args[1]!.queryParams!;

    pagina.quitar('fechas');
    expect(params()['llegada']).toBeUndefined();
    expect(params()['salida']).toBeUndefined();
    pagina.quitar('servicio:WiFi');
    expect(params()['servicios']).toBe('Chimenea');
    pagina.quitar('huespedes');
    expect(params()['huespedes']).toBeUndefined();
    pagina.quitar('precioMax');
    expect(params()['precioMax']).toBeUndefined();
    pagina.quitar('ciudad');
    pagina.quitar('tipo');
    expect(params()).toEqual({ precioMin: 100000, servicios: 'Chimenea' });

    pagina.quitar('otra');
    expect(params()).toEqual({ precioMin: 100000, servicios: 'Chimenea' });
  });

  it('buscar con los mismos filtros de la URL vuelve a consultar', async () => {
    const pagina = await abrir('/buscar?ciudad=Paipa');
    pagina.buscar();
    const repetida = backend.expectOne((r) => r.url === '/api/alojamientos');
    expect(repetida.request.params.get('ciudad')).toBe('Paipa');
    repetida.flush(PAGINA);
  });

  it('elegir servicios los agrega y los quita', async () => {
    const pagina = await abrir('/buscar');
    pagina.alternarServicio('WiFi');
    pagina.alternarServicio('Chimenea');
    pagina.alternarServicio('WiFi');
    expect(pagina.seleccionados()).toEqual(['Chimenea']);
  });

  it('usa la primera imagen de los resultados como portada', async () => {
    const conImagen = { ...PAGINA.contenido[0], id: 'a2', imagen: 'https://img.com/a2.jpg' };
    const pagina = await abrir('/buscar', { ...PAGINA, contenido: [PAGINA.contenido[0], conImagen], total: 2 });
    expect(pagina.portada()).toBe('https://img.com/a2.jpg');
  });

  it('si la búsqueda falla lo dice', async () => {
    const pagina = await harness.navigateByUrl('/buscar', BusquedaComponent);
    responderTipos();
    backend.expectOne((r) => r.url === '/api/alojamientos').flush(null, { status: 500, statusText: 'Server Error' });
    expect(pagina.error()).toContain('No pudimos obtener los alojamientos');
    expect(pagina.cargando()).toBeFalse();
  });

  it('aplicar el panel lo cierra y busca', async () => {
    const pagina = await abrir('/buscar');
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    pagina.panelAbierto.set(true);
    pagina.form.controls.ciudad.setValue('Cali');
    pagina.aplicarPanel();
    expect(pagina.panelAbierto()).toBeFalse();
    expect(navegar.calls.mostRecent().args[1]!.queryParams).toEqual({ ciudad: 'Cali' });
  });

  it('un clic fuera de la caja del panel lo cierra, uno dentro no', async () => {
    const pagina = await abrir('/buscar');
    const panel = document.createElement('dialog');
    spyOn(panel, 'getBoundingClientRect').and.returnValue(new DOMRect(100, 100, 200, 200));
    const clic = (x: number, y: number, target: EventTarget = panel) =>
      ({ currentTarget: panel, target, clientX: x, clientY: y }) as unknown as MouseEvent;

    pagina.panelAbierto.set(true);
    pagina.cerrarSiTocaFondo(clic(150, 150));
    pagina.cerrarSiTocaFondo(clic(10, 10, document.body));
    expect(pagina.panelAbierto()).toBeTrue();

    pagina.cerrarSiTocaFondo(clic(10, 150));
    expect(pagina.panelAbierto()).toBeFalse();
  });
});
