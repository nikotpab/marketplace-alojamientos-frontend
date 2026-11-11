import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ACCIONES_AUDITORIA, AuditoriaService, EventoAuditoria, FiltrosAuditoria } from '../../../core/auditoria.service';

const POR_PAGINA = 25;

@Component({
  selector: 'app-auditoria',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent {
  private api = inject(AuditoriaService);

  acciones = ACCIONES_AUDITORIA;
  filtros: FiltrosAuditoria = { accion: '', entidad: '', desde: '', hasta: '', resultado: '' };
  /** Filtro por nombre de usuario (se aplica en el front sobre el campo actor). */
  usuario = signal('');
  eventos = signal<EventoAuditoria[]>([]);
  pagina = signal(0);
  cargando = signal(false);
  cargado = signal(false);
  error = signal('');

  filtrados = computed(() => {
    const q = this.usuario().trim().toLowerCase();
    return q ? this.eventos().filter((e) => (e.actor ?? '').toLowerCase().includes(q)) : this.eventos();
  });
  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)));
  visibles = computed(() => this.filtrados().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA));

  constructor() {
    this.consultar();
  }

  get rangoInvalido() {
    return !!this.filtros.desde && !!this.filtros.hasta && this.filtros.hasta < this.filtros.desde;
  }

  consultar() {
    if (this.rangoInvalido) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.consultar(this.filtros).subscribe({
      next: (r) => {
        this.eventos.set([...r].sort((a, b) => b.fecha.localeCompare(a.fecha)));
        this.pagina.set(0);
        this.cargando.set(false);
        this.cargado.set(true);
      },
      error: () => {
        this.error.set('No pudimos consultar la auditoría. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  limpiar() {
    this.filtros = { accion: '', entidad: '', desde: '', hasta: '', resultado: '' };
    this.usuario.set('');
    this.consultar();
  }

  /** El detalle llega como objeto (ej. { "Tarifa de servicio": "9 % → 10 %" }). */
  textoDetalle(d: Record<string, unknown> | null) {
    if (!d) return '';
    return Object.entries(d)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join(' · ');
  }
}
