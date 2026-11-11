import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PrevisualizacionCancelacion, Reserva, ReservasService } from '../../../core/reservas.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

type Paso = 'motivo' | 'revision';

@Component({
  selector: 'app-cancelar-reserva',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, DialogoComponent],
  templateUrl: './cancelar-reserva.component.html',
})
export class CancelarReservaComponent {
  private api = inject(ReservasService);

  reserva = input.required<Reserva>();
  cerrar = output<void>();
  cancelada = output<Reserva>();

  paso = signal<Paso>('motivo');
  motivo = '';
  intentoEnviar = signal(false);
  previa = signal<PrevisualizacionCancelacion | null>(null);
  procesando = signal(false);
  error = signal('');

  get motivoValido() {
    return this.motivo.trim().length >= 5;
  }

  /** Paso 1 → 2: con el motivo, se calcula la devolución para que el huésped decida. */
  revisar() {
    this.intentoEnviar.set(true);
    if (!this.motivoValido || this.procesando()) return;
    this.procesando.set(true);
    this.error.set('');
    this.api.previsualizarCancelacion(this.reserva().id).subscribe({
      next: (p) => {
        this.previa.set(p);
        this.paso.set('revision');
        this.procesando.set(false);
      },
      error: () => {
        this.error.set('No pudimos calcular la devolución. Intenta de nuevo.');
        this.procesando.set(false);
      },
    });
  }

  confirmar() {
    if (this.procesando()) return;
    this.procesando.set(true);
    this.error.set('');
    this.api.cancelar(this.reserva().id, this.motivo.trim()).subscribe({
      next: (r) => {
        this.procesando.set(false);
        this.cancelada.emit(r);
      },
      error: (e) => {
        this.procesando.set(false);
        this.error.set(
          e.status === 409
            ? 'Esta reserva ya no se puede cancelar (ya fue cancelada o la estadía comenzó).'
            : 'No pudimos cancelar la reserva. Tu reserva sigue confirmada; intenta de nuevo.',
        );
      },
    });
  }
}
