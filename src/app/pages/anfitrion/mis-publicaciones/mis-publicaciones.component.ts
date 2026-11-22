import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ESTADO_TEXTO, Publicacion, PublicacionesService } from '../../../core/publicaciones.service';

/** Después de guardar, se dice si la publicación ya está en camino a Explorar o qué falta. */
const AVISOS_AL_GUARDAR: Record<string, string> = {
  revision: 'Cambios guardados. La publicación volvió a revisión y aparecerá en las búsquedas cuando un administrador la apruebe.',
  solicitada: 'Publicación creada y enviada a revisión. Aparecerá en Explorar cuando un administrador la apruebe.',
  borrador: 'Borrador guardado. Para que aparezca en Explorar, solicita la activación: un administrador la revisará.',
};

function avisoAlGuardar(guardada: string | null): string {
  if (!guardada) return '';
  return AVISOS_AL_GUARDAR[guardada] ?? 'Cambios guardados.';
}

@Component({
  selector: 'app-mis-publicaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './mis-publicaciones.component.html',
  styleUrl: './mis-publicaciones.component.scss',
})
export class MisPublicacionesComponent {
  private readonly api = inject(PublicacionesService);

  estados = ESTADO_TEXTO;
  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal(avisoAlGuardar(inject(ActivatedRoute).snapshot.queryParamMap.get('guardada')));

  /** Publicación con la confirmación de pausa abierta. */
  confirmandoPausa = signal<string | null>(null);
  procesando = signal<string | null>(null);

  constructor() {
    this.api.misPublicaciones().subscribe({
      next: (p) => {
        this.publicaciones.set(p);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus publicaciones. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  pausar(p: Publicacion) {
    this.ejecutar(p, this.api.pausar(p.id), 'quedó pausada: no aparece en búsquedas ni recibe reservas.');
  }

  reactivar(p: Publicacion) {
    this.ejecutar(p, this.api.reactivar(p.id), 'está activa de nuevo y ya aparece en búsquedas.');
  }

  solicitarActivacion(p: Publicacion) {
    this.ejecutar(p, this.api.solicitarActivacion(p.id), 'quedó pendiente de revisión: aparecerá en Explorar cuando un administrador la apruebe.',
      'le falta información para publicarse. Complétala en Editar y vuelve a solicitar la activación.');
  }

  /** @param incompleta mensaje si el backend responde 422 porque falta información mínima */
  private ejecutar(p: Publicacion, accion: ReturnType<PublicacionesService['pausar']>, mensaje: string, incompleta?: string) {
    this.procesando.set(p.id);
    this.aviso.set('');
    this.error.set('');
    accion.subscribe({
      next: (actualizada) => {
        this.publicaciones.update((l) => l.map((x) => (x.id === p.id ? actualizada : x)));
        this.confirmandoPausa.set(null);
        this.procesando.set(null);
        this.aviso.set(`"${p.titulo || 'Sin título'}" ${mensaje}`);
      },
      error: (e) => {
        this.procesando.set(null);
        if (e.status === 403) return;
        if (e.status === 422 && incompleta) {
          this.error.set(`A "${p.titulo || 'Sin título'}" ${incompleta}`);
          return;
        }
        this.error.set('No pudimos cambiar el estado de la publicación. Intenta de nuevo.');
      },
    });
  }
}
