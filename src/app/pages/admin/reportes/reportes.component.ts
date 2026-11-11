import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Exportacion,
  FormatoReporte,
  ReportesService,
  SolicitudReporte,
  TIPO_REPORTE_TEXTO,
  TipoReporte,
} from '../../../core/reportes.service';

const hoyISO = () => new Date().toISOString().slice(0, 10);

@Component({
  selector: 'app-reportes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss',
})
export class ReportesComponent {
  private api = inject(ReportesService);

  tipos = Object.entries(TIPO_REPORTE_TEXTO) as [TipoReporte, string][];
  tipoTexto = TIPO_REPORTE_TEXTO;
  solicitud: SolicitudReporte = {
    tipo: 'RESERVAS',
    formato: 'EXCEL',
    desde: new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10),
    hasta: hoyISO(),
    ciudad: '',
  };
  generando = signal(false);
  error = signal('');
  aviso = signal('');
  historial = signal<Exportacion[]>([]);

  constructor() {
    this.cargarHistorial();
  }

  get rangoInvalido() {
    return !this.solicitud.desde || !this.solicitud.hasta || this.solicitud.hasta < this.solicitud.desde;
  }

  cargarHistorial() {
    this.api.historial().subscribe({ next: (h) => this.historial.set(h), error: () => this.historial.set([]) });
  }

  exportar() {
    if (this.rangoInvalido || this.generando()) return;
    this.generando.set(true);
    this.error.set('');
    this.aviso.set('');
    const s: SolicitudReporte = { ...this.solicitud, ciudad: this.solicitud.ciudad?.trim() || undefined };
    this.api.exportar(s).subscribe({
      next: (r) => {
        this.generando.set(false);
        if (r.body) this.descargar(r.body, this.nombreArchivo(r.headers.get('Content-Disposition'), s));
        this.aviso.set('Reporte generado. La exportación quedó registrada en el historial y en auditoría.');
        this.cargarHistorial();
      },
      error: (e) => {
        this.generando.set(false);
        this.error.set(
          e.status === 400
            ? 'Revisa el periodo: la fecha final no puede ser anterior a la inicial.'
            : 'No pudimos generar el reporte. Intenta de nuevo.',
        );
      },
    });
  }

  textoTipo(t: string) {
    return this.tipoTexto[t as TipoReporte] ?? t;
  }

  private nombreArchivo(cabecera: string | null, s: SolicitudReporte) {
    const m = cabecera && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera);
    if (m) return decodeURIComponent(m[1]);
    const ext: Record<FormatoReporte, string> = { PDF: 'pdf', EXCEL: 'xlsx' };
    return `reporte-${s.tipo.toLowerCase()}-${s.desde}-a-${s.hasta}.${ext[s.formato]}`;
  }

  private descargar(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
