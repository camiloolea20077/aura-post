export const DIAS_SEMANA_OPTIONS = [
  { label: 'Domingo', value: 0, abrev: 'Dom' },
  { label: 'Lunes', value: 1, abrev: 'Lun' },
  { label: 'Martes', value: 2, abrev: 'Mar' },
  { label: 'Miércoles', value: 3, abrev: 'Mié' },
  { label: 'Jueves', value: 4, abrev: 'Jue' },
  { label: 'Viernes', value: 5, abrev: 'Vie' },
  { label: 'Sábado', value: 6, abrev: 'Sáb' },
];

export const DIAS_SEMANA_MAP = DIAS_SEMANA_OPTIONS.reduce(
  (acc, dia) => {
    acc[dia.value] = dia.abrev;
    return acc;
  },
  {} as Record<number, string>,
);
