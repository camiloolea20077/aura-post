import { ClaseDocumentoNomina } from '../../../core/models/nomina-documento.model';
import { ProcesoError } from '../../../core/models/proceso.model';

/** Lo que cambia entre la pantalla de prenómina y la de nómina. */
export interface PantallaDocumento {
  clase: ClaseDocumentoNomina;
  ruta: string;
  permiso: string;
  titulo: string;
  icono: string;
}

/** Configuración de la pantalla según la clase de documento (viene en la data de la ruta). */
export function pantallaDocumento(clase: ClaseDocumentoNomina | undefined): PantallaDocumento {
  return clase === 'NOMINA'
    ? { clase: 'NOMINA', ruta: '/nomina/nominas', permiso: 'recursos-humanos.nomina-documento', titulo: 'Nómina', icono: 'pi pi-wallet' }
    : { clase: 'PRENOMINA', ruta: '/nomina/prenomina', permiso: 'recursos-humanos.prenomina', titulo: 'Prenómina', icono: 'pi pi-list-check' };
}

/** Primer y último día del mes de una fecha (el período que se propone al crear). */
export function rangoDelMes(fecha: Date): { desde: Date; hasta: Date } {
  return {
    desde: new Date(fecha.getFullYear(), fecha.getMonth(), 1),
    hasta: new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0),
  };
}

/**
 * Período y fecha de pago que se proponen al crear el documento, según la clase
 * del tipo de comprobante: prima = semestre en curso (paga 30 jun / 20 dic);
 * cesantías e intereses = el año (el anterior si estamos en enero o febrero; pagan
 * 14 feb y 31 ene del año siguiente); lo demás = el mes en curso.
 */
export function periodoPorClase(clase: string | null, hoy: Date): { desde: Date; hasta: Date; pago: Date } {
  const anio = hoy.getFullYear();
  if (clase === 'PRIMA') {
    const primerSemestre = hoy.getMonth() < 6;
    return primerSemestre
      ? { desde: new Date(anio, 0, 1), hasta: new Date(anio, 5, 30), pago: new Date(anio, 5, 30) }
      : { desde: new Date(anio, 6, 1), hasta: new Date(anio, 11, 31), pago: new Date(anio, 11, 20) };
  }
  if (clase === 'CESANTIAS' || clase === 'INTERESES_CESANTIAS') {
    const a = hoy.getMonth() < 2 ? anio - 1 : anio;
    const pago = clase === 'CESANTIAS' ? new Date(a + 1, 1, 14) : new Date(a + 1, 0, 31);
    return { desde: new Date(a, 0, 1), hasta: new Date(a, 11, 31), pago };
  }
  const mes = rangoDelMes(hoy);
  return { desde: mes.desde, hasta: mes.hasta, pago: mes.hasta };
}

/** Totales de la pestaña Liquidación: solo suman los empleados liquidados. */
export function totalesLiquidacion(
  filas: { liquidada: boolean; devengado: number; deducido: number; neto: number; aportes: number }[],
): { liquidados: number; devengado: number; deducido: number; neto: number; aportes: number } {
  return filas
    .filter((f) => f.liquidada)
    .reduce(
      (t, f) => ({
        liquidados: t.liquidados + 1,
        devengado: t.devengado + (f.devengado ?? 0),
        deducido: t.deducido + (f.deducido ?? 0),
        neto: t.neto + (f.neto ?? 0),
        aportes: t.aportes + (f.aportes ?? 0),
      }),
      { liquidados: 0, devengado: 0, deducido: 0, neto: 0, aportes: 0 },
    );
}

/** Errores por empleado de una corrida (JSON del proceso); vacío si no hay o no es válido. */
export function leerErroresProceso(json: string | null): ProcesoError[] {
  if (!json) return [];
  try {
    const errores = JSON.parse(json);
    return Array.isArray(errores) ? errores : [];
  } catch {
    return [];
  }
}
