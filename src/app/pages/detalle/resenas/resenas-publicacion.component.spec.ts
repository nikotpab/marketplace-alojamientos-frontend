import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../../core/auth.service';
import { ResenasPublicacionComponent } from './resenas-publicacion.component';

const RESENAS = [{ id: 'r1', autor: 'María G.', calificacion: 1, comentario: 'Pésimo', fecha: '2026-01-15T10:00:00Z' }];

describe('ResenasPublicacionComponent · reportar', () => {
  let fixture: ComponentFixture<ResenasPublicacionComponent>;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  const usuario = signal<{ id: string } | null>({ id: 'u1' });

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto));

  beforeEach(() => {
    usuario.set({ id: 'u1' });
    TestBed.configureTestingModule({
      imports: [ResenasPublicacionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { usuario } }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResenasPublicacionComponent);
    fixture.componentRef.setInput('publicacionId', 'p1');
    raiz = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne('/api/publicaciones/p1/resenas').flush(RESENAS);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function elegirMotivo(valor: string) {
    const select = raiz.querySelector<HTMLSelectElement>('#motivo-reporte')!;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('sin sesión no ofrece reportar', () => {
    usuario.set(null);
    fixture.detectChanges();
    expect(boton('Reportar')).toBeUndefined();
  });

  it('reporta con el motivo y el comentario, y marca la reseña como reportada', () => {
    boton('Reportar')!.click();
    fixture.detectChanges();
    elegirMotivo('OFENSIVA');
    const comentario = raiz.querySelector<HTMLTextAreaElement>('#comentario-reporte')!;
    comentario.value = '  Insulta al anfitrión ';
    comentario.dispatchEvent(new Event('input'));

    boton('Reportar reseña')!.click();
    const peticion = http.expectOne('/api/resenas/r1/reportes');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ motivo: 'OFENSIVA', comentario: 'Insulta al anfitrión' });
    peticion.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(raiz.textContent).toContain('Reportada. Un administrador la revisará.');
    expect(boton('Reportar')).toBeUndefined();
  });

  it('sin motivo no envía nada y lo explica', () => {
    boton('Reportar')!.click();
    fixture.detectChanges();

    boton('Reportar reseña')!.click();
    fixture.detectChanges();

    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('Elige el motivo del reporte.');
  });

  it('muestra el mensaje del backend cuando la reseña es propia o ya se reportó', () => {
    boton('Reportar')!.click();
    fixture.detectChanges();
    elegirMotivo('SPAM');

    boton('Reportar reseña')!.click();
    http.expectOne('/api/resenas/r1/reportes').flush({ detail: 'No puedes reportar tu propia reseña.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('No puedes reportar tu propia reseña.');
  });
});
