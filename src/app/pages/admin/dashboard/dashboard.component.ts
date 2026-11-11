import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Indicadores, IndicadoresService } from '../../../core/indicadores.service';
import { ESTADO_RESERVA_TEXTO, EstadoReserva } from '../../../core/reservas.service';

type Periodo = '7' | '30' | '90' | 'anio' | 'personalizado';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private api = inject(IndicadoresService);

  periodos: { valor: Periodo; texto: string }[] = [
    { valor: '7', texto: 'Últimos 7 días' },
    { valor: '30', texto: 'Últimos 30 días' },
    { valor: '90', texto: 'Últimos 90 días' },
    { valor: 'anio', texto: 'Este año' },
    { valor: 'personalizado', texto: 'Personalizado' },
  ];
  periodo = signal<Periodo>('30');
  desde = haceDias(30);
  hasta = hoyISO();

  datos = signal<Indicadores | null>(null);
  cargando = signal(false);
  error = signal('');

  readonly estados = Object.keys(ESTADO_RESERVA_TEXTO) as EstadoReserva[];
  estadoTexto = ESTADO_RESERVA_TEXTO;

  totalReservas = computed(() =>
    Object.values(this.datos()?.reservasPorEstado ?? {}).reduce((a, b) => a + (b ?? 0), 0),
  );

  constructor() {
    this.consultar();
  }

  elegir(p: Periodo) {
    this.periodo.set(p);
    if (p === 'personalizado') return;
    this.hasta = hoyISO();
    this.desde = p === 'anio' ? `${new Date().getFullYear()}-01-01` : haceDias(+p);
    this.consultar();
  }

  get rangoInvalido() {
    return !this.desde || !this.hasta || this.hasta < this.desde;
  }

  consultar() {
    if (this.rangoInvalido) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.consultar(this.desde, this.hasta).subscribe({
      next: (d) => {
        this.datos.set(d);
        this.cargando.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        this.error.set(
          e?.name === 'TimeoutError'
            ? 'Los indicadores tardaron demasiado en cargar. El resto de la plataforma funciona con normalidad; intenta de nuevo.'
            : 'No pudimos cargar los indicadores. El resto de la plataforma funciona con normalidad.',
        );
      },
    });
  }

  porcentaje(n: number, total: number) {
    return total ? Math.round((n / total) * 100) : 0;
  }
}
