import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { ResenaPublicada, ResenasService, ResumenResenas } from '../../../core/resenas.service';

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

  resumen = signal<ResumenResenas | null>(null);
  resenas = signal<ResenaPublicada[]>([]);
  cargando = signal(true);
  cargandoMas = signal(false);
  error = signal(false);
  readonly niveles = [5, 4, 3, 2, 1];

  ngOnInit() {
    this.cargar(0);
  }

  cargar(pagina: number) {
    if (pagina === 0) this.cargando.set(true);
    else this.cargandoMas.set(true);
    this.api.dePublicacion(this.publicacionId(), pagina).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.resenas.update((l) => (pagina === 0 ? r.resenas : [...l, ...r.resenas]));
        this.cargando.set(false);
        this.cargandoMas.set(false);
        this.error.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
        this.cargandoMas.set(false);
      },
    });
  }

  estrellas(n: number) {
    return '★'.repeat(n);
  }

  porcentaje(nivel: number) {
    const r = this.resumen();
    return r && r.total ? Math.round(((r.distribucion[nivel] ?? 0) / r.total) * 100) : 0;
  }
}
