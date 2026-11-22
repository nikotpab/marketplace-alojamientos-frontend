import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoMotivoComponent } from './dialogo-motivo.component';

describe('DialogoMotivoComponent', () => {
  let fixture: ComponentFixture<DialogoMotivoComponent>;
  let comp: DialogoMotivoComponent;
  let raiz: HTMLElement;
  let confirmados: string[];
  let cerrado: boolean;

  const botones = () => [...raiz.querySelectorAll<HTMLButtonElement>('.acciones-dialogo button')];
  const principal = () => botones()[1];
  const secundario = () => botones()[0];

  function crear(entradas: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [DialogoMotivoComponent] });
    fixture = TestBed.createComponent(DialogoMotivoComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    fixture.componentRef.setInput('titulo', 'Bloquear publicación');
    for (const [k, v] of Object.entries(entradas)) fixture.componentRef.setInput(k, v);
    confirmados = [];
    cerrado = false;
    comp.confirmar.subscribe((m) => confirmados.push(m));
    comp.cerrar.subscribe(() => (cerrado = true));
    fixture.detectChanges();
  }

  it('exige un motivo de al menos 5 caracteres', () => {
    crear({ descripcion: 'El anfitrión recibirá el motivo.', etiquetaMotivo: 'Motivo del bloqueo' });
    expect(raiz.textContent).toContain('El anfitrión recibirá el motivo.');
    expect(raiz.querySelector('label')!.textContent).toContain('Motivo del bloqueo');

    comp.motivo = ' abc ';
    principal().click();
    fixture.detectChanges();
    expect(confirmados).toEqual([]);
    expect(raiz.querySelector('[role="alert"]')!.textContent).toContain('mínimo 5 caracteres');
  });

  it('sin segunda confirmación emite el motivo sin espacios', () => {
    crear({ textoAccion: 'Restringir', peligro: false });
    expect(principal().className).toBe('btn-primario');
    expect(principal().textContent).toContain('Restringir');
    comp.motivo = '  Incumple las reglas  ';
    principal().click();
    expect(confirmados).toEqual(['Incumple las reglas']);
  });

  it('con segunda confirmación pide continuar, permite volver y luego confirma', () => {
    crear({ confirmacion: '¿Seguro? La publicación deja de verse.', textoAccion: 'Bloquear' });
    expect(principal().className).toBe('btn-peligro');
    comp.motivo = 'Fotos engañosas';
    expect(principal().textContent).toContain('Continuar');

    principal().click();
    fixture.detectChanges();
    expect(confirmados).toEqual([]);
    expect(raiz.querySelector('.confirmar')!.textContent).toContain('¿Seguro?');
    expect(raiz.querySelector('.motivo')!.textContent).toContain('Fotos engañosas');
    expect(secundario().textContent).toContain('Volver');

    secundario().click();
    fixture.detectChanges();
    expect(comp.confirmando()).toBeFalse();
    expect(cerrado).toBeFalse();

    principal().click();
    fixture.detectChanges();
    principal().click();
    expect(confirmados).toEqual(['Fotos engañosas']);
  });

  it('mientras procesa no emite y muestra el error recibido', () => {
    crear({ procesando: true, error: 'No pudimos bloquearla.' });
    comp.motivo = 'Fotos engañosas';
    comp.continuar();
    expect(confirmados).toEqual([]);
    expect(principal().textContent).toContain('Procesando…');
    expect(raiz.textContent).toContain('No pudimos bloquearla.');
  });

  it('Cancelar cierra el diálogo', () => {
    crear();
    secundario().click();
    expect(cerrado).toBeTrue();
  });
});
