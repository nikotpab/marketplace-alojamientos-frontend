import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type TipoAlojamiento = 'CASA' | 'APARTAMENTO' | 'HABITACION' | 'CABANA';

export interface FiltrosBusqueda {
  ciudad?: string;
  llegada?: string;
  salida?: string;
  huespedes?: number;
  tipo?: TipoAlojamiento | '';
  precioMin?: number;
  precioMax?: number;
  servicios?: string[];
  pagina?: number;
}

export interface AlojamientoResumen {
  id: string;
  titulo: string;
  ciudad: string;
  tipo: TipoAlojamiento;
  capacidad: number;
  precioNoche: number;
  calificacion: number | null;
  imagen: string | null;
  servicios: string[];
}

export interface PaginaAlojamientos {
  contenido: AlojamientoResumen[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export const TAMANO_PAGINA = 20;

export const TIPOS: { valor: TipoAlojamiento; texto: string }[] = [
  { valor: 'CASA', texto: 'Casa' },
  { valor: 'APARTAMENTO', texto: 'Apartamento' },
  { valor: 'HABITACION', texto: 'Habitación' },
  { valor: 'CABANA', texto: 'Cabaña' },
];

export const SERVICIOS = ['WiFi', 'Cocina', 'Parqueadero', 'Piscina', 'Aire acondicionado', 'Mascotas'];

@Injectable({ providedIn: 'root' })
export class AlojamientosService {
  private http = inject(HttpClient);

  buscar(f: FiltrosBusqueda): Observable<PaginaAlojamientos> {
    let p = new HttpParams()
      .set('pagina', f.pagina ?? 0)
      .set('tamano', TAMANO_PAGINA)
      .set('orden', 'relevancia');
    if (f.ciudad) p = p.set('ciudad', f.ciudad);
    if (f.llegada) p = p.set('llegada', f.llegada);
    if (f.salida) p = p.set('salida', f.salida);
    if (f.huespedes) p = p.set('huespedes', f.huespedes);
    if (f.tipo) p = p.set('tipo', f.tipo);
    if (f.precioMin != null) p = p.set('precioMin', f.precioMin);
    if (f.precioMax != null) p = p.set('precioMax', f.precioMax);
    if (f.servicios?.length) p = p.set('servicios', f.servicios.join(','));
    return this.http.get<PaginaAlojamientos>('/api/alojamientos', { params: p });
  }
}
