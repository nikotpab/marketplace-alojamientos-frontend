import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import { ResenaPublicada, ResenasService, ResumenResenas } from '../../../core/resenas.service';
import { DialogoMotivoComponent } from '../../../shared/dialogo-motivo/dialogo-motivo.component';

@Component({
  selector: 'app-resenas-publicacion',
  standalone: true,
  imports: [DatePipe, DecimalPipe, DialogoMotivoComponent],
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

  auth = inject(AuthService);
  aReportar = signal<ResenaPublicada | null>(null);
  reportadas = signal<string[]>([]);
  reportando = signal(false);
  errorReporte = signal('');

  reportar(motivo: string) {
    const r = this.aReportar();
    if (!r) return;
    this.reportando.set(true);
    this.errorReporte.set('');
    this.api.reportar(r.id, motivo).subscribe({
      next: () => {
        this.reportadas.update((l) => [...l, r.id]);
        this.reportando.set(false);
        this.aReportar.set(null);
      },
      error: (e) => {
        this.reportando.set(false);
        if (e.status === 409) {
          // Ya la había reportado: se considera hecho
          this.reportadas.update((l) => [...l, r.id]);
          this.aReportar.set(null);
        } else this.errorReporte.set('No pudimos enviar el reporte. Intenta de nuevo.');
      },
    });
  }

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
