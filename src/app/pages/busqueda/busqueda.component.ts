import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AlojamientoResumen,
  AlojamientosService,
  FiltrosBusqueda,
  SERVICIOS,
} from '../../core/alojamientos.service';
import { TiposAlojamientoService } from '../../core/tipos-alojamiento.service';

function salidaPosterior(control: AbstractControl): ValidationErrors | null {
  const llegada = control.parent?.get('llegada')?.value;
  const salida = control.value;
  if (llegada && salida && salida <= llegada) return { salidaInvalida: true };
  return null;
}

@Component({
  selector: 'app-busqueda',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './busqueda.component.html',
  styleUrl: './busqueda.component.scss',
})
export class BusquedaComponent {
  private fb = inject(FormBuilder);
  private api = inject(AlojamientosService);

  tiposApi = inject(TiposAlojamientoService);
  servicios = SERVICIOS;

  form = this.fb.nonNullable.group({
    ciudad: '',
    llegada: '',
    salida: ['', [salidaPosterior]],
    huespedes: this.fb.control<number | null>(null),
    tipo: '',
    precioMin: this.fb.control<number | null>(null),
    precioMax: this.fb.control<number | null>(null),
  });
  seleccionados = signal<string[]>([]);

  cargando = signal(false);
  buscado = signal(false);
  error = signal('');
  resultados = signal<AlojamientoResumen[]>([]);
  total = signal(0);
  pagina = signal(0);
  totalPaginas = signal(0);

  constructor() {
    this.tiposApi.cargarActivos();
    this.form.controls.llegada.valueChanges.subscribe(() =>
      this.form.controls.salida.updateValueAndValidity(),
    );
  }

  alternarServicio(s: string) {
    this.seleccionados.update((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  }

  buscar(pagina = 0) {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const filtros: FiltrosBusqueda = {
      ciudad: v.ciudad.trim(),
      llegada: v.llegada,
      salida: v.salida,
      huespedes: v.huespedes ?? undefined,
      tipo: v.tipo as FiltrosBusqueda['tipo'],
      precioMin: v.precioMin ?? undefined,
      precioMax: v.precioMax ?? undefined,
      servicios: this.seleccionados(),
      pagina,
    };
    this.cargando.set(true);
    this.error.set('');
    this.api.buscar(filtros).subscribe({
      next: (r) => {
        this.resultados.set(r.contenido);
        this.total.set(r.total);
        this.pagina.set(r.pagina);
        this.totalPaginas.set(r.totalPaginas);
        this.buscado.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos obtener los alojamientos. Intenta de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  limpiar() {
    this.form.reset();
    this.seleccionados.set([]);
    this.resultados.set([]);
    this.buscado.set(false);
    this.error.set('');
  }
}
