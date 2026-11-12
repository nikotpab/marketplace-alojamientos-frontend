import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlojamientoDetalle, DetalleService } from '../../core/detalle.service';
import { Disponibilidad, DisponibilidadService } from '../../core/disponibilidad.service';
import { CalendarioComponent, RangoFechas } from '../../shared/calendario/calendario.component';
import { ResenasPublicacionComponent } from './resenas/resenas-publicacion.component';

const NOMBRES_TIPO: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  HABITACION: 'Habitación',
  CABANA: 'Cabaña',
};

@Component({
  selector: 'app-detalle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, RouterLink, CurrencyPipe, DatePipe, CalendarioComponent, ResenasPublicacionComponent],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss',
})
export class DetalleComponent {
  private ruta = inject(ActivatedRoute);
  private api = inject(DetalleService);

  alojamiento = signal<AlojamientoDetalle | null>(null);
  cargando = signal(true);
  error = signal('');
  /** Índice de la foto abierta en el visor (null = cerrado). */
  visor = signal<number | null>(null);

  tipoTexto = computed(() => NOMBRES_TIPO[this.alojamiento()?.tipo ?? ''] ?? '');

  private disp = inject(DisponibilidadService);
  disponibilidad = signal<Disponibilidad>({ bloqueados: [], reservados: [] });
  rango = signal<RangoFechas | null>(null);

  /** El calendario y la reserva solo aplican a alojamientos ACTIVOS. */
  activo = computed(() => this.alojamiento()?.estado === 'ACTIVA');

  /** Noches entre llegada y salida (la salida no se cobra). */
  noches = computed(() => {
    const r = this.rango();
    if (!r || r.hasta === r.desde) return 0;
    return Math.round((new Date(r.hasta).getTime() - new Date(r.desde).getTime()) / 86_400_000);
  });

  /** La selección no puede cruzar días reservados o bloqueados. */
  cruzaNoDisponibles = computed(() => {
    const r = this.rango();
    if (!r) return false;
    const { bloqueados, reservados } = this.disponibilidad();
    return [...bloqueados, ...reservados].some((d) => d > r.desde && d < r.hasta);
  });

  constructor() {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.api.obtener(id).subscribe({
      next: (a) => {
        this.alojamiento.set(a);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(
          e.status === 404
            ? 'Este alojamiento no existe o ya no está disponible.'
            : 'No pudimos cargar el alojamiento. Intenta de nuevo.',
        );
        this.cargando.set(false);
      },
    });
  }

  mover(paso: number, total: number) {
    const i = this.visor();
    if (i === null) return;
    this.visor.set((i + paso + total) % total);
  }

  irAlCalendario(e: Event) {
    e.preventDefault();
    document.getElementById('calendario')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cargarDisponibilidad(vista: RangoFechas) {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.disp.consultar(id, vista.desde, vista.hasta).subscribe({
      next: (d) => this.disponibilidad.set(d),
      error: () => this.disponibilidad.set({ bloqueados: [], reservados: [] }),
    });
  }
}
