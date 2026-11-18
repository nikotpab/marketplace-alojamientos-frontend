import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModeracionComponent } from './moderacion.component';

const PUBS = [
  { id: 'p1', titulo: 'Casa', estado: 'ACTIVA', anfitrion: 'Juan' },
  { id: 'p2', titulo: 'Sin título', estado: 'BORRADOR', anfitrion: 'Ana' },
];
const RESENAS = [
  { id: 'r1', autor: 'María', calificacion: 5, comentario: 'Excelente', fecha: '2026-01-15T10:00:00Z' },
  { id: 'r2', autor: 'Pedro', calificacion: 2, comentario: 'Mal servicio', fecha: '2026-01-16T10:00:00Z' },
];

describe('ModeracionComponent', () => {
  let fixture: ComponentFixture<ModeracionComponent>;
  let comp: ModeracionComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const boton = (texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModeracionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ModeracionComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne('/api/admin/publicaciones').flush(PUBS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('carga las publicaciones y excluye los borradores de la lista', () => {
    expect(comp.publicaciones().length).toBe(1);
    expect(comp.publicaciones()[0].id).toBe('p1');
  });

  it('al seleccionar una publicación carga sus reseñas', () => {
    comp.publicacionId = 'p1';
    comp.cargarResenas();
    http.expectOne('/api/publicaciones/p1/resenas').flush(RESENAS);
    fixture.detectChanges();
    expect(comp.resenas().length).toBe(2);
    expect(raiz.textContent).toContain('María');
  });

  it('clic en Ocultar abre el diálogo de confirmación', () => {
    comp.publicacionId = 'p1';
    comp.cargarResenas();
    http.expectOne('/api/publicaciones/p1/resenas').flush(RESENAS);
    fixture.detectChanges();

    boton('Ocultar')!.click();
    fixture.detectChanges();
    expect(comp.aOcultar()).not.toBeNull();
    expect(comp.aOcultar()!.id).toBe('r1');
  });

  it('confirmar ocultar hace POST y quita la reseña de la lista', () => {
    comp.publicacionId = 'p1';
    comp.cargarResenas();
    http.expectOne('/api/publicaciones/p1/resenas').flush(RESENAS);
    fixture.detectChanges();

    comp.aOcultar.set(RESENAS[0] as any);
    comp.ocultar();
    http.expectOne('/api/admin/resenas/r1/ocultamiento').flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(comp.resenas().length).toBe(1);
    expect(comp.resenas()[0].id).toBe('r2');
    expect(comp.aviso()).toContain('oculta');
    expect(comp.aOcultar()).toBeNull();
  });

  it('error al ocultar muestra mensaje de error', () => {
    comp.aOcultar.set(RESENAS[0] as any);
    comp.ocultar();
    http.expectOne('/api/admin/resenas/r1/ocultamiento').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(comp.error()).toContain('No pudimos ocultar');
  });

  it('sin publicaciones visibles muestra mensaje', () => {
    comp.publicacionId = 'p1';
    comp.cargarResenas();
    http.expectOne('/api/publicaciones/p1/resenas').flush([]);
    fixture.detectChanges();
    expect(raiz.textContent).toContain('no tiene reseñas visibles');
  });
});
