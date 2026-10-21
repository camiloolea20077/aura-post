import { NominaElectronicaMes } from '../../../../core/models/nomina-electronica.model';

/** Estado del documento del mes de un empleado, para la vista por mes. */
export interface EstadoMesNe {
  clave: 'ENVIADO' | 'LISTO' | 'INCOMPLETO';
  texto: string;
  severidad: 'success' | 'info' | 'warn';
}

/**
 * Enviado si su documento del mes está aceptado; listo si el mes está completo y no
 * tiene documento vigente (nunca se envió, o se eliminó con nota de ajuste);
 * incompleto si falta confirmar alguna nómina del mes.
 */
export function estadoMes(f: NominaElectronicaMes): EstadoMesNe {
  if (f.documentoEstado === 'ACEPTADO') return { clave: 'ENVIADO', texto: 'Enviado', severidad: 'success' };
  if (f.completo)
    return {
      clave: 'LISTO',
      texto: f.documentoEstado === 'ANULADO' ? 'Listo (reenviar corregido)' : 'Listo para enviar',
      severidad: 'info',
    };
  return { clave: 'INCOMPLETO', texto: 'Mes incompleto', severidad: 'warn' };
}
