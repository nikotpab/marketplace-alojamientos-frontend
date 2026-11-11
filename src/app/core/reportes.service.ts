import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

/** Cada exportación queda registrada (historial y auditoría) con quién la pidió y cuándo. */
export interface Exportacion {
  id: string;
  tipo: TipoReporte;
  formato: FormatoReporte;
  desde: string;
  hasta: string;
  ciudad: string | null;
  registros: number;
  usuario: string;
  fecha: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);

  /** Devuelve el archivo (PDF o Excel); el backend registra la exportación antes de responder. */
  exportar(s: SolicitudReporte): Observable<HttpResponse<Blob>> {
    return this.http.post('/api/admin/reportes/exportar', s, { observe: 'response', responseType: 'blob' });
  }

  historial(): Observable<Exportacion[]> {
    return this.http.get<Exportacion[]>('/api/admin/reportes/exportaciones');
  }
}
