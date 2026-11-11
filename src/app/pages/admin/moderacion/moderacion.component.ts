import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Publicacion, PublicacionesService } from '../../../core/publicaciones.service';
import { ResenaVisible, ResenasService } from '../../../core/resenas.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

/**
 * Moderación de reseñas (RF-29). El backend aún no guarda reportes de usuarios (pendiente 17 de su README):
 * el administrador elige una publicación, revisa sus reseñas visibles y oculta las que incumplen.
 */
@Component({
  selector: 'app-moderacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, DialogoComponent],
  templateUrl: './moderacion.component.html',
  styleUrl: './moderacion.component.scss',
})
export class ModeracionComponent {
  private resenasApi = inject(ResenasService);

  publicaciones = signal<Publicacion[]>([]);
  publicacionId = '';
  resenas = signal<ResenaVisible[]>([]);
  cargando = signal(false);
  error = signal('');
  aviso = signal('');
  aOcultar = signal<ResenaVisible | null>(null);
  procesando = signal(false);

  constructor() {
    inject(PublicacionesService).todas().subscribe({
      next: (p) => this.publicaciones.set(p.filter((x) => x.estado !== 'BORRADOR')),
      error: () => this.error.set('No pudimos cargar las publicaciones.'),
    });
  }

  cargarResenas() {
    this.aviso.set('');
    this.resenas.set([]);
    if (!this.publicacionId) return;
    this.cargando.set(true);
    this.error.set('');
    this.resenasApi.dePublicacion(this.publicacionId).subscribe({
      next: (r) => {
        this.resenas.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las reseñas de esta publicación.');
        this.cargando.set(false);
      },
    });
  }

  ocultar() {
    const r = this.aOcultar();
    if (!r) return;
    this.procesando.set(true);
    this.resenasApi.ocultar(r.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.aOcultar.set(null);
        this.resenas.update((l) => l.filter((x) => x.id !== r.id));
        this.aviso.set('La reseña quedó oculta y ya no cuenta en el promedio del alojamiento. La acción quedó en auditoría.');
      },
      error: () => {
        this.procesando.set(false);
        this.aOcultar.set(null);
        this.error.set('No pudimos ocultar la reseña. Intenta de nuevo.');
      },
    });
  }

  estrellas(n: number) {
    return '★'.repeat(n);
  }
}
