import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cancelacion, ESTADO_RESERVA_TEXTO, Reserva, ReservasService } from '../../core/reservas.service';
import { CancelarReservaComponent } from './cancelar/cancelar-reserva.component';
import { ResenaFormComponent } from './resena/resena-form.component';

type Grupo = 'proximas' | 'completadas' | 'canceladas';

import { DetalleCancelacionComponent } from '../../shared/detalle-cancelacion/detalle-cancelacion.component';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, CancelarReservaComponent, DetalleCancelacionComponent, ResenaFormComponent],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.scss',
})
export class MisReservasComponent {
  estados = ESTADO_RESERVA_TEXTO;
  grupo = signal<Grupo>('proximas');
  reservas = signal<Reserva[]>([]);
  cargando = signal(true);
  error = signal('');
  /** Reserva abierta en el diálogo de cancelación. */
  aCancelar = signal<Reserva | null>(null);
  aviso = signal('');
  /** Reserva completada abierta en el formulario de reseña. */
  aResenar = signal<Reserva | null>(null);

  private hoy = new Date().toISOString().slice(0, 10);

  /** Próximas: confirmadas que aún no terminan o en revisión manual. */
  grupos = computed<Record<Grupo, Reserva[]>>(() => {
    const g: Record<Grupo, Reserva[]> = { proximas: [], completadas: [], canceladas: [] };
    for (const r of this.reservas()) {
      if (r.estado === 'CANCELADA') g.canceladas.push(r);
      else if (r.estado === 'COMPLETADA' || (r.estado === 'CONFIRMADA' && r.salida < this.hoy)) g.completadas.push(r);
      else g.proximas.push(r);
    }
    g.proximas.sort((a, b) => a.llegada.localeCompare(b.llegada));
    g.completadas.sort((a, b) => b.llegada.localeCompare(a.llegada));
    return g;
  });

  pestanas: { valor: Grupo; texto: string }[] = [
    { valor: 'proximas', texto: 'Próximas' },
    { valor: 'completadas', texto: 'Completadas' },
    { valor: 'canceladas', texto: 'Canceladas' },
  ];

  /** Solo se cancelan reservas confirmadas cuya estadía no ha comenzado. */
  cancelable(r: Reserva) {
    return r.estado === 'CONFIRMADA' && r.llegada > this.hoy;
  }

  /** Solo reservas completadas y aún sin reseña. */
  resenable(r: Reserva) {
    return r.estado === 'COMPLETADA' && !r.resenada;
  }

  alResenar(r: Reserva) {
    this.reservas.update((l) => l.map((x) => (x.id === r.id ? { ...x, resenada: true } : x)));
    this.aResenar.set(null);
    this.aviso.set('¡Gracias! Tu reseña quedó publicada.');
  }

  alCancelar(r: Reserva, c: Cancelacion) {
    this.reservas.update((l) => l.map((x) => (x.id === r.id ? { ...x, estado: 'CANCELADA' as const, cancelacion: c } : x)));
    this.aCancelar.set(null);
    this.aviso.set(
      c.estadoFinal === 'DEVOLUCION_NO_PROCESADA'
        ? `La reserva ${r.codigo} fue cancelada, pero la devolución no se pudo procesar. Ya notificamos al equipo para resolverlo.`
        : `La reserva ${r.codigo} fue cancelada. Las fechas quedaron libres y la cancelación quedó registrada.`,
    );
    this.grupo.set('canceladas');
  }

  constructor() {
    inject(ReservasService).misReservas().subscribe({
      next: (r) => {
        this.reservas.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus reservas. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }
}
