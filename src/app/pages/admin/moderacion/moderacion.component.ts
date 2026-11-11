import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ResenaReportada, ResenasService } from '../../../core/resenas.service';
import { DialogoMotivoComponent } from '../../../shared/dialogo-motivo/dialogo-motivo.component';

@Component({
  selector: 'app-moderacion',
  standalone: true,
  imports: [DatePipe, DialogoMotivoComponent],
  templateUrl: './moderacion.component.html',
  styleUrl: './moderacion.component.scss',
})
export class ModeracionComponent {
  private api = inject(ResenasService);

  resenas = signal<ResenaReportada[]>([]);
  cargando = signal(true);
  error = signal('');
  aviso = signal('');
  aOcultar = signal<ResenaReportada | null>(null);
  procesando = signal(false);
  errorAccion = signal('');

  constructor() {
    this.api.reportadas().subscribe({
      next: (r) => {
        this.resenas.set([...r].sort((a, b) => b.reportes - a.reportes));
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar las reseñas reportadas. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  mantener(r: ResenaReportada) {
    this.aviso.set('');
    this.api.mantener(r.id).subscribe({
      next: () => this.resolver(r, 'La reseña se mantiene visible y se descartaron sus reportes.'),
      error: () => this.aviso.set('No pudimos registrar la decisión. Intenta de nuevo.'),
    });
  }

  ocultar(motivo: string) {
    const r = this.aOcultar();
    if (!r) return;
    this.procesando.set(true);
    this.errorAccion.set('');
    this.api.ocultar(r.id, motivo).subscribe({
      next: () => {
        this.procesando.set(false);
        this.aOcultar.set(null);
        this.resolver(r, 'La reseña quedó oculta y ya no cuenta en el promedio del alojamiento.');
      },
      error: () => {
        this.procesando.set(false);
        this.errorAccion.set('No pudimos ocultar la reseña. Intenta de nuevo.');
      },
    });
  }

  private resolver(r: ResenaReportada, mensaje: string) {
    this.resenas.update((l) => l.filter((x) => x.id !== r.id));
    this.aviso.set(mensaje);
  }

  estrellas(n: number) {
    return '★'.repeat(n);
  }
}
