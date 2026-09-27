import { ManualError, ManualModulo } from './manual.model';
import { GENERAL } from './contenido/general';
import { POS_CAJA } from './contenido/pos-caja';
import { CATALOGO } from './contenido/catalogo';
import { INVENTARIO } from './contenido/inventario';
import { COMPRAS_VENTAS } from './contenido/compras-ventas';
import { FINANZAS } from './contenido/finanzas';
import { CONTABILIDAD } from './contenido/contabilidad';
import { REPORTES, TERCEROS_SUCURSALES, VENDEDORES } from './contenido/reportes';

/** Mismo orden que el menú lateral. Nómina y recursos humanos tendrán su propio manual. */
export const GRUPOS_MANUAL = [
  'Empezar',
  'Principal',
  'Caja',
  'Catálogo',
  'Precios',
  'Inventario',
  'Compras',
  'Ventas',
  'Cuentas',
  'Cartera',
  'Tesorería',
  'Contabilidad',
  'Reportes',
  'Terceros y Sucursales',
  'Vendedores',
];

const TODOS: ManualModulo[] = [
  ...GENERAL,
  ...POS_CAJA,
  ...CATALOGO,
  ...INVENTARIO,
  ...COMPRAS_VENTAS,
  ...FINANZAS,
  ...CONTABILIDAD,
  ...REPORTES,
  ...TERCEROS_SUCURSALES,
  ...VENDEDORES,
];

const orden = (g: string): number => {
  const i = GRUPOS_MANUAL.indexOf(g);
  return i < 0 ? GRUPOS_MANUAL.length : i;
};

/** Todos los módulos en el orden del menú (estable dentro de cada grupo). */
export const MANUAL: ManualModulo[] = TODOS.map((m, i) => ({ m, i }))
  .sort((a, b) => orden(a.m.grupo) - orden(b.m.grupo) || a.i - b.i)
  .map((x) => x.m);

export interface GrupoManual {
  nombre: string;
  modulos: ManualModulo[];
}

export const MANUAL_POR_GRUPO: GrupoManual[] = GRUPOS_MANUAL.map((nombre) => ({
  nombre,
  modulos: MANUAL.filter((m) => m.grupo === nombre),
})).filter((g) => g.modulos.length > 0);

/** El módulo que explica la pantalla de esa URL: gana la ruta más larga que la contenga. */
export function moduloPorRuta(url: string | null | undefined): ManualModulo | null {
  const limpia = (url ?? '').split(/[?#]/)[0];
  if (!limpia) return null;
  let mejor: ManualModulo | null = null;
  let largo = 0;
  for (const m of MANUAL) {
    for (const r of m.rutas) {
      const coincide = limpia === r || limpia.startsWith(r + '/');
      if (coincide && r.length > largo) {
        mejor = m;
        largo = r.length;
      }
    }
  }
  return mejor;
}

/** Minúsculas y sin tildes, para que "credito" encuentre "Crédito". */
export function normalizar(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

export interface ResultadoBusqueda {
  modulo: ManualModulo;
  /** Errores del módulo que coinciden con la búsqueda (útil al pegar un mensaje). */
  errores: ManualError[];
  puntos: number;
}

const texto = (m: ManualModulo): string =>
  normalizar(
    [
      m.resumen,
      ...m.secciones.flatMap((s) => [s.titulo, ...(s.texto ?? []), ...(s.pasos ?? []), ...(s.notas ?? [])]),
    ].join(' '),
  );

/** Palabras que no distinguen un tema de otro. */
const VACIAS = new Set(
  'para por con los las del que una uno unos unas este esta esto ese esa hay sin como pero sus son fue ser mas muy the'.split(' '),
);

const palabrasDe = (s: string): string[] => [
  ...new Set(
    normalizar(s)
      .split(' ')
      .filter((p) => p.length > 2 && !VACIAS.has(p)),
  ),
];

/**
 * Cuántas de las palabras buscadas deben aparecer en un tema. Con pocas,
 * todas; con muchas, la mayoría.
 */
const minimo = (n: number): number => (n <= 2 ? n : Math.ceil(n * 0.6));

const cuenta = (palabras: string[], t: string): number => palabras.filter((p) => t.includes(p)).length;

/**
 * Qué tanto del mensaje del manual está en lo que pegó el usuario. Se mide en
 * esa dirección porque el mensaje real trae nombres de productos, números y
 * valores que el manual no tiene ("Stock insuficiente para: Arroz. Disponible: 3").
 */
function cobertura(mensaje: string, consulta: Set<string>): number {
  const propias = palabrasDe(mensaje);
  if (propias.length < 2) return 0;
  const presentes = propias.filter((p) => consulta.has(p)).length;
  return presentes >= 2 ? presentes / propias.length : 0;
}

/**
 * Busca por palabras en los temas y en sus errores. Un error cuyo mensaje
 * coincide con lo pegado pesa más que todo lo demás: así, pegar el mensaje
 * que salió en pantalla lleva a su explicación.
 */
export function buscarEnManual(consulta: string): ResultadoBusqueda[] {
  const palabras = palabrasDe(consulta);
  if (!palabras.length) return [];
  const necesarias = minimo(palabras.length);
  const enConsulta = new Set(palabras);

  const resultados: ResultadoBusqueda[] = [];
  for (const m of MANUAL) {
    const titulo = normalizar(`${m.titulo} ${m.grupo}`);
    const cuerpo = texto(m);

    let puntosErrores = 0;
    const errores = m.errores.filter((e) => {
      const c = cobertura(e.mensaje, enConsulta);
      if (c >= 0.7) {
        puntosErrores += 40 * c;
        return true;
      }
      const directa = cuenta(palabras, normalizar(`${e.mensaje} ${e.causa} ${e.solucion}`)) >= necesarias;
      if (directa) puntosErrores += 4;
      return directa;
    });
    const enModulo = cuenta(palabras, `${titulo} ${cuerpo}`) >= necesarias;
    if (!enModulo && !errores.length) continue;

    let puntos = puntosErrores;
    for (const p of palabras) {
      if (titulo.includes(p)) puntos += 5;
      if (cuerpo.includes(p)) puntos += 1;
    }
    resultados.push({ modulo: m, errores, puntos });
  }
  return resultados.sort((a, b) => b.puntos - a.puntos);
}
