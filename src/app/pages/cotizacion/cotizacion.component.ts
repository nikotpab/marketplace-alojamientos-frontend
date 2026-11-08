import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cotizacion, CotizacionService } from '../../core/cotizacion.service';
import { AlojamientoDetalle, DetalleService } from '../../core/detalle.service';

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './cotizacion.component.html',
  styleUrl: './cotizacion.component.scss',
})
export class CotizacionComponent {
  private ruta = inject(ActivatedRoute);
  private api = inject(CotizacionService);

  id = this.ruta.snapshot.paramMap.get('id') ?? '';
  llegada = this.ruta.snapshot.queryParamMap.get('llegada') ?? '';
  salida = this.ruta.snapshot.queryParamMap.get('salida') ?? '';

  alojamiento = signal<AlojamientoDetalle | null>(null);
  cotizacion = signal<Cotizacion | null>(null);
  huespedes = 1;
  adicionales = signal<string[]>([]);
  cargando = signal(false);
  error = signal('');

  fechasValidas = !!this.llegada && !!this.salida && this.salida > this.llegada;
  capacidad = computed(() => this.alojamiento()?.capacidad ?? 1);

  constructor() {
    inject(DetalleService).obtener(this.id).subscribe({
      next: (a) => this.alojamiento.set(a),
      error: () => this.error.set('No pudimos cargar el alojamiento.'),
    });
    if (this.fechasValidas) this.cotizar();
  }

  alternarAdicional(id: string) {
    this.adicionales.update((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
    this.cotizar();
  }

  cambiarHuespedes(n: number) {
    this.huespedes = Math.min(Math.max(1, n), this.capacidad());
    this.cotizar();
  }

  /** Cada cambio pide una cotización nueva: los porcentajes salen de la configuración del backend. */
  cotizar() {
    this.cargando.set(true);
    this.error.set('');
    this.api
      .cotizar({ publicacionId: this.id, llegada: this.llegada, salida: this.salida, huespedes: this.huespedes, adicionales: this.adicionales() })
      .subscribe({
        next: (c) => {
          this.cotizacion.set(c);
          this.cargando.set(false);
        },
        error: (e) => {
          this.cargando.set(false);
          this.error.set(
            e.status === 409
              ? 'Las fechas elegidas ya no están disponibles. Vuelve al calendario y elige otras.'
              : 'No pudimos calcular la cotización. Intenta de nuevo.',
          );
        },
      });
  }
}
