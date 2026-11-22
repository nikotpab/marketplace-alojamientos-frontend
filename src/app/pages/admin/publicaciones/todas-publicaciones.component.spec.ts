import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TodasPublicacionesComponent } from './todas-publicaciones.component';

registerLocaleData(localeEsCo);

const BLOQUEADA = {
  id: 'p1', titulo: 'Casa del lago', anfitrion: 'Ana', estado: 'BLOQUEADA', motivoBloqueo: 'Fotos falsas',
  precioNoche: 200000, tipo: 'CASA', ubicacion: 'Paipa',
};

describe('TodasPublicacionesComponent', () => {
  let fixture: ComponentFixture<TodasPublicacionesComponent>;
  let raiz: HTMLElement;
  let http: HttpTestingController;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodasPublicacionesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: LOCALE_ID, useValue: 'es-CO' }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TodasPublicacionesComponent);
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne((r) => r.url.startsWith('/api/admin/publicaciones')).flush([BLOQUEADA]);
    fixture.detectChanges();
    http.match(() => true).forEach((r) => r.flush([]));
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('una publicación bloqueada ofrece desbloquearla en vez de bloquearla', () => {
    expect(boton('Desbloquear')).toBeDefined();
    expect(boton('Bloquear')).toBeUndefined();
  });

  it('al confirmar, la publicación vuelve a activa y se avisa', () => {
    boton('Desbloquear')!.click();
    fixture.detectChanges();
    boton('Desbloquear publicación')!.click();

    const peticion = http.expectOne('/api/admin/publicaciones/p1/desbloqueo');
    expect(peticion.request.method).toBe('POST');
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(raiz.querySelector('.estado')!.textContent).toContain('Activa');
    expect(raiz.textContent).not.toContain('Motivo del bloqueo');
    expect(raiz.textContent).toContain('volvió a estar activa');
    expect(boton('Bloquear')).toBeDefined();
  });
});
