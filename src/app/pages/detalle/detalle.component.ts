import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlojamientoDetalle, DetalleService } from '../../core/detalle.service';

interface Dia {
  numero: number;
  iso: string;
  ocupado: boolean;
  pasado: boolean;
}

const NOMBRES_TIPO: Record<string, string> = {
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  HABITACION: 'Habitación',
  CABANA: 'Cabaña',
};

@Component({
  selector: 'app-detalle',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.scss',
})
export class DetalleComponent {
  private ruta = inject(ActivatedRoute);
  private api = inject(DetalleService);

  alojamiento = signal<AlojamientoDetalle | null>(null);
  cargando = signal(true);
  error = signal('');
  imagenActiva = signal(0);
  mesActual = signal(this.inicioDeMes(new Date()));

  tipoTexto = computed(() => NOMBRES_TIPO[this.alojamiento()?.tipo ?? ''] ?? '');

  private hoy = this.aIso(new Date());
  private mesInicial = this.inicioDeMes(new Date());

  tituloMes = computed(() => {
    const t = this.mesActual().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  });

  enMesInicial = computed(() => this.mesActual().getTime() <= this.mesInicial.getTime());

  dias = computed<(Dia | null)[]>(() => {
    const base = this.mesActual();
    const ocupadas = new Set(this.alojamiento()?.fechasNoDisponibles ?? []);
    const total = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const huecos = (base.getDay() + 6) % 7; // semana inicia en lunes
    const lista: (Dia | null)[] = Array(huecos).fill(null);
    for (let d = 1; d <= total; d++) {
      const iso = this.aIso(new Date(base.getFullYear(), base.getMonth(), d));
      lista.push({ numero: d, iso, ocupado: ocupadas.has(iso), pasado: iso < this.hoy });
    }
    return lista;
  });

  constructor() {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.api.obtener(id).subscribe({
      next: (a) => {
        this.alojamiento.set(a);
        this.cargando.set(false);
      },
      error: (e) => {
        this.error.set(
          e.status === 404
            ? 'Este alojamiento no existe o ya no está disponible.'
            : 'No pudimos cargar el alojamiento. Intenta de nuevo.',
        );
        this.cargando.set(false);
      },
    });
  }

  cambiarMes(delta: number) {
    if (delta < 0 && this.enMesInicial()) return;
    const m = this.mesActual();
    this.mesActual.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  private inicioDeMes(f: Date) {
    return new Date(f.getFullYear(), f.getMonth(), 1);
  }

  private aIso(f: Date) {
    const mm = String(f.getMonth() + 1).padStart(2, '0');
    const dd = String(f.getDate()).padStart(2, '0');
    return `${f.getFullYear()}-${mm}-${dd}`;
  }
}
