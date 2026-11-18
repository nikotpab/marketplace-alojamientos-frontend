import { FormControl } from '@angular/forms';
import { validarCorreo, validarTelefono } from './validadores-contacto';

describe('validadores de contacto (SCRUM-155)', () => {
  const valido = (validadores: typeof validarCorreo, valor: string) => new FormControl(valor, validadores).valid;

  it('aceptan correos con dominio completo', () => {
    for (const correo of ['nombre@gmail.com', 'ana.gomez+viajes@correo.com.co', 'x@sub.dominio.io']) {
      expect(valido(validarCorreo, correo)).withContext(correo).toBeTrue();
    }
  });

  it('rechazan correos sin dominio completo o mal escritos', () => {
    for (const correo of ['luicuadros07@gmail', 'ana@gmail.', 'ana@gmail.c', 'ana@.com', 'ana gomez@gmail.com', 'sin-arroba.com', '']) {
      expect(valido(validarCorreo, correo)).withContext(correo).toBeFalse();
    }
  });

  it('aceptan celulares de 10 dígitos que empiezan por 3', () => {
    for (const telefono of ['3001234567', '3209876543']) {
      expect(valido(validarTelefono, telefono)).withContext(telefono).toBeTrue();
    }
  });

  it('rechazan otros teléfonos', () => {
    for (const telefono of ['2001234567', '300123456', '30012345678', '300123456a', '']) {
      expect(valido(validarTelefono, telefono)).withContext(telefono).toBeFalse();
    }
  });

  it('rechazan correos sin parte local (@gmail.com) o sin dominio (test@)', () => {
    for (const correo of ['@gmail.com', 'test@', 'test@@gmail.com']) {
      expect(valido(validarCorreo, correo)).withContext(correo).toBeFalse();
    }
  });

  it('aceptan correos con TLD de 2 letras', () => {
    expect(valido(validarCorreo, 'a@b.co')).toBeTrue();
  });
});
