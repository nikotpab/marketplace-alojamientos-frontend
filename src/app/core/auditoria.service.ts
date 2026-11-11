import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { RolUsuario } from './auth.service';

export type TipoEvento =
  | 'AUTENTICACION'
  | 'PUBLICACION'
  | 'RESERVA'
  | 'CANCELACION'
  | 'PAGO'
  | 'RESENA'
  | 'ADMINISTRACION'
  | 'CONFIGURACION'
  | 'EXPORTACION';

export const TIPO_EVENTO_TEXTO: Record<TipoEvento, string> = {
  AUTENTICACION: 'Autenticación',
  PUBLICACION: 'Publicación',
  RESERVA: 'Reserva',
  CANCELACION: 'Cancelación',
  PAGO: 'Pago',
  RESENA: 'Reseña',
  ADMINISTRACION: 'Acción administrativa',
  CONFIGURACION: 'Configuración',
  EXPORTACION: 'Exportación',
};

/** Registro inmutable (solo inserción): el front únicamente lo consulta. */
export interface EventoAuditoria {
  id: string;
  fecha: string;
  usuario: string;
  rol: RolUsuario | 'SISTEMA';
  tipo: TipoEvento;
  accion: string;
  entidad: string;
  entidadId: string | null;
  resultado: 'EXITO' | 'FALLO';
  detalle?: string | null;
  /** Hash de integridad del registro. */
  hash: string;
}

export interface FiltrosAuditoria {
  usuario?: string;
  tipo?: TipoEvento | '';
  desde?: string;
  hasta?: string;
  pagina?: number;
}

export interface PaginaAuditoria {
  contenido: EventoAuditoria[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);

  consultar(f: FiltrosAuditoria): Observable<PaginaAuditoria> {
    let p = new HttpParams().set('pagina', f.pagina ?? 0).set('tamano', 25);
    if (f.usuario?.trim()) p = p.set('usuario', f.usuario.trim());
    if (f.tipo) p = p.set('tipo', f.tipo);
    if (f.desde) p = p.set('desde', f.desde);
    if (f.hasta) p = p.set('hasta', f.hasta);
    return this.http.get<PaginaAuditoria>('/api/admin/auditoria', { params: p });
  }
}
