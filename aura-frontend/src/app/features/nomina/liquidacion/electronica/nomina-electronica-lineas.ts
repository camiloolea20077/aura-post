import {
  NominaElectronicaAccruals,
  NominaElectronicaDeductions,
  NominaElectronicaDevengado,
  NominaElectronicaLinea,
} from '../../../../core/models/nomina-electronica.model';

/**
 * Convierte el payload de Factus en líneas legibles para la vista previa, de modo
 * que todo lo que viaja a la DIAN se vea en la modal (no solo sueldo y transporte).
 */

const HORAS: Record<string, string> = {
  '1': 'Hora extra diurna',
  '2': 'Hora extra nocturna',
  '3': 'Recargo nocturno',
  '4': 'Hora extra diurna dominical/festiva',
  '5': 'Recargo diurno dominical/festivo',
  '6': 'Hora extra nocturna dominical/festiva',
  '7': 'Recargo nocturno dominical/festivo',
};

const INCAPACIDADES: Record<string, string> = {
  '1': 'común',
  '2': 'profesional',
  '3': 'laboral',
};

const LICENCIAS: Record<string, string> = {
  '1': 'Licencia de maternidad/paternidad',
  '2': 'Licencia remunerada',
  '3': 'Licencia no remunerada',
};

function lista<T>(v: T | T[] | undefined | null): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function cod(v?: string | number): string {
  return v == null ? '' : String(v);
}

function dias(d: NominaElectronicaDevengado): string {
  return d.quantity != null && d.quantity !== '' ? ` (${d.quantity} días)` : '';
}

/** Devengados en el orden del documento. */
export function lineasDevengado(acc?: NominaElectronicaAccruals): NominaElectronicaLinea[] {
  if (!acc) return [];
  const out: NominaElectronicaLinea[] = [];
  if (acc.suel) out.push({ etiqueta: 'Sueldo', valor: acc.suel.amount });
  lista(acc.tra).forEach((t) => out.push({ etiqueta: 'Auxilio de transporte', valor: t.amount }));
  lista(acc.hora).forEach((h) =>
    out.push({
      etiqueta: `${HORAS[cod(h.accrual_type_code)] ?? 'Hora extra'} (${h.quantity} h · ${h.percentage}%)`,
      valor: h.amount,
    }),
  );
  lista(acc.comi).forEach((c) => out.push({ etiqueta: 'Comisión', valor: c.amount }));
  lista(acc.boni).forEach((b) =>
    out.push({
      etiqueta: cod(b.accrual_type_code) === '1' ? 'Bonificación salarial' : 'Bonificación no salarial',
      valor: b.amount,
    }),
  );
  lista(acc.cesa).forEach((c) =>
    out.push({
      etiqueta: cod(c.accrual_type_code) === '2' ? `Intereses a las cesantías (${c.percentage ?? 12}%)` : 'Cesantías',
      valor: c.amount,
    }),
  );
  lista(acc.prim).forEach((p) => out.push({ etiqueta: `Prima de servicios${dias(p)}`, valor: p.amount }));
  lista(acc.vaca).forEach((v) =>
    out.push({
      etiqueta: `${cod(v.accrual_type_code) === '1' ? 'Vacaciones disfrutadas' : 'Vacaciones compensadas'}${dias(v)}`,
      valor: v.amount,
    }),
  );
  lista(acc.inca).forEach((i) =>
    out.push({
      etiqueta: `Incapacidad ${INCAPACIDADES[cod(i.accrual_type_code)] ?? ''}${dias(i)}`.replace('  ', ' '),
      valor: i.amount,
    }),
  );
  lista(acc.lice).forEach((l) =>
    out.push({ etiqueta: `${LICENCIAS[cod(l.accrual_type_code)] ?? 'Licencia'}${dias(l)}`, valor: l.amount }),
  );
  if (acc.inde) out.push({ etiqueta: 'Indemnización', valor: acc.inde.amount });
  lista(acc.otro).forEach((o) => out.push({ etiqueta: o.description || 'Otro devengado', valor: o.amount }));
  return out;
}

/** Deducciones en el orden del documento. */
export function lineasDeduccion(ded?: NominaElectronicaDeductions): NominaElectronicaLinea[] {
  if (!ded) return [];
  const out: NominaElectronicaLinea[] = [];
  if (ded.salu) out.push({ etiqueta: `Salud (${ded.salu.percentage ?? 0}%)`, valor: ded.salu.amount });
  if (ded.pens) out.push({ etiqueta: `Pensión (${ded.pens.percentage ?? 0}%)`, valor: ded.pens.amount });
  lista(ded.dedu).forEach((d) =>
    out.push({ etiqueta: `Fondo de solidaridad pensional${d.percentage ? ` (${d.percentage}%)` : ''}`, valor: d.amount }),
  );
  if (ded.rete) out.push({ etiqueta: 'Retención en la fuente', valor: ded.rete.amount });
  lista(ded.libr).forEach((l) => out.push({ etiqueta: l.description || 'Libranza', valor: l.amount }));
  lista(ded.otra).forEach((o) => out.push({ etiqueta: o.description || 'Otra deducción', valor: o.amount }));
  return out;
}

/** Suma de las líneas (para mostrar totales y neto). */
export function totalLineas(lineas: NominaElectronicaLinea[]): number {
  return lineas.reduce((s, l) => s + Number(l.valor ?? 0), 0);
}
