import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogoComponent } from '../dialogo/dialogo.component';

/**
 * Acción administrativa con motivo obligatorio. Si se define `confirmacion`, pide una segunda
 * confirmación antes de emitir (ej. bloquear una publicación o restringir un usuario).
 */
@Component({
  selector: 'app-dialogo-motivo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DialogoComponent],
  template: `
    <app-dialogo [titulo]="titulo()" [bloqueado]="procesando()" (cerrar)="cerrar.emit()">
      @if (descripcion()) { <p>{{ descripcion() }}</p> }

      @if (!confirmando()) {
        <label class="campo-dialogo">
          {{ etiquetaMotivo() }}
          <textarea rows="3" maxlength="500" [(ngModel)]="motivo" [attr.aria-invalid]="intento() && !valido"></textarea>
          @if (intento() && !valido) {
            <small class="texto-error" role="alert">El motivo es obligatorio (mínimo 5 caracteres).</small>
          }
        </label>
      } @else {
        <p class="confirmar" role="alert">{{ confirmacion() }}</p>
        <p class="motivo">Motivo: {{ motivo.trim() }}</p>
      }

      @if (error()) { <p class="texto-error" role="alert">{{ error() }}</p> }
      <div class="acciones-dialogo">
        <button type="button" class="btn-secundario" [disabled]="procesando()"
                (click)="confirmando() ? confirmando.set(false) : cerrar.emit()">
          {{ confirmando() ? 'Volver' : 'Cancelar' }}
        </button>
        <button type="button" [class]="peligro() ? 'btn-peligro' : 'btn-primario'" [disabled]="procesando()" (click)="continuar()">
          {{ procesando() ? 'Procesando…' : confirmacion() && !confirmando() ? 'Continuar' : textoAccion() }}
        </button>
      </div>
    </app-dialogo>
  `,
  styles: `
    .confirmar { padding: 12px 14px; border-radius: 12px; background: #fbe4e4; color: var(--rojo); font-weight: 600; }
    .motivo { font-size: .85rem; color: #55574a; overflow-wrap: anywhere; }
  `,
})
export class DialogoMotivoComponent {
  titulo = input.required<string>();
  descripcion = input('');
  etiquetaMotivo = input('Motivo');
  textoAccion = input('Confirmar');
  /** Texto de la segunda confirmación; vacío = sin segundo paso. */
  confirmacion = input('');
  peligro = input(true);
  procesando = input(false);
  error = input('');

  confirmar = output<string>();
  cerrar = output<void>();

  motivo = '';
  intento = signal(false);
  confirmando = signal(false);

  get valido() {
    return this.motivo.trim().length >= 5;
  }

  continuar() {
    this.intento.set(true);
    if (!this.valido || this.procesando()) return;
    if (this.confirmacion() && !this.confirmando()) {
      this.confirmando.set(true);
      return;
    }
    this.confirmar.emit(this.motivo.trim());
  }
}
