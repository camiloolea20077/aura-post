/**
 * Países más frecuentes para terceros de empresas colombianas. `value` es el
 * código ISO que va en `codigoPais` (y en los códigos de país de expedición y
 * nacimiento); `label` es el nombre que se guarda en `pais`.
 */
export const PAIS_OPTS = [
  { label: 'Colombia', value: 'CO' },
  { label: 'Venezuela', value: 'VE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Perú', value: 'PE' },
  { label: 'Panamá', value: 'PA' },
  { label: 'México', value: 'MX' },
  { label: 'Chile', value: 'CL' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Brasil', value: 'BR' },
  { label: 'Estados Unidos', value: 'US' },
  { label: 'España', value: 'ES' },
  { label: 'China', value: 'CN' },
  { label: 'Otro', value: 'ZZ' },
];

/** Nombre del país por su código (Colombia si no se reconoce). */
export function nombrePais(codigo: string | null | undefined): string {
  return PAIS_OPTS.find((p) => p.value === codigo)?.label ?? 'Colombia';
}
