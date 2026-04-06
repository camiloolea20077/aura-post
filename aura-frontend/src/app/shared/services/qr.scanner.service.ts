import { Injectable } from '@angular/core';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
  Result,
} from '@zxing/library';
import { FORMATS_1D, FORMATS_2D, ScanMode, ScanResult } from '../interfaces';

export interface QrScanResult {
  /** Contenido decodificado del QR */
  data: string;
  /** Momento del escaneo */
  timestamp: Date;
  /** Posición del QR en la imagen (esquinas) */
  location?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

@Injectable({ providedIn: 'root' })
export class QrScannerService {
  // MultiFormatReader es la clase core de ZXing (sin wrappers de browser).
  // Expone decode(BinaryBitmap) de forma pública y tipada.
  private reader: MultiFormatReader | null = null;
  private currentMode: ScanMode | null = null;

  /**
   * Inicializa (o reinicializa) el reader con los formatos del modo seleccionado.
   * Se llama automáticamente en decode() si no está inicializado.
   */
  init(mode: ScanMode = 'all'): void {
    if (this.reader && this.currentMode === mode) return;

    this.currentMode = mode;

    const formats =
      mode === 'qr-only'
        ? FORMATS_2D
        : mode === 'barcode-only'
          ? FORMATS_1D
          : [...FORMATS_2D, ...FORMATS_1D];

    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    this.reader = new MultiFormatReader();
    this.reader.setHints(hints);
  }

  /**
   * Decodifica un código desde un <canvas> (frame de video procesado).
   * Retorna null si no hay ningún código visible en el frame.
   */
  decode(canvas: HTMLCanvasElement): ScanResult | null {
    if (!this.reader) this.init();

    try {
      const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
      const binaryBitmap = new BinaryBitmap(
        new HybridBinarizer(luminanceSource),
      );
      const result: Result = this.reader!.decode(binaryBitmap);

      const fmtKey = BarcodeFormat[result.getBarcodeFormat()];
      const is2d = FORMATS_2D.includes(result.getBarcodeFormat());

      return {
        data: result.getText(),
        format: fmtKey,
        type: is2d ? '2d' : '1d',
        timestamp: new Date(),
      };
    } catch {
      // NotFoundException, ChecksumException, FormatException → sin código en el frame
      return null;
    }
  }

  /** Libera recursos */
  destroy(): void {
    this.reader?.reset();
    this.reader = null;
    this.currentMode = null;
  }
}
