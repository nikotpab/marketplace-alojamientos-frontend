import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Publicacion } from '../../../core/publicaciones.service';
import { RevisionComponent } from './revision.component';

const PENDIENTE: Publicacion = {
  id: 'pub1', estado: 'PENDIENTE_REVISION', titulo: 'Casa del lago', descripcion: 'Frente al embalse', ciudad: 'Guatavita',
  ubicacion: 'Vereda 1', tipo: 'CASA', capacidad: 4, precioNoche: 200000, servicios: ['Wifi', 'Parqueadero'], reglas: [],
  imagenes: ['https://img.com/1.jpg'], politicaCancelacion: 'Flexible', actualizadaEn: '2026-11-22T00:00:00Z', anfitrion: 'Juan',
};
const OTRA: Publicacion = { ...PENDIENTE, id: 'pub2', titulo: 'Cabaña', imagenes: [], anfitrion: undefined };

describe('RevisionComponent', () => {
  let fixture: ComponentFixture<RevisionComponent>;
  let comp: RevisionComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const pendientes = () => http.expectOne((r) => r.url === '/api/admin/publicaciones' && r.params.get('estado') === 'PENDIENTE_REVISION');

  function crear(responder: () => void = () => pendientes().flush([PENDIENTE, OTRA])) {
    TestBed.configureTestingModule({ imports: [RevisionComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RevisionComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    responder();
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('muestra cada publicación pendiente con sus datos', () => {
    crear();
    const tarjetas = raiz.querySelectorAll('article.tarjeta');
    expect(tarjetas.length).toBe(2);
    expect(tarjetas[0].textContent).toContain('Anfitrión: Juan');
    expect(tarjetas[0].textContent).toContain('Wifi, Parqueadero');
    expect(tarjetas[0].querySelectorAll('img').length).toBe(1);
    expect(tarjetas[1].textContent).not.toContain('Anfitrión:');
    expect(tarjetas[1].querySelector('.imagenes')).toBeNull();
  });

  it('sin pendientes lo dice', () => {
    crear(() => pendientes().flush([]));
    expect(raiz.textContent).toContain('No hay publicaciones pendientes de revisión.');
  });

  it('si no carga lo dice', () => {
    crear(() => pendientes().flush(null, { status: 500, statusText: 'Server Error' }));
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No pudimos cargar las publicaciones pendientes');
  });

  it('aprobar quita la publicación de la lista y avisa', () => {
    crear();
    raiz.querySelector<HTMLButtonElement>('button.aprobar')!.click();
    expect(comp.procesando()).toBe('pub1');
    http.expectOne('/api/admin/publicaciones/pub1/aprobar').flush({ ...PENDIENTE, estado: 'ACTIVA' });
    fixture.detectChanges();

    expect(comp.pendientes().map((p) => p.id)).toEqual(['pub2']);
    expect(comp.procesando()).toBeNull();
    expect(raiz.textContent).toContain('"Casa del lago" fue aprobada');
  });

  it('rechazar exige un motivo de al menos 10 caracteres', () => {
    crear();
    raiz.querySelector<HTMLButtonElement>('button.rechazar-sec')!.click();
    fixture.detectChanges();
    expect(raiz.querySelector('textarea')).not.toBeNull();

    comp.motivo = '  corto  ';
    raiz.querySelector<HTMLButtonElement>('button.rechazar')!.click();
    fixture.detectChanges();
    http.expectNone('/api/admin/publicaciones/pub1/rechazar');
    expect(raiz.querySelector('.rechazo .error')!.textContent).toContain('mínimo 10 caracteres');
  });

  it('rechazar con motivo la devuelve a borrador y avisa', () => {
    crear();
    comp.abrirRechazo(PENDIENTE);
    comp.motivo = '  Las imágenes no corresponden  ';
    comp.confirmarRechazo(PENDIENTE);
    const post = http.expectOne('/api/admin/publicaciones/pub1/rechazar');
    expect(post.request.body).toEqual({ motivo: 'Las imágenes no corresponden' });
    post.flush({ ...PENDIENTE, estado: 'BORRADOR' });
    fixture.detectChanges();

    expect(comp.rechazando()).toBeNull();
    expect(comp.pendientes().length).toBe(1);
    expect(raiz.textContent).toContain('fue rechazada y volvió a borrador');
  });

  it('cancelar el rechazo vuelve a mostrar Aprobar y Rechazar', () => {
    crear();
    comp.abrirRechazo(PENDIENTE);
    fixture.detectChanges();
    raiz.querySelector<HTMLButtonElement>('.rechazo button.enlace')!.click();
    fixture.detectChanges();
    expect(comp.rechazando()).toBeNull();
    expect(raiz.querySelectorAll('button.aprobar').length).toBe(2);
  });

  it('un fallo al decidir lo dice, salvo un 403 que redirige el interceptor', () => {
    crear();
    comp.aprobar(PENDIENTE);
    http.expectOne('/api/admin/publicaciones/pub1/aprobar').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(comp.error()).toBe('');
    expect(comp.procesando()).toBeNull();

    comp.aprobar(PENDIENTE);
    http.expectOne('/api/admin/publicaciones/pub1/aprobar').flush(null, { status: 500, statusText: 'Server Error' });
    expect(comp.error()).toContain('No pudimos registrar la decisión');
    expect(comp.pendientes().length).toBe(2);
  });
});
