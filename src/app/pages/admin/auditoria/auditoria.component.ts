import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AuditoriaService,
  FiltrosAuditoria,
  PaginaAuditoria,
  TIPO_EVENTO_TEXTO,
  TipoEvento,
} from '../../../core/auditoria.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent {
  private api = inject(AuditoriaService);

  tipos = Object.entries(TIPO_EVENTO_TEXTO) as [TipoEvento, string][];
  tipoTexto = TIPO_EVENTO_TEXTO;
  filtros: FiltrosAuditoria = { usuario: '', tipo: '', desde: '', hasta: '' };
  resultado = signal<PaginaAuditoria | null>(null);
  cargando = signal(false);
  error = signal('');

  constructor() {
    this.consultar(0);
  }

  get rangoInvalido() {
    return !!this.filtros.desde && !!this.filtros.hasta && this.filtros.hasta < this.filtros.desde;
  }

  consultar(pagina: number) {
    if (this.rangoInvalido) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.consultar({ ...this.filtros, pagina }).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos consultar la auditoría. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  limpiar() {
    this.filtros = { usuario: '', tipo: '', desde: '', hasta: '' };
    this.consultar(0);
  }
}
