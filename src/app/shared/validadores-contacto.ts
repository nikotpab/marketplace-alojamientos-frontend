import { Validators } from '@angular/forms';

/** Los mismos formatos que valida el backend. */

/** Celular de Colombia: 10 dígitos que empiezan por 3. */
export const FORMATO_TELEFONO = /^3\d{9}$/;
export const MENSAJE_TELEFONO = '10 dígitos, empezando por 3';

/** Validators.email acepta "ana@gmail"; además se exige un dominio con punto y terminación de 2 letras o más. */
export const FORMATO_CORREO = /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/;
export const MENSAJE_CORREO = 'Escribe un correo completo, por ejemplo nombre@gmail.com';

export const validarTelefono = [Validators.required, Validators.pattern(FORMATO_TELEFONO)];
export const validarCorreo = [Validators.required, Validators.email, Validators.pattern(FORMATO_CORREO)];
