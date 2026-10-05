/**
 * Cómo se agrupan y describen las pantallas de Recursos Humanos en el centro.
 *
 * Igual que centro-contabilidad.config.ts: se cruza por RUTA con los ítems del
 * grupo "Recursos Humanos" de sidebar.config.ts ya filtrados por permisos
 * (StateStore.menuGroups()). Una pantalla sin permiso no aparece aunque esté
 * aquí, y una nueva que falte aquí cae en "Otros".
 */
export type GrupoRrhhId = 'gestion' | 'nomina' | 'asistencia' | 'parametros';

export interface ModuloRrhhConfig {
  /** Ruta existente del ítem en sidebar.config.ts. */
  route: string;
  /** Título en el centro; si falta se usa el label del sidebar. */
  titulo?: string;
  descripcion: string;
  grupo: GrupoRrhhId;
}

export interface GrupoRrhhConfig {
  id: GrupoRrhhId | 'otros';
  titulo: string;
  icono: string;
}

export const GRUPOS_RRHH: GrupoRrhhConfig[] = [
  { id: 'gestion', titulo: 'Personal', icono: 'pi pi-users' },
  { id: 'nomina', titulo: 'Nómina', icono: 'pi pi-calculator' },
  { id: 'asistencia', titulo: 'Asistencia', icono: 'pi pi-clock' },
  { id: 'parametros', titulo: 'Parámetros', icono: 'pi pi-sliders-h' },
  { id: 'otros', titulo: 'Otros', icono: 'pi pi-th-large' },
];

export const MODULOS_RRHH: ModuloRrhhConfig[] = [
  // ── Personal ────────────────────────────────────────────────────────
  { route: '/nomina/empleados', grupo: 'gestion', descripcion: 'Hoja de vida, contratos, afiliaciones y embargos' },
  { route: '/nomina/saldos-iniciales', grupo: 'gestion', descripcion: 'Vacaciones, cesantías y acumulados traídos de otro sistema' },
  { route: '/proyectos', grupo: 'gestion', descripcion: 'Obras y frentes de trabajo a los que se asigna personal' },
  { route: '/comisiones/configuracion', grupo: 'gestion', descripcion: 'Reglas de comisión por vendedor o técnico' },
  { route: '/comisiones/liquidaciones', grupo: 'gestion', descripcion: 'Calcular y pagar las comisiones causadas' },

  // ── Nómina ──────────────────────────────────────────────────────────
  { route: '/nomina/periodos', grupo: 'nomina', descripcion: 'Abrir y cerrar períodos de pago' },
  { route: '/nomina/conceptos', grupo: 'nomina', descripcion: 'Devengos y deducciones de la nómina' },
  { route: '/nomina/liquidacion', grupo: 'nomina', descripcion: 'Liquidar, aprobar y pagar la nómina del período' },
  { route: '/nomina/preliquidacion', grupo: 'nomina', descripcion: 'Revisar la nómina antes de liquidarla' },
  { route: '/nomina/electronica', grupo: 'nomina', descripcion: 'Enviar la nómina electrónica a la DIAN' },
  { route: '/nomina/pila', grupo: 'nomina', descripcion: 'Planilla de seguridad social y su validación' },
  { route: '/nomina/prestaciones', grupo: 'nomina', descripcion: 'Prima, cesantías, intereses y vacaciones' },

  // ── Asistencia ──────────────────────────────────────────────────────
  { route: '/asistencia-frente/digitacion', grupo: 'asistencia', descripcion: 'Registrar la asistencia diaria por frente' },
  { route: '/asistencia-frente/revision', grupo: 'asistencia', descripcion: 'Aprobar la asistencia digitada en los frentes' },
  { route: '/asistencia-frente/preliquidacion', grupo: 'asistencia', descripcion: 'Horas y recargos del frente antes de la nómina' },
  { route: '/asistencia/turnos', grupo: 'asistencia', descripcion: 'Horarios asignados a cada empleado' },
  { route: '/asistencia/marcaje', grupo: 'asistencia', descripcion: 'Entradas y salidas del personal' },
  { route: '/asistencia/revision', grupo: 'asistencia', descripcion: 'Días con tardanzas, ausencias o marcajes incompletos' },
  { route: '/asistencia/novedades', grupo: 'asistencia', descripcion: 'Novedades de asistencia que pasan a la nómina' },
  { route: '/asistencia/autorizaciones', grupo: 'asistencia', descripcion: 'Horas extra y permisos por autorizar' },

  // ── Parámetros ──────────────────────────────────────────────────────
  { route: '/laboral/configuracion', grupo: 'parametros', descripcion: 'Jornada, recargos y reglas laborales' },
  { route: '/laboral/calendario', grupo: 'parametros', descripcion: 'Festivos y días no laborables' },
  { route: '/nomina/config', grupo: 'parametros', descripcion: 'Salario mínimo, auxilio, porcentajes y cuentas' },
];
