import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PublicacionFormComponent } from './publicacion-form.component';

const TIPOS = [{ codigo: 'CASA', nombre: 'Casa' }];
const CATALOGOS = { tipos: TIPOS, politicas: [{ id: 'p1', nombre: 'Flexible' }], servicios: [{ id: 's1', nombre: 'WiFi' }] };
const PUB_BORRADOR = {
  id: 'pub1', estado: 'BORRADOR', titulo: 'Casa de prueba', descripcion: 'Desc',ciudad: 'Bogotá', ubicacion: 'Calle 10 # 5-20',
  tipo: 'CASA', capacidad: 4, precioNoche: 100000, servicios: [], reglas: [], imagenes: ['https://img.com/1.jpg'],
  politicaCancelacion: 'Flexible', actualizadaEn: '2026-01-01T00:00:00Z',
};

describe('PublicacionFormComponent · nueva publicación', () => {
  let fixture: ComponentFixture<PublicacionFormComponent>;
  let comp: PublicacionFormComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let navegar: jasmine.Spy;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PublicacionFormComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(PublicacionFormComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('muestra el formulario de nueva publicación', () => {
    expect(raiz.textContent).toContain('Nueva publicación');
  });

  it('guardar borrador llama a POST /api/publicaciones con los datos del formulario', () => {
    comp.form.patchValue({ titulo: 'Mi casa', descripcion: 'Bonita', ubicacion: 'Medellín', tipo: 'CASA', capacidad: '2', precioNoche: '50000', politicaCancelacion: 'Flexible' });
    comp.guardarBorrador();
    const req = http.expectOne('/api/publicaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.titulo).toBe('Mi casa');
    req.flush(PUB_BORRADOR);
    expect(navegar).toHaveBeenCalledWith(['/anfitrion'], jasmine.anything());
  });

  it('con capacidad de 0 inválida no llama a la API', () => {
    comp.form.controls.capacidad.setValue('0');
    comp.form.controls.capacidad.markAsTouched();
    comp.guardarBorrador();
    http.expectNone('/api/publicaciones');
  });
});

describe('PublicacionFormComponent · editar publicación', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'anfitrion/publicaciones/:id/editar', component: PublicacionFormComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  it('carga la publicación existente y rellena el formulario', async () => {
    const comp = await harness.navigateByUrl('/anfitrion/publicaciones/pub1/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/pub1').flush(PUB_BORRADOR);
    harness.detectChanges();
    expect(comp.form.controls.titulo.value).toBe('Casa de prueba');
    expect(comp.publicacion()?.estado).toBe('BORRADOR');
  });

  it('al editar una publicación activa avisa que vuelve a revisión y lo repite al guardar', async () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const comp = await harness.navigateByUrl('/anfitrion/publicaciones/pub1/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/pub1').flush({ ...PUB_BORRADOR, estado: 'ACTIVA' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('la publicación vuelve a revisión');

    comp.guardarBorrador();
    http.expectOne((r) => r.url === '/api/publicaciones/pub1' && r.method === 'PUT').flush({ ...PUB_BORRADOR, estado: 'PENDIENTE_REVISION' });
    expect(navegar).toHaveBeenCalledWith(['/anfitrion'], { queryParams: { guardada: 'revision' } });
  });

  it('un borrador no muestra el aviso de revisión', async () => {
    await harness.navigateByUrl('/anfitrion/publicaciones/pub1/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/pub1').flush(PUB_BORRADOR);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).not.toContain('vuelve a revisión');
  });

  it('error 404 al cargar muestra mensaje apropiado', async () => {
    const comp = await harness.navigateByUrl('/anfitrion/publicaciones/noexiste/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/noexiste').flush({}, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(comp.errorCarga()).toContain('no existe');
  });

  it('solicitar activación completa muestra mensaje de éxito', async () => {
    const comp = await harness.navigateByUrl('/anfitrion/publicaciones/pub1/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/pub1').flush(PUB_BORRADOR);
    harness.detectChanges();

    comp.solicitarActivacion();
    http.expectOne((r) => r.url === '/api/publicaciones/pub1' && r.method === 'PUT').flush(PUB_BORRADOR);
    http.expectOne('/api/publicaciones/pub1/solicitar-activacion').flush({ ...PUB_BORRADOR, estado: 'PENDIENTE_REVISION' });
    harness.detectChanges();
    expect(comp.exito()).toContain('Solicitud enviada');
  });

  it('solicitar activación sin título muestra error de activación', async () => {
    const comp = await harness.navigateByUrl('/anfitrion/publicaciones/pub1/editar', PublicacionFormComponent);
    http.expectOne((r) => r.url.includes('/api/configuracion/tipos-alojamiento')).flush(TIPOS);
    http.expectOne('/api/catalogos').flush(CATALOGOS);
    http.expectOne('/api/publicaciones/pub1').flush({ ...PUB_BORRADOR, titulo: '' });
    harness.detectChanges();

    comp.solicitarActivacion();
    harness.detectChanges();
    expect(comp.erroresActivacion()['titulo']).toContain('título');
    expect(comp.totalErrores()).toBeGreaterThan(0);
  });
});
