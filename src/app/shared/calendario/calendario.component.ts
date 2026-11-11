import { ChangeDetectionStrategy, Component, OnInit, computed, input, output, signal } from '@angular/core';

export interface RangoFechas {
  desde: string;
  hasta: string;
}

interface Dia {
  numero: number;
  iso: string;
  pasado: boolean;
  bloqueado: boolean;
  reservado: boolean;
}

interface Mes {
  titulo: string;
  dias: (Dia | null)[];
}

export const aIso = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

/** Calendario de disponibilidad reutilizable: muestra N meses, leyenda y selección de rango. */
@Component({
  selector: 'app-calendario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss',
})
export class CalendarioComponent implements OnInit {
  meses = input(2);
  bloqueados = input<string[]>([]);
  reservados = input<string[]>([]);
  /** Si permite elegir un rango (inicio y fin). */
  seleccionable = input(true);
  /** Si los días bloqueados se pueden incluir en la selección (el anfitrión sí; el huésped no). */
  permitirBloqueados = input(false);

  rango = output<RangoFechas | null>();
  mesVisible = output<RangoFechas>();

  private hoy = aIso(new Date());
  private mesInicial = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  inicioVista = signal(this.mesInicial);
  desde = signal<string | null>(null);
  hasta = signal<string | null>(null);

  enPrimerMes = computed(() => this.inicioVista().getTime() <= this.mesInicial.getTime());

  calendario = computed<Mes[]>(() => {
    const bloq = new Set(this.bloqueados());
    const res = new Set(this.reservados());
    const base = this.inicioVista();
    return Array.from({ length: this.meses() }, (_, i) => {
      const m = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const total = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
      const dias: (Dia | null)[] = Array((m.getDay() + 6) % 7).fill(null);
      for (let d = 1; d <= total; d++) {
        const iso = aIso(new Date(m.getFullYear(), m.getMonth(), d));
        dias.push({ numero: d, iso, pasado: iso < this.hoy, bloqueado: bloq.has(iso), reservado: res.has(iso) });
      }
      const t = m.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      return { titulo: t.charAt(0).toUpperCase() + t.slice(1), dias };
    });
  });

  ngOnInit() {
    this.emitirVista();
  }

  cambiarMes(delta: number) {
    if (delta < 0 && this.enPrimerMes()) return;
    const b = this.inicioVista();
    this.inicioVista.set(new Date(b.getFullYear(), b.getMonth() + delta, 1));
    this.emitirVista();
  }

  private emitirVista() {
    const b = this.inicioVista();
    const fin = new Date(b.getFullYear(), b.getMonth() + this.meses(), 0);
    this.mesVisible.emit({ desde: aIso(b), hasta: aIso(fin) });
  }

  noElegible(d: Dia) {
    return d.pasado || d.reservado || (d.bloqueado && !this.permitirBloqueados());
  }

  enRango(d: Dia) {
    const a = this.desde();
    const b = this.hasta() ?? a;
    return !!a && !!b && d.iso >= a && d.iso <= b;
  }

  elegir(d: Dia) {
    if (!this.seleccionable() || this.noElegible(d)) return;
    const a = this.desde();
    if (!a || this.hasta() || d.iso < a) {
      this.desde.set(d.iso);
      this.hasta.set(null);
      this.rango.emit({ desde: d.iso, hasta: d.iso });
    } else {
      this.hasta.set(d.iso);
      this.rango.emit({ desde: a, hasta: d.iso });
    }
  }

  limpiar() {
    this.desde.set(null);
    this.hasta.set(null);
    this.rango.emit(null);
  }
}
