import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reserva } from '../../../core/reservas.service';
import { MAX_COMENTARIO, ResenasService } from '../../../core/resenas.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

@Component({
  selector: 'app-resena-form',
  standalone: true,
  imports: [FormsModule, DialogoComponent],
  templateUrl: './resena-form.component.html',
  styleUrl: './resena-form.component.scss',
})
export class ResenaFormComponent {
  private api = inject(ResenasService);

  reserva = input.required<Reserva>();
  cerrar = output<void>();
  publicada = output<void>();

  readonly max = MAX_COMENTARIO;
  readonly estrellas = [1, 2, 3, 4, 5];
  calificacion = signal(0);
  comentario = '';
  intento = signal(false);
  enviando = signal(false);
  error = signal('');

  get comentarioValido() {
    const n = this.comentario.trim().length;
    return n > 0 && n <= this.max;
  }

  enviar() {
    this.intento.set(true);
    if (!this.calificacion() || !this.comentarioValido || this.enviando()) return;
    this.enviando.set(true);
    this.error.set('');
    this.api.crear(this.reserva().id, { calificacion: this.calificacion(), comentario: this.comentario.trim() }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.publicada.emit();
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(
          e.status === 409
            ? 'Ya reseñaste esta reserva. Cada reserva admite una sola reseña.'
            : e.status === 422
              ? 'Solo puedes reseñar estadías completadas.'
              : 'No pudimos publicar tu reseña. Intenta de nuevo.',
        );
      },
    });
  }
}
