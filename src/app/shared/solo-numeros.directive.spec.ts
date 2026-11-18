import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoloNumerosDirective } from './solo-numeros.directive';

@Component({
  standalone: true,
  imports: [SoloNumerosDirective],
  template: `<input id="campo" type="text" soloNumeros />`,
})
class PruebaHost {}

describe('SoloNumerosDirective', () => {
  let fixture: ComponentFixture<PruebaHost>;
  let input: HTMLInputElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(PruebaHost);
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('#campo')!;
  });

  function escribir(valor: string): string {
    input.value = valor;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    return input.value;
  }

  it('deja pasar solo dígitos sin modificar el valor', () => {
    expect(escribir('3001234567')).toBe('3001234567');
  });

  it('elimina letras y conserva los dígitos', () => {
    expect(escribir('3abc0')).toBe('30');
  });

  it('elimina espacios', () => {
    expect(escribir('300 123')).toBe('300123');
  });

  it('elimina caracteres especiales', () => {
    expect(escribir('+57-300')).toBe('57300');
  });

  it('cadena completamente no numérica queda vacía', () => {
    expect(escribir('abc!@#')).toBe('');
  });

  it('no dispara un segundo evento input cuando el valor ya era limpio', () => {
    let llamadas = 0;
    input.addEventListener('input', () => llamadas++);
    escribir('123');
    // SoloNumerosDirective solo redispacha si tiene que limpiar
    expect(llamadas).toBe(1);
  });
});
