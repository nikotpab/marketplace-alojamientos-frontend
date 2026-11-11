import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SoloNumerosDirective } from '../../shared/solo-numeros.directive';
import { AuthService, Rol, RolUsuario } from '../../core/auth.service';

const INICIO_POR_ROL: Record<RolUsuario, string> = {
  HUESPED: '/buscar',
  ANFITRION: '/anfitrion',
  ADMINISTRADOR: '/admin',
};

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, SoloNumerosDirective],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {
  pestana = signal<'login' | 'registro'>('login');
  rol = signal<Rol>('HUESPED');
  enviado = signal(false);
  cargando = signal(false);
  correoDuplicado = signal(false);
  errorGeneral = signal('');
  exito = signal(false);

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  cargandoLogin = signal(false);
  errorLogin = signal('');
  loginEnviado = signal(false);

  registro = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.pattern(/^[0-9]{7,15}$/)]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  login = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
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
    this.router.navigateByUrl('/recuperar');
  }

  cambiarPestana(p: 'login' | 'registro') {
    this.pestana.set(p);
    this.errorLogin.set('');
    this.errorGeneral.set('');
    this.exito.set(false);
  }

  /** true cuando el inicio de sesión falló por correo sin verificar (403 CORREO_NO_VERIFICADO). */
  sinVerificar = signal(false);
  reenviado = signal(false);

  reenviarVerificacion() {
    this.auth.reenviarVerificacion(this.login.getRawValue().correo).subscribe({
      next: () => this.reenviado.set(true),
      error: () => this.reenviado.set(true),
    });
  }

  iniciarSesion() {
    this.loginEnviado.set(true);
    this.errorLogin.set('');
    this.sinVerificar.set(false);
    this.reenviado.set(false);
    if (this.login.invalid) return;

    this.cargandoLogin.set(true);
    this.auth.login(this.login.getRawValue()).subscribe({
      next: (s) => {
        this.cargandoLogin.set(false);
        this.router.navigateByUrl(INICIO_POR_ROL[s.usuario.rol]);
      },
      error: (e) => {
        this.cargandoLogin.set(false);
        const codigo = e.error?.codigo;
        this.sinVerificar.set(codigo === 'CORREO_NO_VERIFICADO');
        if (e.status === 423 || e.status === 429 || codigo === 'CUENTA_BLOQUEADA')
          this.errorLogin.set('Cuenta bloqueada por 30 minutos por intentos fallidos.');
        else if (codigo === 'CORREO_NO_VERIFICADO')
          this.errorLogin.set('Aún no verificas tu correo. Abre el enlace que te enviamos al registrarte.');
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

  registrar() {
    this.enviado.set(true);
    this.correoDuplicado.set(false);
    this.errorGeneral.set('');
    if (this.registro.invalid) return;

    this.cargando.set(true);
    this.auth.registrar({ ...this.registro.getRawValue(), rol: this.rol() }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        this.registro.reset();
        this.enviado.set(false);
      },
      error: (e) => {
        this.cargando.set(false);
        if (e.status === 409) this.correoDuplicado.set(true);
        else this.errorGeneral.set('No se pudo completar el registro. Intenta de nuevo.');
      },
    });
  }
}
