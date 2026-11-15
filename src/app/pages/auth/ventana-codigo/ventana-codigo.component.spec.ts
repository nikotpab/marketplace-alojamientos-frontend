import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ESPERA_REENVIO, VentanaCodigoComponent } from './ventana-codigo.component';

describe('VentanaCodigoComponent', () => {
  let fixture: ComponentFixture<VentanaCodigoComponent>;
  let ventana: VentanaCodigoComponent;
  let raiz: HTMLElement;

  const campo = () => raiz.querySelector<HTMLInputElement>('#codigo-registro')!;
  const boton = (texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;

  function escribir(valor: string) {
    campo().value = valor;
    campo().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(VentanaCodigoComponent);
    ventana = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('correo', 'laura@correo.co');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('dice a qué correo llegó el código y pone el foco en el campo', () => {
    expect(raiz.textContent).toContain('laura@correo.co');
    expect(document.activeElement).toBe(campo());
  });

  it('con menos de 6 dígitos no confirma y lo explica', () => {
    const confirmados: string[] = [];
    ventana.confirmar.subscribe((c) => confirmados.push(c));

    escribir('123');
    boton('Confirmar y crear cuenta').click();
    fixture.detectChanges();

    expect(confirmados).toEqual([]);
    expect(raiz.textContent).toContain('Escribe los 6 dígitos del código.');
    expect(campo().getAttribute('aria-invalid')).toBe('true');
  });

  it('con 6 dígitos confirma el código', () => {
    const confirmados: string[] = [];
    ventana.confirmar.subscribe((c) => confirmados.push(c));

    escribir('048213');
    boton('Confirmar y crear cuenta').click();

    expect(confirmados).toEqual(['048213']);
  });

  it('solo acepta dígitos', () => {
    escribir('12a4b6');
    expect(campo().value).toBe('1246');
  });

  it('el reenvío espera 60 segundos y vuelve a esperar después de usarlo', fakeAsync(() => {
    fixture.destroy();
    fixture = TestBed.createComponent(VentanaCodigoComponent);
    ventana = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('correo', 'laura@correo.co');
    fixture.detectChanges();
    let reenvios = 0;
    ventana.reenviar.subscribe(() => reenvios++);

    expect(boton('Reenviar código').disabled).toBeTrue();
    expect(boton('Reenviar código').textContent).toContain(`${ESPERA_REENVIO} s`);

    tick(ESPERA_REENVIO * 1000);
    fixture.detectChanges();
    expect(boton('Reenviar código').disabled).toBeFalse();

    boton('Reenviar código').click();
    fixture.detectChanges();
    expect(reenvios).toBe(1);
    expect(boton('Reenviar código').disabled).toBeTrue();

    fixture.destroy();
  }));

  it('mientras se crea la cuenta no deja confirmar, reenviar ni cerrar', () => {
    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();

    expect(boton('Creando cuenta...').disabled).toBeTrue();
    expect(boton('Cambiar correo').disabled).toBeTrue();
    expect(raiz.querySelector<HTMLButtonElement>('.x')!.disabled).toBeTrue();
  });

  it('"Cambiar correo" cierra la ventana', () => {
    let cerrada = false;
    ventana.cerrar.subscribe(() => (cerrada = true));

    boton('Cambiar correo').click();

    expect(cerrada).toBeTrue();
  });
});
