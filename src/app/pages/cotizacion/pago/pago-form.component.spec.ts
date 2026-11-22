import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagoFormComponent } from './pago-form.component';

describe('PagoFormComponent', () => {
  let fixture: ComponentFixture<PagoFormComponent>;
  let comp: PagoFormComponent;
  let raiz: HTMLElement;
  let pagos: string[];
  let cancelado: boolean;

  const anio = new Date().getFullYear() % 100;
  const input = (control: string) => raiz.querySelector<HTMLInputElement>(`[formControlName="${control}"]`)!;
  const escribir = (control: string, valor: string) => {
    const el = input(control);
    el.value = valor;
    el.dispatchEvent(new Event('input'));
  };
  const enviar = () => {
    raiz.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const errores = () => [...raiz.querySelectorAll('[role="alert"]')].map((e) => e.textContent!.trim());

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PagoFormComponent] });
    fixture = TestBed.createComponent(PagoFormComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('total', 450000);
    pagos = [];
    cancelado = false;
    comp.pagar.subscribe((t) => pagos.push(t));
    comp.cancelar.subscribe(() => (cancelado = true));
    fixture.detectChanges();
  });

  it('muestra el total en el botón de pagar', () => {
    expect(raiz.querySelector('button.pagar')!.textContent).toContain('450,000');
  });

  it('da formato al número, al vencimiento y al CVC mientras se escriben', () => {
    escribir('numero', '4242-4242 4242 42429999');
    escribir('vence', '1a2/3');
    escribir('cvc', '12a34');
    expect(comp.form.controls.numero.value).toBe('4242 4242 4242 4242');
    expect(comp.form.controls.vence.value).toBe('12/3');
    expect(comp.form.controls.cvc.value).toBe('123');

    escribir('vence', '1');
    expect(comp.form.controls.vence.value).toBe('1');
  });

  it('un formulario vacío marca todos los campos y no paga', () => {
    enviar();
    expect(pagos).toEqual([]);
    expect(errores()).toEqual([
      'Ingresa el nombre del titular.',
      'Ingresa los 16 dígitos de la tarjeta.',
      'Usa el formato MM/AA.',
    ]);
  });

  it('rechaza una tarjeta que no es de prueba, un mes inválido, un CVC incompleto y una tarjeta vencida', () => {
    comp.form.setValue({ nombre: 'Ana Pérez', numero: '5555 5555 5555 4444', vence: '13/30', cvc: '12' });
    enviar();
    expect(errores()).toEqual(['Usa una tarjeta de prueba de Stripe.', 'Usa el formato MM/AA.', '3 dígitos.']);

    comp.form.controls.vence.setValue(`01/${String(anio - 1).padStart(2, '0')}`);
    enviar();
    expect(errores()).toContain('Tarjeta vencida.');
    expect(pagos).toEqual([]);
  });

  it('paga con el identificador de la tarjeta de prueba y no conserva los datos de la tarjeta', () => {
    comp.form.setValue({ nombre: 'Ana Pérez', numero: '4000 0000 0000 0002', vence: `12/${anio}`, cvc: '123' });
    enviar();
    expect(pagos).toEqual(['pm_card_chargeDeclined']);
    expect(comp.form.controls.numero.value).toBe('');
    expect(comp.form.controls.vence.value).toBe('');
    expect(comp.form.controls.cvc.value).toBe('');
    expect(comp.form.controls.nombre.value).toBe('Ana Pérez');
  });

  it('mientras procesa no vuelve a pagar', () => {
    fixture.componentRef.setInput('procesando', true);
    fixture.detectChanges();
    comp.form.setValue({ nombre: 'Ana Pérez', numero: '4242 4242 4242 4242', vence: `12/${anio + 1}`, cvc: '123' });
    comp.enviar();
    expect(pagos).toEqual([]);
    expect(raiz.querySelector('button.pagar')!.textContent).toContain('Procesando pago');
  });

  it('Volver al desglose avisa al padre', () => {
    raiz.querySelector<HTMLButtonElement>('button.cancelar')!.click();
    expect(cancelado).toBeTrue();
  });
});
