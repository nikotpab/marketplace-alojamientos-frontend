import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';
import { SoloNumerosDirective } from '../../../shared/solo-numeros.directive';

/** Segundos entre dos envíos del código; el backend tampoco envía otro antes. */
export const ESPERA_REENVIO = 60;

/**
 * Ventana donde se escribe el código de 6 dígitos que llegó al correo antes de crear la cuenta.
 * Solo muestra y valida; las llamadas a la API las hace la pantalla de registro.
 */
@Component({
  selector: 'app-ventana-codigo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogoComponent, ReactiveFormsModule, SoloNumerosDirective],
  templateUrl: './ventana-codigo.component.html',
  styleUrl: './ventana-codigo.component.scss',
})
export class VentanaCodigoComponent {
  correo = input.required<string>();
  /** Mientras se crea la cuenta: bloquea el envío, el reenvío y el cierre. */
  procesando = input(false);
  error = input('');
  aviso = input('');

  confirmar = output<string>();
  reenviar = output<void>();
  cerrar = output<void>();

  formulario = new FormGroup({
    codigo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] }),
  });
  private readonly codigo = this.formulario.controls.codigo;
  intentoEnviar = signal(false);
  segundos = signal(ESPERA_REENVIO);

  private reloj?: ReturnType<typeof setInterval>;

  constructor() {
    this.contar();
    inject(DestroyRef).onDestroy(() => clearInterval(this.reloj));
  }

  invalido() {
    return this.codigo.invalid && this.intentoEnviar();
  }

  enviar() {
    this.intentoEnviar.set(true);
    if (this.codigo.invalid || this.procesando()) return;
    this.confirmar.emit(this.codigo.value);
  }

  pedirOtro() {
    if (this.segundos() > 0 || this.procesando()) return;
    this.codigo.reset();
    this.intentoEnviar.set(false);
    this.reenviar.emit();
    this.contar();
  }

  private contar() {
    clearInterval(this.reloj);
    this.segundos.set(ESPERA_REENVIO);
    this.reloj = setInterval(() => {
      this.segundos.update((s) => s - 1);
      if (this.segundos() <= 0) clearInterval(this.reloj);
    }, 1000);
  }
}
