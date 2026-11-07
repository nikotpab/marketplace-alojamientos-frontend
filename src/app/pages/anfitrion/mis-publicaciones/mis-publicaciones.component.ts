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
  aviso = inject(ActivatedRoute).snapshot.queryParamMap.get('guardada') ? 'Borrador guardado.' : '';

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
}
