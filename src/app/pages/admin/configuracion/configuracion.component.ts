import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import {
  CAMPOS_TARIFA,
  CambioConfiguracion,
  ConfiguracionService,
  ConfiguracionTarifas,
  Tarifas,
} from '../../../core/configuracion.service';
import { DialogoComponent } from '../../../shared/dialogo/dialogo.component';

const rango = (max: number): ValidatorFn[] => [Validators.required, Validators.min(0), Validators.max(max)];

interface Diferencia {
  texto: string;
  anterior: number;
  nuevo: number;
  unidad: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, DialogoComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {
  private api = inject(ConfiguracionService);
  private fb = inject(FormBuilder);

  campos = CAMPOS_TARIFA;
  actual = signal<ConfiguracionTarifas | null>(null);
  historial = signal<CambioConfiguracion[]>([]);
  error = signal('');
  aviso = signal('');
  guardando = signal(false);
  diferencias = signal<Diferencia[] | null>(null);

  form = this.fb.nonNullable.group({
    tarifaServicio: [0, rango(100)],
    tarifaLimpieza: [0, rango(100)],
    descuentoPromocional: [0, rango(100)],
    descuentoEstanciaLarga: [0, rango(100)],
    nochesEstanciaLarga: [0, rango(365)],
  });

  constructor() {
    this.cargar();
  }

  cargar() {
    this.api.tarifas().subscribe({
      next: (c) => {
        this.actual.set(c);
        this.form.reset(this.soloTarifas(c));
      },
      error: () => this.error.set('No pudimos cargar la configuración. Intenta de nuevo.'),
    });
    this.api.historial().subscribe({ next: (h) => this.historial.set(h), error: () => this.historial.set([]) });
  }

  textoCampo(campo: keyof Tarifas) {
    return CAMPOS_TARIFA.find((c) => c.campo === campo)?.texto ?? campo;
  }

  unidad(campo: keyof Tarifas) {
    return CAMPOS_TARIFA.find((c) => c.campo === campo)?.unidad ?? '';
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
    const d = CAMPOS_TARIFA.filter((c) => Number(v[c.campo]) !== a[c.campo]).map((c) => ({
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
    const t = Object.fromEntries(CAMPOS_TARIFA.map((c) => [c.campo, Number(v[c.campo])])) as unknown as Tarifas;
    this.api.actualizarTarifas(t).subscribe({
      next: (c) => {
        this.guardando.set(false);
        this.diferencias.set(null);
        this.actual.set(c);
        this.form.reset(this.soloTarifas(c));
        this.aviso.set('Configuración guardada. Se aplicará a las cotizaciones nuevas en máximo 1 minuto.');
        this.api.historial().subscribe({ next: (h) => this.historial.set(h) });
      },
      error: () => {
        this.guardando.set(false);
        this.diferencias.set(null);
        this.error.set('No pudimos guardar la configuración. Los valores anteriores siguen vigentes.');
      },
    });
  }

  private soloTarifas(c: ConfiguracionTarifas): Tarifas {
    return Object.fromEntries(CAMPOS_TARIFA.map((x) => [x.campo, c[x.campo]])) as unknown as Tarifas;
  }
}
