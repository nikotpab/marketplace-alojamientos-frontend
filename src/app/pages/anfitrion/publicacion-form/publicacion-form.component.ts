import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { switchMap, tap } from 'rxjs';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SERVICIOS } from '../../../core/alojamientos.service';
import { AuthService } from '../../../core/auth.service';
import { DatosPublicacion, ESTADO_TEXTO, Publicacion, PublicacionesService, TipoConfigurado } from '../../../core/publicaciones.service';
import { SoloNumerosDirective } from '../../../shared/solo-numeros.directive';

/** Vacío es válido (borrador); si hay valor, debe ser mayor que 0. */
function mayorQueCero(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === '' || v === null) return null;
  return Number(v) > 0 ? null : { noPositivo: true };
}

type CampoActivacion =
  | 'titulo' | 'descripcion' | 'ubicacion' | 'ciudad' | 'tipo'
  | 'capacidad' | 'precioNoche' | 'imagenes' | 'politicaCancelacion';

/** Información mínima para pedir la activación. */
function validarActivacion(d: DatosPublicacion): Partial<Record<CampoActivacion, string>> {
  const e: Partial<Record<CampoActivacion, string>> = {};
  if (!d.titulo) e.titulo = 'Agrega un título para la publicación.';
  if (!d.descripcion) e.descripcion = 'Agrega una descripción del alojamiento.';
  if (!d.ubicacion) e.ubicacion = 'Indica la ubicación del alojamiento.';
  if (!d.ciudad) e.ciudad = 'Indica la ciudad del alojamiento.';
  if (!d.tipo) e.tipo = 'Selecciona el tipo de alojamiento.';
  if (!d.capacidad || d.capacidad <= 0) e.capacidad = 'Indica una capacidad mayor que 0 (mínimo 1 huésped).';
  if (!d.precioNoche || d.precioNoche <= 0) e.precioNoche = 'Indica un precio por noche mayor que 0.';
  if (!d.imagenes.length) e.imagenes = 'Agrega al menos una referencia de imagen (URL).';
  if (!d.politicaCancelacion) e.politicaCancelacion = 'Elige la política de cancelación.';
  return e;
}

const lineas = (texto: string) =>
  texto.split('\n').map((l) => l.trim()).filter(Boolean);

