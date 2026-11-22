import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reserva } from '../../../core/reservas.service';
import { ResenaFormComponent } from './resena-form.component';

const RESERVA: Reserva = {
  id: 'r1', codigo: 'LR-1234', estado: 'COMPLETADA', publicacionId: 'p1', alojamiento: 'Casa del lago',
  llegada: '2026-01-10', salida: '2026-01-12', huespedes: 2, total: 500000,
};
const URL_RESENA = '/api/reservas/r1/resena';

describe('ResenaFormComponent', () => {
  let fixture: ComponentFixture<ResenaFormComponent>;
  let comp: ResenaFormComponent;
  let raiz: HTMLElement;
  let http: HttpTestingController;
  let publicadas: number;
  let cerrado: boolean;

  const boton = (texto: string) => [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const alertas = () => [...raiz.querySelectorAll('[role="alert"]')].map((e) => e.textContent!.trim());

  function crear(reserva: Reserva = RESERVA) {
    TestBed.configureTestingModule({ imports: [ResenaFormComponent], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResenaFormComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('reserva', reserva);
    publicadas = 0;
    cerrado = false;
    comp.publicada.subscribe(() => publicadas++);
    comp.cerrar.subscribe(() => (cerrado = true));
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('sin calificación ni comentario muestra los dos errores y no publica', () => {
    crear({ ...RESERVA, alojamiento: undefined });
    expect(raiz.querySelector('strong')!.textContent).toBe('Alojamiento');
    boton('Publicar reseña').click();
    fixture.detectChanges();
    http.expectNone(URL_RESENA);
    expect(alertas()).toEqual(['Elige una calificación de 1 a 5.', 'Escribe tu reseña (máximo 1000 caracteres).']);
  });

  it('un comentario de solo espacios no es válido', () => {
    crear();
    comp.calificacion.set(4);
    comp.comentario = '    ';
    comp.enviar();
    http.expectNone(URL_RESENA);
    expect(comp.comentarioValido).toBeFalse();
  });

  it('elegir estrellas marca la calificación', () => {
    crear();
    const estrellas = raiz.querySelectorAll<HTMLInputElement>('.estrellas input');
    estrellas[3].click();
    fixture.detectChanges();
    expect(comp.calificacion()).toBe(4);
    expect(raiz.querySelectorAll('.estrellas label.on').length).toBe(4);
    expect(raiz.querySelector('.estrellas')!.textContent).toContain('1 estrella');
  });

  it('publica la calificación y el comentario sin espacios', () => {
    crear();
    comp.calificacion.set(5);
    comp.comentario = '  Excelente estadía  ';
    boton('Publicar reseña').click();
    expect(comp.enviando()).toBeTrue();
    comp.enviar();
    const post = http.expectOne(URL_RESENA);
    expect(post.request.body).toEqual({ calificacion: 5, contenido: 'Excelente estadía' });
    post.flush({});
    expect(publicadas).toBe(1);
    expect(comp.enviando()).toBeFalse();
  });

  it('explica por qué no se pudo publicar', () => {
    crear();
    comp.calificacion.set(3);
    comp.comentario = 'Bien';
    const casos: [number, string][] = [
      [409, 'Ya reseñaste esta reserva.'],
      [422, 'Solo puedes reseñar estadías completadas.'],
      [500, 'No pudimos publicar tu reseña.'],
    ];
    for (const [status, mensaje] of casos) {
      comp.enviar();
      http.expectOne(URL_RESENA).flush(null, { status, statusText: 'Error' });
      expect(comp.error()).toContain(mensaje);
    }
    expect(publicadas).toBe(0);
  });

  it('Cancelar cierra sin publicar', () => {
    crear();
    boton('Cancelar').click();
    expect(cerrado).toBeTrue();
  });
});
