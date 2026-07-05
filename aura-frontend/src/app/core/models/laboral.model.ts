export interface JornadaConfigModel {
  id?: number | null;
  fechaInicioVigencia: string;
  fechaFinVigencia?: string | null;
  horasSemanalesLegales: number;
  horasMensualesBase: number;
  horaDiurnaInicio: string; // "HH:mm"
  horaDiurnaFin: string;
  horaNocturnaInicio: string;
  horaNocturnaFin: string;
  recargoNocturno: number;
  recargoExtraDiurna: number;
  recargoExtraNocturna: number;
  recargoDominicalFestivo: number;
  maxHorasExtraDia: number;
  maxHorasExtraSemana: number;
  aplicaExcepcionSectorial?: boolean;
  sectorExcepcion?: string | null;
}

export type TipoDiaCalendario =
  | 'LABORAL'
  | 'DOMINGO'
  | 'FESTIVO_NACIONAL'
  | 'FESTIVO_REGIONAL'
  | 'DESCANSO_EMPRESA'
  | 'CIERRE_OPERATIVO'
  | 'COMPENSATORIO';

export interface CalendarioDiaModel {
  id?: number | null;
  fecha: string;
  tipoDia: TipoDiaCalendario;
  nombre?: string | null;
  aplicaRecargo?: boolean;
  esFestivoNacional?: boolean;
  esFestivoRegional?: boolean;
  esDescansoEmpresa?: boolean;
  origen?: string;
}
