import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TIPOS } from '../../../core/alojamientos.service';
import {
  ESTADO_TEXTO,
  EstadoPublicacion,
  Publicacion,
  PublicacionesService,
} from '../../../core/publicaciones.service';

type Filtro = EstadoPublicacion | 'TODAS';

@Component({
  selector: 'app-todas-publicaciones',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './todas-publicaciones.component.html',
  styleUrl: './todas-publicaciones.component.scss',
})
export class TodasPublicacionesComponent {
  private api = inject(PublicacionesService);

  estados = ESTADO_TEXTO;
  filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'TODAS', texto: 'Todas' },
    ...(Object.keys(ESTADO_TEXTO) as EstadoPublicacion[]).map((e) => ({ valor: e, texto: ESTADO_TEXTO[e] })),
  ];

  filtro = signal<Filtro>('TODAS');
  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');

  /** Conteo por estado para los chips del filtro. */
  conteo = computed(() => {
    const c: Record<string, number> = { TODAS: this.publicaciones().length };
    for (const p of this.publicaciones()) c[p.estado] = (c[p.estado] ?? 0) + 1;
    return c;
  });

  visibles = computed(() => {
    const f = this.filtro();
    return f === 'TODAS' ? this.publicaciones() : this.publicaciones().filter((p) => p.estado === f);
  });

  constructor() {
    this.api.todas().subscribe({
      next: (p) => {
        this.publicaciones.set(p);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las publicaciones. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  nombreTipo(codigo: string) {
    return TIPOS.find((t) => t.valor === codigo)?.texto ?? codigo;
  }
}
