import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Publicacion } from '../../../core/publicaciones.service';
import { MisPublicacionesComponent } from './mis-publicaciones.component';

registerLocaleData(localeEsCo);

const BASE: Publicacion = {
  id: 'pub1', estado: 'BORRADOR', titulo: 'Casa del lago', descripcion: 'Desc', ciudad: 'Guatavita', ubicacion: 'Vereda 1',
  tipo: 'CASA', capacidad: 4, precioNoche: 200000, servicios: [], reglas: [], imagenes: ['https://img.com/1.jpg'],
  politicaCancelacion: 'Flexible', actualizadaEn: '2026-11-22T00:00:00Z',
};

describe('MisPublicacionesComponent', () => {
  let fixture: ComponentFixture<MisPublicacionesComponent>;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));

  function crear(publicaciones: Publicacion[], guardada: string | null = null) {
    TestBed.configureTestingModule({
      imports: [MisPublicacionesComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: LOCALE_ID, useValue: 'es-CO' },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(guardada ? { guardada } : {}) } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MisPublicacionesComponent);
    raiz = fixture.nativeElement;
    http.expectOne('/api/publicaciones/mias').flush(publicaciones);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('un borrador explica que no aparece en Explorar y ofrece solicitar la activación', () => {
    crear([BASE]);
    expect(raiz.textContent).toContain('no aparece en Explorar hasta que solicites la activación');
    expect(boton('Solicitar activación')).toBeDefined();
  });

  it('solicitar la activación lo deja pendiente de revisión y lo dice', () => {
    crear([BASE]);
    boton('Solicitar activación')!.click();
    http.expectOne('/api/publicaciones/pub1/solicitar-activacion').flush({ ...BASE, estado: 'PENDIENTE_REVISION' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('"Casa del lago" quedó pendiente de revisión');
    expect(raiz.textContent).toContain('Esperando la aprobación de un administrador');
    expect(boton('Solicitar activación')).toBeUndefined();
  });

  it('si falta información, dice que la complete en Editar', () => {
    crear([BASE]);
    boton('Solicitar activación')!.click();
    http.expectOne('/api/publicaciones/pub1/solicitar-activacion').flush({ errores: { titulo: 'Falta' } }, { status: 422, statusText: 'Unprocessable' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('le falta información para publicarse. Complétala en Editar');
  });

  it('un borrador rechazado muestra el motivo', () => {
    crear([{ ...BASE, motivoRechazo: 'Fotos borrosas' }]);
    expect(raiz.textContent).toContain('Rechazada por el administrador: Fotos borrosas');
  });

  it('una pendiente de revisión no ofrece solicitar de nuevo', () => {
    crear([{ ...BASE, estado: 'PENDIENTE_REVISION' }]);
    expect(raiz.textContent).toContain('Esperando la aprobación de un administrador');
    expect(boton('Solicitar activación')).toBeUndefined();
  });

  it('al llegar desde el formulario dice el siguiente paso', () => {
    crear([{ ...BASE, estado: 'PENDIENTE_REVISION' }], 'solicitada');
    expect(raiz.textContent).toContain('Publicación creada y enviada a revisión');
  });

  it('al guardar un borrador recuerda solicitar la activación', () => {
    crear([BASE], 'borrador');
    expect(raiz.textContent).toContain('Borrador guardado. Para que aparezca en Explorar, solicita la activación');
  });
});
