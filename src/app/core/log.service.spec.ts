import { enmascarar } from './log.service';

describe('enmascarar (logs sin datos sensibles)', () => {
  it('oculta claves sensibles', () => {
    const r = enmascarar({ correo: 'a@b.co', contrasena: 'secreta123', token: 'abc', tarjeta: { numero: '4242' } }) as Record<string, unknown>;
    expect(r['correo']).toBe('a@b.co');
    expect(r['contrasena']).toBe('[OCULTO]');
    expect(r['token']).toBe('[OCULTO]');
    expect(r['tarjeta']).toBe('[OCULTO]');
  });

  it('reemplaza JWT y números de tarjeta dentro de textos', () => {
    const texto = enmascarar('Bearer eyJhbGciOi.eyJzdWIiOi.firma pagó con 4242 4242 4242 4242') as string;
    expect(texto).toContain('[TOKEN]');
    expect(texto).toContain('[TARJETA]');
    expect(texto).not.toContain('4242 4242');
  });
});
