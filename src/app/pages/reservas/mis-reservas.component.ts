import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADO_RESERVA_TEXTO, Reserva, ReservasService } from '../../core/reservas.service';

type Grupo = 'proximas' | 'completadas' | 'canceladas';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.scss',
})
export class MisReservasComponent {
  estados = ESTADO_RESERVA_TEXTO;
  grupo = signal<Grupo>('proximas');
  reservas = signal<Reserva[]>([]);
  cargando = signal(true);
  error = signal('');

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
