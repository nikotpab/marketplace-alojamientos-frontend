import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Cancelacion } from '../../core/reservas.service';

/** Resumen de la cancelación y de la devolución simulada registrada (RF-23). */
@Component({
  selector: 'app-detalle-cancelacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="cancelacion">
      <p>Cancelada el {{ c().fecha | date: "d MMM y, h:mm a" }} · Motivo: {{ c().motivo }}</p>
      @switch (c().estadoFinal) {
        @case ('DEVOLUCION_PROCESADA') {
          <p class="ok">Devolución registrada: {{ c().valorDevolucion | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</p>
        }
        @case ('SIN_DEVOLUCION') {
          <p>Según la política de cancelación, esta reserva no tiene devolución.</p>
        }
        @default {
          <p class="falla" role="status">
            Devolución no procesada ({{ c().valorDevolucion | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}).
            La reserva sigue cancelada; el equipo fue notificado.
          </p>
        }
      }
    </div>
  `,
  styles: `
    .cancelacion { margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--gris-borde); }
    p { margin: 2px 0 0; font-size: .8rem; color: #55574a; }
    .ok { color: var(--verde); font-weight: 600; }
    .falla { color: #7a5a00; font-weight: 600; }
  `,
})
export class DetalleCancelacionComponent {
  c = input.required<Cancelacion>();
}
