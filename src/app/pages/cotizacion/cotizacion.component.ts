import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cotizacion, CotizacionService } from '../../core/cotizacion.service';
import { AlojamientoDetalle, DetalleService } from '../../core/detalle.service';
import { Reserva, ReservasService } from '../../core/reservas.service';
import { PagoFormComponent } from './pago/pago-form.component';

@Component({
  selector: 'app-cotizacion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, PagoFormComponent],
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

  private reservas = inject(ReservasService);
  confirmando = signal(false);
  pagando = signal(false);
  errorReserva = signal('');
  reserva = signal<Reserva | null>(null);

  /**
   * Clave única por intento de confirmación (RF-19). Se reutiliza si hay que reintentar
   * por un error de red y se renueva cuando cambian los datos de la reserva.
   */
  private claveIntento: string | null = null;

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
    this.claveIntento = null; // datos distintos = intento distinto
    this.pagando.set(false);
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

  /** Plazo máximo de respuesta de la pasarela (RF-21): pasado este tiempo no se confirma nada. */
  private static readonly PLAZO_PAGO_MS = 7000;

  confirmar(metodoPagoId: string) {
    if (this.confirmando() || !this.cotizacion()) return;
    this.confirmando.set(true);
    this.errorReserva.set('');
    this.claveIntento ??= crypto.randomUUID();
    this.reservas
      .confirmar(
        { publicacionId: this.id, llegada: this.llegada, salida: this.salida, huespedes: this.huespedes, adicionales: this.adicionales() },
        this.claveIntento,
        metodoPagoId,
      )
      .pipe(timeout(CotizacionComponent.PLAZO_PAGO_MS))
      .subscribe({
        next: (r) => {
          this.reserva.set(r);
          this.confirmando.set(false);
        },
        error: (e) => {
          this.confirmando.set(false);
          // Rechazos definitivos: un nuevo intento debe llevar otra clave.
          // Timeout, 503 o error de red conservan la clave: reintentar no duplica el cobro.
          if (e.status === 409 || e.status === 402) this.claveIntento = null;
          if (e instanceof TimeoutError) {
            this.errorReserva.set('El pago no se procesó. No se confirmó la reserva ni se bloquearon las fechas. Intenta de nuevo.');
          } else if (e.status === 402) {
            this.errorReserva.set('El pago fue rechazado. Revisa los datos o prueba con otra tarjeta.');
          } else if (e.status === 409) {
            this.errorReserva.set('Periodo no disponible: otra persona acaba de reservar estas fechas. Elige otras en el calendario.');
          } else if (e.status === 503) {
            this.errorReserva.set('El servicio de pagos no está disponible por ahora. El pago no se procesó; intenta de nuevo en unos minutos.');
          } else {
            this.errorReserva.set('El pago no se procesó. No se creó ninguna reserva ni se hizo ningún cobro duplicado. Intenta de nuevo.');
          }
        },
      });
  }
}
