import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Validador de grupo: `confirmar` debe ser igual a `contrasena` (registro y /recuperar). */
export function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  return grupo.get('contrasena')?.value === grupo.get('confirmar')?.value ? null : { noCoinciden: true };
}
