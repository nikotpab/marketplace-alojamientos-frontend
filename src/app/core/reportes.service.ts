import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuditoriaService } from './auditoria.service';

export type TipoReporte = 'USUARIOS' | 'PUBLICACIONES' | 'RESERVAS' | 'INGRESOS_DEMANDA';
export type FormatoReporte = 'PDF' | 'EXCEL';

export const TIPO_REPORTE_TEXTO: Record<TipoReporte, string> = {
  USUARIOS: 'Usuarios',
  PUBLICACIONES: 'Publicaciones',
  RESERVAS: 'Reservas',
  INGRESOS_DEMANDA: 'Ingresos y demanda',
};

export interface SolicitudReporte {
  tipo: TipoReporte;
  formato: FormatoReporte;
  desde: string;
  hasta: string;
  ciudad?: string;
}

/** Una exportación registrada en la auditoría (evento ReporteExportado): quién, cuándo y con qué filtros. */
export interface Exportacion {
  id: string;
  tipo: string;
  formato: string;
  desde: string | null;
  hasta: string | null;
  ciudad: string | null;
  filas: number | null;
  usuario: string;
  fecha: string;
}

/** El backend guarda los filtros vacíos como el texto "null". */
const valor = (v: unknown) => (v === undefined || v === null || v === 'null' || v === '' ? null : String(v));

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);

  private auditoria = inject(AuditoriaService);

  /** Devuelve el archivo (PDF o Excel); el backend registra la exportación en la auditoría. */
  exportar(s: SolicitudReporte): Observable<HttpResponse<Blob>> {
    let params = new HttpParams().set('tipo', s.tipo).set('formato', s.formato);
    if (s.desde) params = params.set('desde', s.desde);
    if (s.hasta) params = params.set('hasta', s.hasta);
    if (s.ciudad) params = params.set('ciudad', s.ciudad);
    return this.http.get('/api/admin/reportes', { params, observe: 'response', responseType: 'blob' });
  }

  /** El historial de exportaciones es la auditoría filtrada por ReporteExportado. */
  historial(): Observable<Exportacion[]> {
    return this.auditoria.consultar({ accion: 'ReporteExportado' }).pipe(
      map((eventos) =>
        eventos
          .map((e) => {
            const d = e.detalle ?? {};
            return {
              id: e.id,
              tipo: String(d['tipo'] ?? ''),
              formato: String(d['formato'] ?? ''),
              desde: valor(d['desde']),
              hasta: valor(d['hasta']),
              ciudad: valor(d['ciudad']),
              filas: d['filas'] == null ? null : Number(d['filas']),
              usuario: e.actor ?? '—',
              fecha: e.fecha,
            };
          })
          .sort((a, b) => b.fecha.localeCompare(a.fecha)),
      ),
    );
  }
}
