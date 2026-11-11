import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CAMPOS_TARIFA, CambioTarifas, ConfiguracionService, Tarifas } from '../../../core/configuracion.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

const rango = (min: number, max: number): ValidatorFn[] => [Validators.required, Validators.min(min), Validators.max(max)];

interface Diferencia {
  texto: string;
  anterior: number;
  nuevo: number;
  unidad: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, DialogoComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {
  private api = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  campos = CAMPOS_TARIFA;
  actual = signal<Tarifas | null>(null);
  historial = signal<CambioTarifas[]>([]);
  /** Quién modificó por última vez y cuándo: el cambio más reciente de la auditoría. */
  ultimo = computed(() => this.historial()[0] ?? null);
  error = signal('');
  aviso = signal('');
  guardando = signal(false);
  diferencias = signal<Diferencia[] | null>(null);

  form = this.fb.nonNullable.group({
    porcentajeServicio: [0, rango(0, 100)],
    porcentajeLimpieza: [0, rango(0, 100)],
    porcentajeDescuento: [0, rango(0, 100)],
    porcentajeDescuentoEstanciaLarga: [0, rango(0, 100)],
    nochesEstanciaLarga: [1, rango(1, 365)],
  });

  constructor() {
    this.cargar();
  }

  cargar() {
    this.api.tarifas().subscribe({
      next: (t) => {
        // LIMPIEZA puede llegar en null hasta que se configure (pendiente 5 del backend)
        const limpio = { ...t, porcentajeLimpieza: t.porcentajeLimpieza ?? 0 };
        this.actual.set(limpio);
        this.form.reset(limpio);
      },
      error: () => this.error.set('No pudimos cargar la configuración. Intenta de nuevo.'),
    });
    this.cargarHistorial();
  }

  private cargarHistorial() {
    this.api.historial().subscribe({ next: (h) => this.historial.set(h), error: () => this.historial.set([]) });
  }

  textoCambios(c: Record<string, unknown>) {
    return Object.entries(c).map(([k, v]) => `${k}: ${v}`);
  }

  invalido(campo: keyof Tarifas) {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Antes de guardar se muestra el resumen "valor anterior → valor nuevo". */
  revisar() {
    this.form.markAllAsTouched();
    const a = this.actual();
    if (this.form.invalid || !a) return;
    const v: Tarifas = this.form.getRawValue();
    const d = CAMPOS_TARIFA.filter((c) => Number(v[c.campo]) !== Number(a[c.campo])).map((c) => ({
      texto: c.texto,
      anterior: a[c.campo],
      nuevo: Number(v[c.campo]),
      unidad: c.unidad,
    }));
    if (!d.length) {
      this.aviso.set('No hay cambios para guardar.');
      return;
    }
    this.aviso.set('');
    this.diferencias.set(d);
  }

  guardar() {
    this.guardando.set(true);
    const v: Tarifas = this.form.getRawValue();
    const t: Tarifas = {
      porcentajeServicio: Number(v.porcentajeServicio),
      porcentajeLimpieza: Number(v.porcentajeLimpieza),
      porcentajeDescuento: Number(v.porcentajeDescuento),
      porcentajeDescuentoEstanciaLarga: Number(v.porcentajeDescuentoEstanciaLarga),
      nochesEstanciaLarga: Number(v.nochesEstanciaLarga),
    };
    this.api.actualizarTarifas(t).subscribe({
      next: () => {
        this.guardando.set(false);
        this.diferencias.set(null);
        this.actual.set(t);
        this.form.reset(t);
        this.aviso.set('Configuración guardada. Se aplica a las cotizaciones nuevas.');
        this.cargarHistorial();
      },
      error: () => {
        this.guardando.set(false);
        this.diferencias.set(null);
        this.error.set('No pudimos guardar la configuración. Los valores anteriores siguen vigentes.');
      },
    });
  }

  descartar() {
    const a = this.actual();
    if (a) this.form.reset(a);
    this.aviso.set('');
  }
}
