import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarioComponent, RangoFechas, aIso } from './calendario.component';

const hoy = new Date();
/** Día d del mes siguiente: siempre en el futuro y dentro de los dos meses visibles. */
const proximo = (d: number) => aIso(new Date(hoy.getFullYear(), hoy.getMonth() + 1, d));

describe('CalendarioComponent', () => {
  let fixture: ComponentFixture<CalendarioComponent>;
  let comp: CalendarioComponent;
  let raiz: HTMLElement;
  let rangos: (RangoFechas | null)[];
  let vistas: RangoFechas[];

  const dia = (iso: string) => {
    const mes = raiz.querySelectorAll('section.mes')[1];
    return [...mes.querySelectorAll<HTMLButtonElement>('button.dia')].find((b) => b.textContent!.trim() === String(Number(iso.slice(8))))!;
  };

  function crear(entradas: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [CalendarioComponent] });
    fixture = TestBed.createComponent(CalendarioComponent);
    comp = fixture.componentInstance;
    raiz = fixture.nativeElement;
    rangos = [];
    vistas = [];
    comp.rango.subscribe((r) => rangos.push(r));
    comp.mesVisible.subscribe((v) => vistas.push(v));
    for (const [k, v] of Object.entries(entradas)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
  }

  it('muestra dos meses desde el actual y avisa el periodo visible', () => {
    crear();
    expect(raiz.querySelectorAll('section.mes').length).toBe(2);
    expect(vistas[0]).toEqual({
      desde: aIso(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
      hasta: aIso(new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)),
    });
    expect(raiz.querySelector<HTMLButtonElement>('[aria-label="Meses anteriores"]')!.disabled).toBeTrue();
  });

  it('avanza y retrocede de mes, pero no antes del mes actual', () => {
    crear();
    comp.cambiarMes(-1);
    expect(vistas.length).toBe(1);

    raiz.querySelector<HTMLButtonElement>('[aria-label="Meses siguientes"]')!.click();
    fixture.detectChanges();
    expect(vistas[1].desde).toBe(proximo(1));
    expect(comp.enPrimerMes()).toBeFalse();

    comp.cambiarMes(-1);
    expect(comp.enPrimerMes()).toBeTrue();
    expect(vistas.length).toBe(3);
  });

  it('marca los días reservados y bloqueados, y no deja elegirlos', () => {
    crear({ bloqueados: [proximo(10)], reservados: [proximo(12)] });
    expect(dia(proximo(10)).classList).toContain('bloqueado');
    expect(dia(proximo(10)).title).toBe('Bloqueado');
    expect(dia(proximo(10)).disabled).toBeTrue();
    expect(dia(proximo(12)).title).toBe('Reservado');
    expect(dia(proximo(12)).disabled).toBeTrue();
    expect(dia(proximo(11)).title).toBe('Disponible');

    comp.elegir({ numero: 12, iso: proximo(12), pasado: false, bloqueado: false, reservado: true });
    expect(rangos).toEqual([]);
  });

  it('el anfitrión puede elegir días bloqueados', () => {
    crear({ bloqueados: [proximo(10)], permitirBloqueados: true });
    expect(dia(proximo(10)).disabled).toBeFalse();
  });

  it('no deja elegir días pasados', () => {
    crear();
    const ayer = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 1);
    comp.elegir({ numero: ayer.getDate(), iso: aIso(ayer), pasado: true, bloqueado: false, reservado: false });
    expect(rangos).toEqual([]);
  });

  it('elige un rango: el primer clic es el inicio y el segundo el fin', () => {
    crear();
    dia(proximo(5)).click();
    fixture.detectChanges();
    expect(rangos.at(-1)).toEqual({ desde: proximo(5), hasta: proximo(5) });

    dia(proximo(8)).click();
    fixture.detectChanges();
    expect(rangos.at(-1)).toEqual({ desde: proximo(5), hasta: proximo(8) });
    expect(dia(proximo(6)).getAttribute('aria-pressed')).toBe('true');
    expect(dia(proximo(9)).getAttribute('aria-pressed')).toBe('false');

    dia(proximo(3)).click();
    expect(rangos.at(-1)).toEqual({ desde: proximo(3), hasta: proximo(3) });
  });

  it('un día anterior al inicio empieza un rango nuevo', () => {
    crear();
    dia(proximo(8)).click();
    dia(proximo(4)).click();
    expect(rangos.at(-1)).toEqual({ desde: proximo(4), hasta: proximo(4) });
  });

  it('limpiar quita la selección', () => {
    crear();
    dia(proximo(5)).click();
    comp.limpiar();
    expect(rangos.at(-1)).toBeNull();
    expect(comp.desde()).toBeNull();
  });

  it('sin selección deshabilita los días y quita la leyenda de seleccionado', () => {
    crear({ seleccionable: false });
    expect(dia(proximo(5)).disabled).toBeTrue();
    expect(raiz.querySelector('.leyenda')!.textContent).not.toContain('Seleccionado');
    comp.elegir({ numero: 5, iso: proximo(5), pasado: false, bloqueado: false, reservado: false });
    expect(rangos).toEqual([]);
  });
});
