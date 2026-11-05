import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Solo permite dígitos en un input (teclado, pegado o arrastre). */
@Directive({
  selector: 'input[soloNumeros]',
  standalone: true,
})
export class SoloNumerosDirective {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  @HostListener('input')
  filtrar() {
    const limpio = this.el.value.replace(/\D/g, '');
    if (limpio !== this.el.value) {
      this.el.value = limpio;
      // Avisa al formulario con el valor ya limpio
      this.el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
