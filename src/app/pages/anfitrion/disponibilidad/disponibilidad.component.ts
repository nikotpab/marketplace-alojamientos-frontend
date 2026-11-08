import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Disponibilidad, DisponibilidadService, EstadoPeriodo } from '../../../core/disponibilidad.service';
import { CalendarioComponent, RangoFechas } from '../../../shared/calendario/calendario.component';

@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  imports: [RouterLink, DatePipe, CalendarioComponent],
  templateUrl: './disponibilidad.component.html',
  styleUrl: './disponibilidad.component.scss',
})
export class DisponibilidadComponent {
  private api = inject(DisponibilidadService);
  id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  datos = signal<Disponibilidad>({ bloqueados: [], reservados: [] });
  rango = signal<RangoFechas | null>(null);
  guardando = signal(false);
  error = signal('');
  aviso = signal('');
  private calendario = viewChild(CalendarioComponent);

  /** Los días con reserva confirmada no se pueden editar a mano. */
  incluyeReservas = computed(() => {
    const r = this.rango();
    return !!r && this.datos().reservados.some((d) => d >= r.desde && d <= r.hasta);
  });

  noches = computed(() => {
    const r = this.rango();
    if (!r) return 0;
    return Math.round((new Date(r.hasta).getTime() - new Date(r.desde).getTime()) / 86_400_000) + 1;
  });

  cargar(vista: RangoFechas) {
    this.api.consultar(this.id, vista.desde, vista.hasta).subscribe({
      next: (d) => this.datos.set(d),
      error: (e) => {
        if (e.status !== 403) this.error.set('No pudimos cargar la disponibilidad. Intenta de nuevo.');
      },
    });
  }

  marcar(estado: EstadoPeriodo) {
    const r = this.rango();
    if (!r || this.incluyeReservas()) return;
    this.guardando.set(true);
    this.error.set('');
    this.aviso.set('');
    this.api.actualizar(this.id, r.desde, r.hasta, estado).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.guardando.set(false);
        this.aviso.set(estado === 'BLOQUEADO' ? 'Fechas bloqueadas.' : 'Fechas marcadas como disponibles.');
        this.calendario()?.limpiar();
      },
      error: (e) => {
        this.guardando.set(false);
        if (e.status === 403) return;
        this.error.set(
          e.status === 409
            ? 'El rango incluye días con reservas confirmadas; esos días no se pueden editar.'
            : 'No pudimos guardar el cambio. Intenta de nuevo.',
        );
      },
    });
  }
}
