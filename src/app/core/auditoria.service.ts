import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

/** Acciones más consultadas (nombre del evento de dominio que registra el backend). */
export const ACCIONES_AUDITORIA: string[] = [
  'InicioSesionExitoso', 'InicioSesionFallido', 'AccesoDenegado', 'UsuarioRegistrado', 'UsuarioRestringido',
  'PublicacionCreada', 'PublicacionEditada', 'PublicacionEnviadaARevision', 'PublicacionAprobada', 'PublicacionRechazada',
  'PublicacionPausada', 'PublicacionReactivada', 'PublicacionBloqueada', 'DisponibilidadModificada',
  'ReservaConfirmada', 'ReservaCancelada', 'ReservaCompletada', 'ReservaEnRevision', 'PagoFallido',
  'DevolucionProcesada', 'DevolucionFallida', 'ResenaPublicada', 'ResenaOcultada',
  'TarifasActualizadas', 'TipoAlojamientoAgregado', 'TipoAlojamientoEditado', 'ReporteExportado',
];

export type ResultadoAuditoria = 'EXITO' | 'FALLIDO' | 'DENEGADO';

/** Registro inmutable (solo inserción): el front únicamente lo consulta. */
export interface EventoAuditoria {
  id: string;
  actorId: string | null;
  actor: string | null;
  rol: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  resultado: ResultadoAuditoria | string;
  detalle: Record<string, unknown> | null;
  /** Hash de integridad del registro. */
  hashRegistro: string;
  fecha: string;
}

/** Filtros del backend; todos opcionales. Las fechas se interpretan en hora de Colombia. */
export interface FiltrosAuditoria {
  actorId?: string;
  accion?: string;
  entidad?: string;
  desde?: string;
  hasta?: string;
  resultado?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);

  consultar(f: FiltrosAuditoria): Observable<EventoAuditoria[]> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(f)) if (v) p = p.set(k, v);
    return this.http.get<EventoAuditoria[]>('/api/admin/auditoria', { params: p });
  }
}
