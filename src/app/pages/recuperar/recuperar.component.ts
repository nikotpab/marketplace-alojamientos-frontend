import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function coinciden(g: AbstractControl) {
  const nueva = g.get('contrasena')?.value;
  const confirmar = g.get('confirmar')?.value;
  return nueva === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-recuperar',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './recuperar.component.html',
  styleUrl: './recuperar.component.scss',
})
export class RecuperarComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  paso = signal<1 | 2 | 3>(1);
  cargando = signal(false);
  error = signal('');
  enviado = signal(false);
  private token = '';

  correo = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
  });

  nueva = this.fb.nonNullable.group(
    {
      contrasena: ['', [Validators.required, Validators.minLength(8)]],
      confirmar: ['', [Validators.required]],
    },
    { validators: coinciden },
  );

  invalido(grupo: 'correo' | 'nueva', campo: string) {
    const g: AbstractControl = this[grupo];
    const c = g.get(campo);
    return !!c && c.invalid && (c.touched || this.enviado());
  }

  solicitar() {
    this.enviado.set(true);
    this.error.set('');
    if (this.correo.invalid) return;

    this.cargando.set(true);
    this.auth.solicitarRecuperacion(this.correo.getRawValue().correo).subscribe({
      next: (r) => {
        this.cargando.set(false);
        this.token = r.token;
        this.enviado.set(false);
        this.paso.set(2);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo iniciar la recuperación. Intenta de nuevo.');
      },
    });
  }

  guardar() {
    this.enviado.set(true);
    this.error.set('');
    if (this.nueva.invalid) return;

    this.cargando.set(true);
    this.auth.restablecerContrasena(this.token, this.nueva.getRawValue().contrasena).subscribe({
      next: () => {
        this.cargando.set(false);
        this.paso.set(3);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo cambiar la contraseña. Vuelve a empezar la recuperación.');
      },
    });
  }

  irALogin() {
    this.router.navigateByUrl('/auth');
  }
}
