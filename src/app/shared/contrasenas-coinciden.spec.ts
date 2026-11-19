import { FormBuilder } from '@angular/forms';
import { contrasenasCoinciden } from './contrasenas-coinciden';

describe('contrasenasCoinciden', () => {
  const fb = new FormBuilder();
  const grupo = (contrasena: string, confirmar: string) =>
    fb.nonNullable.group({ contrasena, confirmar }, { validators: contrasenasCoinciden });

  it('devuelve null cuando ambos campos son iguales', () => {
    expect(contrasenasCoinciden(grupo('Abc-123', 'Abc-123'))).toBeNull();
  });

  it('devuelve null cuando ambos están vacíos', () => {
    expect(contrasenasCoinciden(grupo('', ''))).toBeNull();
  });

  it('devuelve noCoinciden cuando los valores difieren', () => {
    expect(contrasenasCoinciden(grupo('Abc-123', 'Xyz-456'))).toEqual({ noCoinciden: true });
  });

  it('devuelve noCoinciden cuando confirmar está vacío', () => {
    expect(contrasenasCoinciden(grupo('Abc-123', ''))).toEqual({ noCoinciden: true });
  });

  it('es sensible a mayúsculas y minúsculas', () => {
    expect(contrasenasCoinciden(grupo('abc-123', 'ABC-123'))).toEqual({ noCoinciden: true });
  });

  it('devuelve noCoinciden con un solo espacio de diferencia', () => {
    expect(contrasenasCoinciden(grupo('Abc 123', 'Abc-123'))).toEqual({ noCoinciden: true });
  });
});
