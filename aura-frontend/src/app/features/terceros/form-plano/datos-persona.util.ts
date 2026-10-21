import { Observable } from 'rxjs';

import { TerceroCorreo, TerceroModel, TerceroTelefono, TipoImagenTercero } from '../../../core/models/tercero.model';
import { TelefonoItem } from '../../../shared/components/telefonos-input/telefonos-input.component';

/**
 * Apoyo del formulario de terceros para los datos de la persona (V211):
 * teléfonos y correos propios y del contacto, e imágenes por subir.
 */

/** Teléfonos del tercero separados en propios y de la persona de contacto. */
export function separarTelefonos(t: TerceroModel): { propios: TelefonoItem[]; contacto: TelefonoItem[] } {
  const lista = t.telefonos ?? [];
  const aItem = (x: TerceroTelefono): TelefonoItem => ({ tipo: x.tipo, numero: x.numero, extension: x.extension });
  const propios = lista.filter((x) => !x.deContacto).map(aItem);
  // Registros anteriores a V211 que no pasaron por la migración: el teléfono suelto.
  if (!propios.length && t.telefono) propios.push({ tipo: 'CELULAR', numero: t.telefono, extension: null });
  return { propios, contacto: lista.filter((x) => x.deContacto).map(aItem) };
}

/** Correos del tercero separados en propios y de la persona de contacto. */
export function separarCorreos(t: TerceroModel): { propios: string[]; contacto: string[] } {
  const lista = t.correos ?? [];
  const propios = lista.filter((x) => !x.deContacto).map((x) => x.correo);
  if (!propios.length && t.email) propios.push(t.email);
  return { propios, contacto: lista.filter((x) => x.deContacto).map((x) => x.correo) };
}

/** Une los teléfonos propios y los del contacto en la lista que guarda el back. */
export function unirTelefonos(propios: TelefonoItem[], contacto: TelefonoItem[]): TerceroTelefono[] {
  return [
    ...(propios ?? []).map((t) => ({ ...t, deContacto: false })),
    ...(contacto ?? []).map((t) => ({ ...t, deContacto: true })),
  ];
}

/** Une los correos propios y los del contacto en la lista que guarda el back. */
export function unirCorreos(propios: string[], contacto: string[]): TerceroCorreo[] {
  return [
    ...(propios ?? []).map((correo) => ({ correo, deContacto: false })),
    ...(contacto ?? []).map((correo) => ({ correo, deContacto: true })),
  ];
}

/**
 * Imágenes del tercero (foto oficial, de perfil y firma). Como al crear todavía
 * no hay id, lo elegido queda pendiente y se sube después de guardar.
 */
export class ImagenesTercero {
  /** URL a mostrar por tipo: la guardada o la vista previa local. */
  readonly urls: Record<TipoImagenTercero, string | null> = {
    'foto-oficial': null,
    'foto-perfil': null,
    firma: null,
  };
  private readonly porSubir = new Map<TipoImagenTercero, File>();
  private readonly porQuitar = new Set<TipoImagenTercero>();

  /** Pone las URLs guardadas del tercero. */
  cargar(t: TerceroModel): void {
    this.urls['foto-oficial'] = t.fotoOficialUrl ?? null;
    this.urls['foto-perfil'] = t.fotoPerfilUrl ?? null;
    this.urls.firma = t.firmaUrl ?? null;
  }

  elegir(tipo: TipoImagenTercero, archivo: File): void {
    this.liberar(tipo);
    this.porSubir.set(tipo, archivo);
    this.porQuitar.delete(tipo);
    this.urls[tipo] = URL.createObjectURL(archivo);
  }

  quitar(tipo: TipoImagenTercero): void {
    this.liberar(tipo);
    this.porSubir.delete(tipo);
    this.porQuitar.add(tipo);
    this.urls[tipo] = null;
  }

  /**
   * Aplica los cambios pendientes del tercero ya guardado.
   *
   * @return los tipos que no se pudieron subir o quitar
   */
  async aplicar(
    subir: (tipo: TipoImagenTercero, archivo: File) => Observable<unknown>,
    quitar: (tipo: TipoImagenTercero) => Observable<unknown>,
    esperar: <T>(o: Observable<T>) => Promise<T>,
  ): Promise<TipoImagenTercero[]> {
    const fallidos: TipoImagenTercero[] = [];
    for (const [tipo, archivo] of this.porSubir) {
      try {
        await esperar(subir(tipo, archivo));
        this.porSubir.delete(tipo);
      } catch {
        fallidos.push(tipo);
      }
    }
    for (const tipo of this.porQuitar) {
      try {
        await esperar(quitar(tipo));
        this.porQuitar.delete(tipo);
      } catch {
        fallidos.push(tipo);
      }
    }
    return fallidos;
  }

  private liberar(tipo: TipoImagenTercero): void {
    const url = this.urls[tipo];
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}
