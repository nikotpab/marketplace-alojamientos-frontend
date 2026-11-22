import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TiposAlojamientoService } from '../../../core/tipos-alojamiento.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DialogoComponent, DialogoMotivoComponent],
  templateUrl: './todas-publicaciones.component.html',
  styleUrl: './todas-publicaciones.component.scss',
})
export class TodasPublicacionesComponent {
  private readonly tiposApi = inject(TiposAlojamientoService);
  private readonly api = inject(PublicacionesService);

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
  aDesbloquear = signal<Publicacion | null>(null);
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
      next: () => {
        this.reemplazar({ ...p, estado: 'BLOQUEADA', motivoBloqueo: motivo });
        this.procesando.set(false);
        this.aBloquear.set(null);
        this.aviso.set(
          `"${p.titulo}" quedó bloqueada y fuera de las búsquedas. Sus reservas futuras pasaron a revisión y se notificó al anfitrión.`,
        );
      },
      error: () => {
        this.procesando.set(false);
        this.errorAccion.set('No pudimos bloquear la publicación. Intenta de nuevo.');
      },
    });
  }

  /** Vuelve a ACTIVA y sus reservas en revisión a confirmadas. */
  desbloquear() {
    const p = this.aDesbloquear();
    if (!p) return;
    this.procesando.set(true);
    this.errorAccion.set('');
    this.api.desbloquear(p.id).subscribe({
      next: () => {
        this.reemplazar({ ...p, estado: 'ACTIVA', motivoBloqueo: null });
        this.procesando.set(false);
        this.aDesbloquear.set(null);
        this.aviso.set(`"${p.titulo}" volvió a estar activa. Sus reservas en revisión quedaron confirmadas y se avisó al anfitrión.`);
      },
      error: () => {
        this.procesando.set(false);
        this.errorAccion.set('No pudimos desbloquear la publicación. Intenta de nuevo.');
      },
    });
  }

  private reemplazar(p: Publicacion) {
    this.publicaciones.update((l) => l.map((x) => (x.id === p.id ? { ...x, ...p } : x)));
  }

  nombreTipo(codigo: string) {
    return this.tiposApi.nombre(codigo);
  }
}
