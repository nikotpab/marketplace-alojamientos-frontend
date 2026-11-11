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

  it('no busca si la salida no es posterior a la llegada', async () => {
    await harness.navigateByUrl('/buscar?llegada=2026-12-10&salida=2026-12-09', BusquedaComponent);
    responderTipos();
    backend.expectNone((r) => r.url === '/api/alojamientos');
  });
});
