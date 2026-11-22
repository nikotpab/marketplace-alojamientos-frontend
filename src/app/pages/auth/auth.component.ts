import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CampoContrasenaComponent } from '../../shared/campo-contrasena/campo-contrasena.component';
import { contrasenasCoinciden } from '../../shared/contrasenas-coinciden';
import { SoloNumerosDirective } from '../../shared/solo-numeros.directive';
import { MENSAJE_CORREO, MENSAJE_TELEFONO, validarCorreo, validarTelefono } from '../../shared/validadores-contacto';
import { AuthService, Rol, RolUsuario } from '../../core/auth.service';
import { VentanaCodigoComponent } from './ventana-codigo/ventana-codigo.component';

const INICIO_POR_ROL: Record<RolUsuario, string> = {
  HUESPED: '/buscar',
  ANFITRION: '/anfitrion',
  ADMINISTRADOR: '/admin',
};

@Component({
  selector: 'app-auth',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, ReactiveFormsModule, SoloNumerosDirective, VentanaCodigoComponent, CampoContrasenaComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  readonly mensajeCorreo = MENSAJE_CORREO;
  readonly mensajeTelefono = MENSAJE_TELEFONO;

  pestana = signal<'login' | 'registro'>('login');
  rol = signal<Rol>('HUESPED');
  enviado = signal(false);
  cargando = signal(false);
  correoDuplicado = signal(false);
  errorGeneral = signal('');

  /** Ventana del código que llega al correo antes de crear la cuenta. */
  ventanaCodigo = signal(false);
  creandoCuenta = signal(false);
  errorCodigo = signal('');
  avisoCodigo = signal('');
  /** Se muestra en "Iniciar sesión" si la cuenta se creó pero el inicio automático falló. */
  avisoLogin = signal('');

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  cargandoLogin = signal(false);
  errorLogin = signal('');
  loginEnviado = signal(false);

  /** La contraseña se escribe dos veces; la confirmación no se envía a la API. */
  registro = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', validarCorreo],
      telefono: ['', validarTelefono],
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: contrasenasCoinciden },
  );

  login = this.fb.nonNullable.group({
    correo: ['', validarCorreo],
    contrasena: ['', [Validators.required]],
  });

  invalidoLogin(campo: string) {
    const c = this.login.get(campo);
    return !!c && c.invalid && (c.touched || this.loginEnviado());
  }

  constructor() {
    if (this.route.snapshot.queryParamMap.get('cuenta') === 'desactivada') {
      this.errorLogin.set('Tu cuenta fue desactivada. No podrás iniciar sesión hasta reactivarla.');
    }
  }

  irARecuperar() {
    void this.router.navigateByUrl('/recuperar');
  }

  cambiarPestana(p: 'login' | 'registro') {
    this.pestana.set(p);
    this.errorLogin.set('');
    this.errorGeneral.set('');
    this.avisoLogin.set('');
  }

  /**
   * true cuando el inicio de sesión falló por correo sin verificar (403 CORREO_NO_VERIFICADO). Solo les pasa a cuentas
   * creadas antes del código: recuperar la contraseña también verifica el correo.
   */
  sinVerificar = signal(false);

  iniciarSesion() {
    this.loginEnviado.set(true);
    this.errorLogin.set('');
    this.sinVerificar.set(false);
    this.avisoLogin.set('');
    if (this.login.invalid) return;

    this.cargandoLogin.set(true);
    this.auth.login(this.login.getRawValue()).subscribe({
      next: (s) => {
        this.cargandoLogin.set(false);
        void this.router.navigateByUrl(INICIO_POR_ROL[s.usuario.rol]);
      },
      error: (e) => {
        this.cargandoLogin.set(false);
        const codigo = e.error?.codigo;
        this.sinVerificar.set(codigo === 'CORREO_NO_VERIFICADO');
        if (e.status === 423 || e.status === 429 || codigo === 'CUENTA_BLOQUEADA')
          this.errorLogin.set('Cuenta bloqueada por 30 minutos por intentos fallidos.');
        else if (codigo === 'CORREO_NO_VERIFICADO')
          this.errorLogin.set('Aún no verificas tu correo. Recupera tu contraseña: el enlace que te llegue también lo confirma.');
        else if (codigo === 'CUENTA_DESACTIVADA')
          this.errorLogin.set('Tu cuenta está desactivada. No puedes iniciar sesión hasta reactivarla.');
        else if (codigo === 'CUENTA_RESTRINGIDA' || e.status === 403)
          this.errorLogin.set(
            'Tu cuenta fue restringida por un administrador y no puede iniciar sesión.' +
              (e.error?.detail ? ` ${e.error.detail}` : ''),
          );
        else if (e.status === 401)
          this.errorLogin.set('Correo o contraseña incorrectos.');
        else this.errorLogin.set('No se pudo iniciar sesión. Intenta de nuevo.');
      },
    });
  }

  invalido(campo: string) {
    const c = this.registro.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado());
  }

  /** Vacía o distinta de la contraseña, una vez que se tocó o se intentó enviar. */
  confirmacionInvalida() {
    const c = this.registro.controls.confirmar;
    return (c.touched || this.enviado()) && (c.invalid || this.registro.hasError('noCoinciden'));
  }

  /** Paso 1: valida el formulario, pide el código al correo y abre la ventana. */
  registrar() {
    this.enviado.set(true);
    this.correoDuplicado.set(false);
    this.errorGeneral.set('');
    if (this.registro.invalid) return;

    this.cargando.set(true);
    this.auth.solicitarCodigoRegistro(this.registro.getRawValue().correo).subscribe({
      next: () => {
        this.cargando.set(false);
        this.errorCodigo.set('');
        this.avisoCodigo.set('');
        this.ventanaCodigo.set(true);
      },
      error: (e) => {
        this.cargando.set(false);
        if (e.status === 409) this.correoDuplicado.set(true);
        else this.errorGeneral.set('No pudimos enviarte el código. Revisa el correo e intenta de nuevo.');
      },
    });
  }

  /** Paso 2: crea la cuenta con el código y entra con el correo y la contraseña que se acaban de escribir. */
  confirmarCodigo(codigo: string) {
    const { nombre, apellido, correo, telefono, contrasena } = this.registro.getRawValue();
    const datos = { nombre, apellido, correo, telefono, contrasena, rol: this.rol(), codigo };
    this.creandoCuenta.set(true);
    this.errorCodigo.set('');
    this.avisoCodigo.set('');
    this.auth.registrar(datos).subscribe({
      next: () => this.entrar(datos.correo, datos.contrasena),
      error: (e) => {
        this.creandoCuenta.set(false);
        if (e.status === 409) {
          this.cerrarVentanaCodigo();
          this.correoDuplicado.set(true);
        } else {
          this.errorCodigo.set(e.error?.campos?.codigo ?? 'No se pudo crear la cuenta. Intenta de nuevo.');
        }
      },
    });
  }

  reenviarCodigo() {
    this.errorCodigo.set('');
    this.avisoCodigo.set('');
    this.auth.solicitarCodigoRegistro(this.registro.getRawValue().correo).subscribe({
      next: () => this.avisoCodigo.set('Te enviamos un código nuevo. El anterior ya no sirve.'),
      error: (e) => {
        if (e.status === 409) {
          this.cerrarVentanaCodigo();
          this.correoDuplicado.set(true);
        } else {
          this.errorCodigo.set('No pudimos enviar otro código. Intenta de nuevo en un momento.');
        }
      },
    });
  }

  /** "Cambiar correo": vuelve al formulario sin perder los datos, con el foco en el correo. */
  cerrarVentanaCodigo() {
    this.ventanaCodigo.set(false);
    this.errorCodigo.set('');
    this.avisoCodigo.set('');
    setTimeout(() => this.el.nativeElement.querySelector<HTMLInputElement>('input[formcontrolname="correo"]')?.focus());
  }

  private entrar(correo: string, contrasena: string) {
    this.auth.login({ correo, contrasena }).subscribe({
      next: (s) => {
        this.terminarRegistro();
        void this.router.navigateByUrl(INICIO_POR_ROL[s.usuario.rol]);
      },
      error: () => {
        this.terminarRegistro();
        this.cambiarPestana('login');
        this.login.patchValue({ correo });
        this.avisoLogin.set('Tu cuenta quedó creada. Inicia sesión para continuar.');
      },
    });
  }

  /** La contraseña solo vive en el formulario: se borra al terminar. */
  private terminarRegistro() {
    this.creandoCuenta.set(false);
    this.ventanaCodigo.set(false);
    this.registro.reset();
    this.enviado.set(false);
  }
}
