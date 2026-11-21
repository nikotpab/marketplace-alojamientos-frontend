import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/auth.service';
import {
  MAX_COMENTARIO_REPORTE,
  MOTIVO_REPORTE_TEXTO,
  MotivoReporte,
  ResenaVisible,
  ResenasService,
} from '../../../core/resenas.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

const POR_PAGINA = 10;

@Component({
  selector: 'app-resenas-publicacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, DialogoComponent],
  templateUrl: './resenas-publicacion.component.html',
  styleUrl: './resenas-publicacion.component.scss',
})
export class ResenasPublicacionComponent implements OnInit {
  private api = inject(ResenasService);
  private auth = inject(AuthService);

  publicacionId = input.required<string>();

  resenas = signal<ResenaVisible[]>([]);
  cargando = signal(true);
  error = signal(false);
  visibles = signal(POR_PAGINA);
  readonly niveles = [5, 4, 3, 2, 1];

  /** Promedio y distribución calculados solo con las reseñas visibles. */
  total = computed(() => this.resenas().length);
  promedio = computed(() => (this.total() ? this.resenas().reduce((a, r) => a + r.calificacion, 0) / this.total() : null));
  distribucion = computed(() => {
    const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of this.resenas()) d[r.calificacion] = (d[r.calificacion] ?? 0) + 1;
    return d;
  });
  mostradas = computed(() => this.resenas().slice(0, this.visibles()));

  /** SCRUM-111: reportar exige sesión; el backend rechaza la propia reseña y los reportes repetidos. */
  conSesion = computed(() => !!this.auth.usuario());
  readonly motivos = Object.entries(MOTIVO_REPORTE_TEXTO).map(([valor, texto]) => ({ valor: valor as MotivoReporte, texto }));
  readonly maxComentario = MAX_COMENTARIO_REPORTE;
  aReportar = signal<ResenaVisible | null>(null);
  motivo = signal<MotivoReporte | ''>('');
  comentario = signal('');
  enviando = signal(false);
  errorReporte = signal('');
  reportadas = signal<ReadonlySet<string>>(new Set());

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando.set(true);
    this.api.dePublicacion(this.publicacionId()).subscribe({
      next: (r) => {
        this.resenas.set([...r].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        this.cargando.set(false);
        this.error.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  abrirReporte(r: ResenaVisible) {
    this.motivo.set('');
    this.comentario.set('');
    this.errorReporte.set('');
    this.aReportar.set(r);
  }

  reportar() {
    const r = this.aReportar();
    const motivo = this.motivo();
    if (!r) return;
    if (!motivo) {
      this.errorReporte.set('Elige el motivo del reporte.');
      return;
    }
    this.enviando.set(true);
    this.errorReporte.set('');
    this.api.reportar(r.id, motivo, this.comentario().trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.aReportar.set(null);
        this.reportadas.update((s) => new Set([...s, r.id]));
      },
      error: (e) => {
        this.enviando.set(false);
        this.errorReporte.set(e.status === 409 && e.error?.detail ? e.error.detail : 'No pudimos enviar el reporte. Intenta de nuevo.');
      },
    });
  }

  verMas() {
    this.visibles.update((n) => n + POR_PAGINA);
  }

  estrellas(n: number) {
    return '★'.repeat(n);
  }

  porcentaje(nivel: number) {
    return this.total() ? Math.round((this.distribucion()[nivel] / this.total()) * 100) : 0;
  }
}
