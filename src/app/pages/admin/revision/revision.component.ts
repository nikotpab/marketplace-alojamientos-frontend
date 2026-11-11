import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TiposAlojamientoService } from '../../../core/tipos-alojamiento.service';
import { Publicacion, PublicacionesService } from '../../../core/publicaciones.service';

const MOTIVO_MINIMO = 10;

@Component({
  selector: 'app-revision',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './revision.component.html',
  styleUrl: './revision.component.scss',
})
export class RevisionComponent {
  private tiposApi = inject(TiposAlojamientoService);
  private api = inject(PublicacionesService);

  minimo = MOTIVO_MINIMO;
  pendientes = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');

  /** Publicación con el formulario de rechazo abierto. */
  rechazando = signal<string | null>(null);
  motivo = '';
  errorMotivo = signal('');
  procesando = signal<string | null>(null);

  nombreTipo(codigo: string) {
    return this.tiposApi.nombre(codigo);
  }

  constructor() {
    this.api.pendientesDeRevision().subscribe({
      next: (p) => {
        this.pendientes.set(p);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las publicaciones pendientes. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  aprobar(p: Publicacion) {
    this.procesando.set(p.id);
    this.aviso.set('');
    this.api.aprobar(p.id).subscribe({
      next: () => this.terminar(p, `"${p.titulo}" fue aprobada y ya aparece en búsquedas. Se notificó al anfitrión.`),
      error: (e) => this.fallo(e),
    });
  }

  abrirRechazo(p: Publicacion) {
    this.rechazando.set(p.id);
    this.motivo = '';
    this.errorMotivo.set('');
  }

  cancelarRechazo() {
    this.rechazando.set(null);
  }

  confirmarRechazo(p: Publicacion) {
    const motivo = this.motivo.trim();
    if (motivo.length < MOTIVO_MINIMO) {
      this.errorMotivo.set(`El motivo es obligatorio (mínimo ${MOTIVO_MINIMO} caracteres) para que el anfitrión sepa qué corregir.`);
      return;
    }
    this.procesando.set(p.id);
    this.api.rechazar(p.id, motivo).subscribe({
      next: () => this.terminar(p, `"${p.titulo}" fue rechazada y volvió a borrador. Se notificó al anfitrión con el motivo.`),
      error: (e) => this.fallo(e),
    });
  }

  private terminar(p: Publicacion, mensaje: string) {
    this.pendientes.update((l) => l.filter((x) => x.id !== p.id));
    this.rechazando.set(null);
    this.procesando.set(null);
    this.aviso.set(mensaje);
  }

  private fallo(e: { status: number }) {
    this.procesando.set(null);
    if (e.status === 403) return; // el interceptor redirige a /acceso-denegado
    this.error.set('No pudimos registrar la decisión. Intenta de nuevo.');
  }
}
