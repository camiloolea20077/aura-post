import { TipoPersona } from '../../core/services/firma-contable.service';

/** Natural o jurídica: decide qué datos pide el formulario del gestionado. */
export const TIPO_PERSONA_OPTS: { label: string; value: TipoPersona }[] = [
  { label: 'Persona jurídica (empresa, sociedad)', value: 'JURIDICA' },
  { label: 'Persona natural', value: 'NATURAL' },
];

const DOCS_NATURAL = [
  { label: 'NIT (cédula con RUT)', value: 'NIT' },
  { label: 'Cédula de ciudadanía', value: 'CC' },
  { label: 'Cédula de extranjería', value: 'CE' },
  { label: 'Pasaporte', value: 'PA' },
  { label: 'PPT', value: 'PPT' },
];

/** La jurídica solo se identifica con NIT; la natural con NIT o su documento. */
export function tiposDocumentoPara(tipo: TipoPersona): { label: string; value: string }[] {
  return tipo === 'JURIDICA' ? [{ label: 'NIT', value: 'NIT' }] : DOCS_NATURAL;
}

/** El DV solo aplica al NIT. */
export function llevaDv(tipoDocumento: string | null | undefined): boolean {
  return (tipoDocumento ?? 'NIT') === 'NIT';
}
