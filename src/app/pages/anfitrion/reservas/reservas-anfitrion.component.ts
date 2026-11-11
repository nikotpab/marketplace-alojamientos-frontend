import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ESTADO_RESERVA_TEXTO, EstadoReserva, Reserva, ReservasService } from '../../../core/reservas.service';

type Filtro = EstadoReserva | 'TODAS';

import { DetalleCancelacionComponent } from '../../../shared/detalle-cancelacion/detalle-cancelacion.component';

@Component({
  selector: 'app-reservas-anfitrion',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DetalleCancelacionComponent],
  templateUrl: './reservas-anfitrion.component.html',
  styleUrl: './reservas-anfitrion.component.scss',
})
export class ReservasAnfitrionComponent {
  estados = ESTADO_RESERVA_TEXTO;
  filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'TODAS', texto: 'Todas' },
    ...(Object.keys(ESTADO_RESERVA_TEXTO) as EstadoReserva[]).map((e) => ({ valor: e, texto: ESTADO_RESERVA_TEXTO[e] })),
  ];

  filtro = signal<Filtro>('TODAS');
  reservas = signal<Reserva[]>([]);
  cargando = signal(true);
  error = signal('');

  visibles = computed(() => {
    const f = this.filtro();
    return f === 'TODAS' ? this.reservas() : this.reservas().filter((r) => r.estado === f);
  });

  constructor() {
    inject(ReservasService).reservasAnfitrion().subscribe({
      next: (r) => {
        this.reservas.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las reservas. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  /** El contacto solo se muestra en reservas confirmadas (y solo si el backend lo envía). */
  verContacto(r: Reserva) {
    return r.estado === 'CONFIRMADA' && !!(r.contactoHuesped?.telefono || r.contactoHuesped?.correo);
  }
}
