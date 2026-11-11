import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TiposAlojamientoService } from '../../../core/tipos-alojamiento.service';
import { DialogoMotivoComponent } from '../../../shared/dialogo-motivo/dialogo-motivo.component';
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
  imports: [RouterLink, CurrencyPipe, DialogoMotivoComponent],
  templateUrl: './todas-publicaciones.component.html',
  styleUrl: './todas-publicaciones.component.scss',
})
export class TodasPublicacionesComponent {
  private tiposApi = inject(TiposAlojamientoService);
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

  aBloquear = signal<Publicacion | null>(null);
  procesando = signal(false);
  errorAccion = signal('');
  aviso = signal('');

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

  /** Se puede bloquear cualquier publicación que no esté ya bloqueada. */
  bloqueable(p: Publicacion) {
    return p.estado !== 'BLOQUEADA';
  }

  bloquear(motivo: string) {
    const p = this.aBloquear();
    if (!p) return;
    this.procesando.set(true);
    this.errorAccion.set('');
    this.api.bloquear(p.id, motivo).subscribe({
      next: (r) => {
        this.reemplazar(r.publicacion);
        this.procesando.set(false);
        this.aBloquear.set(null);
        this.aviso.set(
          `"${p.titulo}" quedó bloqueada y fuera de las búsquedas.` +
            (r.reservasEnRevision ? ` ${r.reservasEnRevision} reserva(s) futuras pasaron a revisión manual.` : '') +
            ' Se notificó al anfitrión.',
        );
      },
      error: () => {
        this.procesando.set(false);
        this.errorAccion.set('No pudimos bloquear la publicación. Intenta de nuevo.');
      },
    });
  }

  reactivar(p: Publicacion) {
    this.aviso.set('');
    this.api.reactivarBloqueada(p.id).subscribe({
      next: (r) => {
        this.reemplazar(r);
        this.aviso.set(`"${p.titulo}" fue reactivada.`);
      },
      error: () => this.aviso.set('No pudimos reactivar la publicación. Intenta de nuevo.'),
    });
  }

  private reemplazar(p: Publicacion) {
    this.publicaciones.update((l) => l.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
  }

  nombreTipo(codigo: string) {
    return this.tiposApi.nombre(codigo);
  }
}