@Component({
  selector: 'app-publicacion-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, SoloNumerosDirective],
  templateUrl: './publicacion-form.component.html',
  styleUrl: './publicacion-form.component.scss',
})
export class PublicacionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PublicacionesService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  /** Si la ruta trae :id, el formulario está en modo edición. */
  id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  estados = ESTADO_TEXTO;
  publicacion = signal<Publicacion | null>(null);
  cargando = signal(false);
  errorCarga = signal('');
  erroresActivacion = signal<Partial<Record<CampoActivacion, string>>>({});
  totalErrores = computed(() => Object.keys(this.erroresActivacion()).length);
  exito = signal('');

  /**
   * Se pide la activación al crear la publicación o desde BORRADOR (incluye las rechazadas, que vuelven a borrador).
   * Solo así llega a revisión y, cuando un administrador la aprueba, aparece en Explorar.
   */
  puedeSolicitar = computed(() => {
    const estado = this.publicacion()?.estado;
    return !this.id || estado === 'BORRADOR';
  });
  /** Si el anfitrión edita una publicación aprobada (activa o pausada), vuelve a revisión. */
  vuelveARevision = computed(() => {
    const estado = this.publicacion()?.estado;
    return (estado === 'ACTIVA' || estado === 'PAUSADA') && !this.auth.tieneRol(['ADMINISTRADOR']);
  });

  /** Servicios del catálogo del backend; la lista fija solo se usa si el catálogo no responde. */
  servicios = signal<string[]>(SERVICIOS);
  tipos = signal<TipoConfigurado[]>([]);
  errorTipos = signal('');
  /** Políticas de cancelación del backend; se envía su nombre. */
  politicas = signal<string[]>([]);
  seleccionados = signal<string[]>([]);
  guardando = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    ciudad: '',
    tipo: '',
    capacidad: ['', [mayorQueCero]],
    precioNoche: ['', [mayorQueCero]],
    reglas: '',
    imagenes: '',
    politicaCancelacion: '',
  });

  constructor() {
    this.api.tiposActivos().subscribe({
      next: (t) => this.tipos.set(t),
      error: () => this.errorTipos.set('No pudimos cargar los tipos de alojamiento. Recarga la página.'),
    });
    this.api.catalogos().subscribe({
      next: (c) => {
        this.politicas.set(c.politicas.map((p) => p.nombre));
        if (c.servicios.length) this.servicios.set(c.servicios.map((s) => s.nombre));
      },
      error: () => this.politicas.set([]),
    });
    if (this.id) this.cargar(this.id);
    // Si ya se mostraron errores de activación, se actualizan mientras el anfitrión corrige
    this.form.valueChanges.subscribe(() => {
      if (this.totalErrores()) this.erroresActivacion.set(validarActivacion(this.datos()));
    });
  }

  errorActivacion(campo: CampoActivacion) {
    return this.erroresActivacion()[campo] ?? '';
  }

  /** Guarda la publicación (o la crea, si es nueva) y pide su activación. */
  solicitarActivacion() {
    this.exito.set('');
    this.error.set('');
    const datos = this.datos();
    const errores = validarActivacion(datos);
    this.erroresActivacion.set(errores);
    if (Object.keys(errores).length) return;

    const nueva = !this.id;
    this.guardando.set(true);
    (this.id ? this.api.actualizar(this.id, datos) : this.api.crear(datos))
      .pipe(
        // Desde aquí el formulario edita la publicación guardada: si la solicitud falla, reintentar no la duplica
        tap((p) => {
          this.id = p.id;
          this.publicacion.set(p);
        }),
        switchMap((p) => this.api.solicitarActivacion(p.id)),
      )
      .subscribe({
        next: (p) => {
          if (nueva) {
            void this.router.navigate(['/anfitrion'], { queryParams: { guardada: 'solicitada' } });
            return;
          }
          this.publicacion.set(p);
          this.exito.set('Solicitud enviada. Un administrador revisará tu publicación antes de que aparezca en búsquedas.');
          this.guardando.set(false);
        },
        error: (e) => {
          this.guardando.set(false);
          if (e.status === 403) return;
          if (this.mostrarErroresDeCampos(e)) return;
          this.error.set('No pudimos enviar la solicitud. Intenta de nuevo.');
        },
      });
  }

  private cargar(id: string) {
    this.cargando.set(true);
    this.api.obtener(id).subscribe({
      next: (p) => {
        this.publicacion.set(p);
        this.form.patchValue({
          titulo: p.titulo ?? '',
          descripcion: p.descripcion ?? '',
          ubicacion: p.ubicacion ?? '',
          ciudad: p.ciudad ?? '',
          tipo: p.tipo ?? '',
          capacidad: p.capacidad != null ? String(p.capacidad) : '',
          precioNoche: p.precioNoche != null ? String(p.precioNoche) : '',
          reglas: (p.reglas ?? []).join('\n'),
          imagenes: (p.imagenes ?? []).join('\n'),
          politicaCancelacion: p.politicaCancelacion ?? '',
        });
        this.seleccionados.set(p.servicios ?? []);
        this.cargando.set(false);
      },
      // 403 (no es el propietario ni administrador) lo redirige el interceptor a /acceso-denegado
      error: (e) => {
        this.errorCarga.set(
          e.status === 404 ? 'La publicación no existe.' : 'No pudimos cargar la publicación. Intenta de nuevo.',
        );
        this.cargando.set(false);
      },
    });
  }

  invalido(campo: 'capacidad' | 'precioNoche') {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  alternarServicio(s: string) {
    this.seleccionados.update((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]));
  }

  private datos(): DatosPublicacion {
    const v = this.form.getRawValue();
    return {
      titulo: v.titulo.trim(),
      descripcion: v.descripcion.trim(),
      ubicacion: v.ubicacion.trim(),
      ciudad: v.ciudad.trim(),
      tipo: v.tipo,
      capacidad: v.capacidad === '' ? null : Number(v.capacidad),
      precioNoche: v.precioNoche === '' ? null : Number(v.precioNoche),
      servicios: this.seleccionados(),
      reglas: lineas(v.reglas),
      imagenes: lineas(v.imagenes),
      politicaCancelacion: v.politicaCancelacion.trim(),
    };
  }

  /** 400 (dato inválido) o 422 (falta información para publicar): el mensaje del backend va junto a cada campo. */
  private mostrarErroresDeCampos(e: { status: number; error?: { errores?: Partial<Record<CampoActivacion, string>> } }): boolean {
    if ((e.status !== 400 && e.status !== 422) || !e.error?.errores) return false;
    this.erroresActivacion.set(e.error.errores);
    this.error.set('Revisa los campos indicados.');
    return true;
  }

  /** Qué le dice Mis publicaciones al anfitrión después de guardar. */
  private resultadoAlGuardar(p: Publicacion | null): string {
    if (p?.estado === 'PENDIENTE_REVISION' && this.vuelveARevision()) return 'revision';
    return p?.estado === 'BORRADOR' ? 'borrador' : 'guardada';
  }

  guardarBorrador() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.error.set('');
    const peticion = this.id ? this.api.actualizar(this.id, this.datos()) : this.api.crear(this.datos());
    peticion.subscribe({
      next: (p) => this.router.navigate(['/anfitrion'], { queryParams: { guardada: this.resultadoAlGuardar(p) } }),
      error: (e) => {
        this.guardando.set(false);
        if (e.status === 403) return; // el interceptor lleva a /acceso-denegado
        if (this.mostrarErroresDeCampos(e)) return;
        this.error.set('No pudimos guardar los cambios. Revisa tu conexión e intenta de nuevo.');
      },
    });
  }
}
