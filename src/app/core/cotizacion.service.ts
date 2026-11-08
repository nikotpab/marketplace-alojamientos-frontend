import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface LineaCotizacion {
  concepto: string;
  monto: number;
}

export interface ServicioAdicional {
  id: string;
  nombre: string;
  precio: number;
}

/** Desglose calculado por el backend con los porcentajes vigentes de la configuración. */
export interface Cotizacion {
  noches: number;
  precioNoche: number;
  subtotal: number;
  tarifaLimpieza: number;
  porcentajeServicio: number;
  tarifaServicio: number;
  descuentos: LineaCotizacion[];
  adicionales: LineaCotizacion[];
  total: number;
  moneda: 'COP';
  /** Servicios adicionales que el huésped puede agregar. */
  adicionalesDisponibles: ServicioAdicional[];
}

export interface SolicitudCotizacion {
  publicacionId: string;
  llegada: string;
  salida: string;
  huespedes: number;
  adicionales: string[];
}

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private http = inject(HttpClient);

  cotizar(s: SolicitudCotizacion): Observable<Cotizacion> {
    return this.http.post<Cotizacion>('/api/cotizaciones', s);
  }
}
