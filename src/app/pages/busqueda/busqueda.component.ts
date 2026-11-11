import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
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

  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  constructor() {
    this.tiposApi.cargarActivos();
    this.form.controls.llegada.valueChanges.subscribe(() =>
      this.form.controls.salida.updateValueAndValidity(),
    );
    // La URL es la fuente de los filtros: al cargar, con "atrás" o con un link compartido se repite la búsqueda
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) => {
      this.aplicarParametros(q);
      this.consultar(Number(q.get('pagina') ?? 0) || 0);
    });
  }

  alternarServicio(s: string) {
    this.seleccionados.update((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  }

  /** Guarda los filtros en la URL; la suscripción a los query params ejecuta la búsqueda. */
  buscar(pagina = 0) {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const params = this.parametros(pagina);
    if (this.mismaUrl(params)) {
      this.consultar(pagina);
      return;
    }
    this.router.navigate([], { relativeTo: this.ruta, queryParams: params });
  }

  limpiar() {
    this.form.reset();
    this.seleccionados.set([]);
    this.error.set('');
    this.router.navigate([], { relativeTo: this.ruta, queryParams: {} });
  }

  private filtros(pagina: number): FiltrosBusqueda {
    const v = this.form.getRawValue();
    return {
      ciudad: v.ciudad.trim(),
      llegada: v.llegada,
      salida: v.salida,
      huespedes: v.huespedes ?? undefined,
      tipo: v.tipo,
      precioMin: v.precioMin ?? undefined,
      precioMax: v.precioMax ?? undefined,
      servicios: this.seleccionados(),
      pagina,
    };
  }

  /** Solo los filtros con valor, para que la URL quede corta y legible. */
  private parametros(pagina: number): Params {
    const f = this.filtros(pagina);
    const p: Params = {};
    if (f.ciudad) p['ciudad'] = f.ciudad;
    if (f.llegada) p['llegada'] = f.llegada;
    if (f.salida) p['salida'] = f.salida;
    if (f.huespedes) p['huespedes'] = f.huespedes;
    if (f.tipo) p['tipo'] = f.tipo;
    if (f.precioMin != null) p['precioMin'] = f.precioMin;
    if (f.precioMax != null) p['precioMax'] = f.precioMax;
    if (f.servicios?.length) p['servicios'] = f.servicios.join(',');
    if (pagina) p['pagina'] = pagina;
    return p;
  }

  private mismaUrl(p: Params) {
    const actual = this.ruta.snapshot.queryParams;
    const claves = new Set([...Object.keys(actual), ...Object.keys(p)]);
    return [...claves].every((k) => String(actual[k] ?? '') === String(p[k] ?? ''));
  }

  private aplicarParametros(q: ParamMap) {
    const num = (k: string) => (q.get(k) ? Number(q.get(k)) : null);
    this.form.reset({
      ciudad: q.get('ciudad') ?? '',
      llegada: q.get('llegada') ?? '',
      salida: q.get('salida') ?? '',
      huespedes: num('huespedes'),
      tipo: q.get('tipo') ?? '',
      precioMin: num('precioMin'),
      precioMax: num('precioMax'),
    });
    this.seleccionados.set(q.get('servicios')?.split(',').filter(Boolean) ?? []);
  }

  /** Ejecuta la búsqueda con los filtros del formulario (ya sincronizados con la URL). */
  private consultar(pagina: number) {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.api.buscar(this.filtros(pagina)).subscribe({
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
}
