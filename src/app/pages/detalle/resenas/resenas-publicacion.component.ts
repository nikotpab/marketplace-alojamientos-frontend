import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { ResenaVisible, ResenasService } from '../../../core/resenas.service';

const POR_PAGINA = 10;

@Component({
  selector: 'app-resenas-publicacion',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './resenas-publicacion.component.html',
  styleUrl: './resenas-publicacion.component.scss',
})
export class ResenasPublicacionComponent implements OnInit {
  private api = inject(ResenasService);

  publicacionId = input.required<string>();

  resenas = signal<ResenaVisible[]>([]);
  cargando = signal(true);
  error = signal(false);
  visibles = signal(POR_PAGINA);
  readonly niveles = [5, 4, 3, 2, 1];

  /** Promedio y distribución calculados solo con las reseñas visibles. */
  total = computed(() => this.resenas().length);
  promedio = computed(() => (this.total() ? this.resenas().reduce((a, r) => a + r.calificacion, 0) / this.total() : null));
  distribucion = computed(() => {
    const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of this.resenas()) d[r.calificacion] = (d[r.calificacion] ?? 0) + 1;
    return d;
  });
  mostradas = computed(() => this.resenas().slice(0, this.visibles()));

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.dePublicacion(this.publicacionId()).subscribe({
      next: (r) => {
        this.resenas.set([...r].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        this.cargando.set(false);
        this.error.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  verMas() {
    this.visibles.update((n) => n + POR_PAGINA);
  }

  estrellas(n: number) {
    return '★'.repeat(n);
  }

  porcentaje(nivel: number) {
    return this.total() ? Math.round((this.distribucion()[nivel] / this.total()) * 100) : 0;
  }
}
