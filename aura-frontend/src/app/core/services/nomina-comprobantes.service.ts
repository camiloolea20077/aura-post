import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

import { DesprendibleModel } from '../models/desprendible.model';
import { DocumentoNominaModel } from '../models/nomina-documento.model';
import { CertificadoService } from './certificado.service';
import { EmpresaService } from './empresa.service';
import { NominaDocumentoService } from './nomina-documento.service';
import { NominaPagoPdfService } from './nomina-pago-pdf.service';

/** Desprendibles que se piden a la vez al armar el PDF. */
const LOTE = 6;

/**
 * Comprobantes de pago de todo un documento de nómina en un solo PDF (una hoja por
 * empleado, en orden alfabético). Se usa desde el listado de nóminas.
 */
@Injectable({ providedIn: 'root' })
export class NominaComprobantesService {
  constructor(
    private readonly documentos: NominaDocumentoService,
    private readonly certificados: CertificadoService,
    private readonly empresaService: EmpresaService,
    private readonly pagoPdf: NominaPagoPdfService,
  ) {}

  /**
   * Descarga los comprobantes de los empleados liquidados y no anulados del documento.
   * @returns cuántos comprobantes se generaron (0 si no había ninguno)
   */
  async descargarTodos(doc: DocumentoNominaModel): Promise<number> {
    const filas = ((await lastValueFrom(this.documentos.liquidacion(doc.id)))?.data ?? [])
      .filter((f) => f.liquidada && f.estado !== 'ANULADO')
      .sort((a, b) => (a.empleadoNombre ?? '').localeCompare(b.empleadoNombre ?? ''));
    if (!filas.length) return 0;

    const desprendibles: DesprendibleModel[] = [];
    for (let i = 0; i < filas.length; i += LOTE) {
      const lote = await Promise.all(
        filas.slice(i, i + LOTE).map((f) => lastValueFrom(this.certificados.desprendible(f.nominaId))),
      );
      desprendibles.push(...lote.map((r) => r.data));
    }
    const empresa = (await lastValueFrom(this.empresaService.getConfig()))?.data ?? {};
    await this.pagoPdf.comprobantes(desprendibles, doc, empresa, `${doc.numeroCompleto}-comprobantes`);
    return desprendibles.length;
  }
}
