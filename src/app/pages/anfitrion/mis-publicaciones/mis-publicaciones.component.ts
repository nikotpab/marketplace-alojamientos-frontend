import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ESTADO_TEXTO, Publicacion, PublicacionesService } from '../../../core/publicaciones.service';

@Component({
  selector: 'app-mis-publicaciones',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './mis-publicaciones.component.html',
  styleUrl: './mis-publicaciones.component.scss',
})
export class MisPublicacionesComponent {
  private api = inject(PublicacionesService);

  estados = ESTADO_TEXTO;
  publicaciones = signal<Publicacion[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('guardada') ? 'Cambios guardados.' : '');

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

  private ejecutar(p: Publicacion, accion: ReturnType<PublicacionesService['pausar']>, mensaje: string) {
    this.procesando.set(p.id);
    this.aviso.set('');
    this.error.set('');
    accion.subscribe({
      next: (actualizada) => {
        this.publicaciones.update((l) => l.map((x) => (x.id === p.id ? actualizada : x)));
        this.confirmandoPausa.set(null);
        this.procesando.set(null);
        this.aviso.set(`"${p.titulo}" ${mensaje}`);
      },
      error: (e) => {
        this.procesando.set(null);
        if (e.status === 403) return;
        this.error.set('No pudimos cambiar el estado de la publicación. Intenta de nuevo.');
      },
    });
  }
}
