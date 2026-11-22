import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Publicacion, PublicacionesService } from '../../../core/publicaciones.service';
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

describe('TodasPublicacionesComponent, acciones', () => {
  const ACTIVA = { ...BLOQUEADA, id: 'p2', titulo: 'Cabaña', estado: 'ACTIVA', motivoBloqueo: null } as unknown as Publicacion;
  const BLOQ = BLOQUEADA as unknown as Publicacion;
  let comp: TodasPublicacionesComponent;
  let api: PublicacionesService;

  function crear(todas = of([BLOQ, ACTIVA])) {
    TestBed.configureTestingModule({
      imports: [TodasPublicacionesComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(PublicacionesService);
    spyOn(api, 'todas').and.returnValue(todas);
    comp = TestBed.createComponent(TodasPublicacionesComponent).componentInstance;
  }

  it('cuenta por estado y filtra', () => {
    crear();
    expect(comp.conteo()).toEqual({ TODAS: 2, BLOQUEADA: 1, ACTIVA: 1 });
    comp.filtro.set('ACTIVA');
    expect(comp.visibles().map((p) => p.id)).toEqual(['p2']);
    expect(comp.bloqueable(ACTIVA)).toBeTrue();
    expect(comp.bloqueable(BLOQ)).toBeFalse();
  });

  it('si no carga lo dice', () => {
    crear(throwError(() => ({ status: 500 })));
    expect(comp.error()).toContain('No pudimos cargar las publicaciones');
    expect(comp.cargando()).toBeFalse();
  });

  it('bloquea con el motivo y lo refleja en la lista', () => {
    crear();
    const bloquear = spyOn(api, 'bloquear').and.returnValue(of(undefined));
    comp.aBloquear.set(ACTIVA);
    comp.bloquear('Fotos engañosas');
    expect(bloquear).toHaveBeenCalledWith('p2', 'Fotos engañosas');
    expect(comp.publicaciones().find((p) => p.id === 'p2')!.estado).toBe('BLOQUEADA');
    expect(comp.aBloquear()).toBeNull();
    expect(comp.aviso()).toContain('"Cabaña" quedó bloqueada');
  });

  it('desbloquea y la deja activa', () => {
    crear();
    spyOn(api, 'desbloquear').and.returnValue(of(undefined));
    comp.aDesbloquear.set(BLOQ);
    comp.desbloquear();
    expect(comp.publicaciones().find((p) => p.id === 'p1')!.estado).toBe('ACTIVA');
    expect(comp.aviso()).toContain('volvió a estar activa');
  });

  it('si bloquear o desbloquear falla lo dice y no cambia la lista', () => {
    crear();
    spyOn(api, 'bloquear').and.returnValue(throwError(() => ({ status: 500 })));
    spyOn(api, 'desbloquear').and.returnValue(throwError(() => ({ status: 500 })));
    comp.aBloquear.set(ACTIVA);
    comp.bloquear('Fotos engañosas');
    expect(comp.errorAccion()).toContain('No pudimos bloquear');
    comp.aDesbloquear.set(BLOQ);
    comp.desbloquear();
    expect(comp.errorAccion()).toContain('No pudimos desbloquear');
    expect(comp.conteo()).toEqual({ TODAS: 2, BLOQUEADA: 1, ACTIVA: 1 });
    expect(comp.procesando()).toBeFalse();
  });

  it('sin publicación elegida no hace nada', () => {
    crear();
    const bloquear = spyOn(api, 'bloquear');
    const desbloquear = spyOn(api, 'desbloquear');
    comp.bloquear('motivo');
    comp.desbloquear();
    expect(bloquear).not.toHaveBeenCalled();
    expect(desbloquear).not.toHaveBeenCalled();
  });
});
