import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

/**
 * Tarjetas de prueba de Stripe → identificador de método de pago de prueba.
 * Solo el identificador viaja al backend: el número de tarjeta nunca se envía ni se guarda.
 */
const TARJETAS_PRUEBA: Record<string, string> = {
  '4242424242424242': 'pm_card_visa',
  '4000000000000002': 'pm_card_chargeDeclined',
  '4000000000000119': 'pm_card_chargeProcessingError',
};

function vencimientoValido(c: AbstractControl): ValidationErrors | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(c.value ?? '');
  if (!m) return { formato: true };
  const mes = +m[1];
  const anio = 2000 + +m[2];
  if (mes < 1 || mes > 12) return { formato: true };
  const hoy = new Date();
  const vencida = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
  return vencida ? { vencida: true } : null;
}

function tarjetaDePrueba(c: AbstractControl): ValidationErrors | null {
  const n = (c.value ?? '').replace(/\s/g, '');
  if (!/^\d{16}$/.test(n)) return { formato: true };
  return TARJETAS_PRUEBA[n] ? null : { noPrueba: true };
}

@Component({
  selector: 'app-pago-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './pago-form.component.html',
  styleUrl: './pago-form.component.scss',
})
export class PagoFormComponent {
  private fb = inject(FormBuilder);

  total = input.required<number>();
  procesando = input(false);
  /** Emite el identificador del método de pago de prueba (no datos de tarjeta). */
  pagar = output<string>();
  cancelar = output<void>();

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    numero: ['', [tarjetaDePrueba]],
    vence: ['', [vencimientoValido]],
    cvc: ['', [Validators.pattern(/^\d{3}$/)]],
  });

  formatearNumero(e: Event) {
    const digitos = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.form.controls.numero.setValue(digitos.replace(/(\d{4})(?=\d)/g, '$1 '));
  }

  formatearVence(e: Event) {
    const d = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.form.controls.vence.setValue(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
  }

  soloCvc(e: Event) {
    this.form.controls.cvc.setValue((e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 3));
  }

  enviar() {
    if (this.procesando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const token = TARJETAS_PRUEBA[this.form.controls.numero.value.replace(/\s/g, '')];
    // Los datos de la tarjeta no se conservan en memoria tras tokenizar
    this.form.controls.numero.reset('');
    this.form.controls.cvc.reset('');
    this.form.controls.vence.reset('');
    this.pagar.emit(token);
  }

  invalido(c: 'nombre' | 'numero' | 'vence' | 'cvc') {
    const x = this.form.controls[c];
    return x.invalid && x.touched;
  }
}
