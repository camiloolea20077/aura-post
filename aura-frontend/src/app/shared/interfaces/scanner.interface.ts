import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library';

export type ScannerTheme = 'dark' | 'light' | 'auto';

export type ScannerState =
  | 'idle'
  | 'requesting'
  | 'scanning'
  | 'error'
  | 'stopped';

export interface QrScannerConfig {
  /** Ancho preferido de la cámara */
  width?: number;
  /** Alto preferido de la cámara */
  height?: number;
  /** Usar cámara trasera en móviles ('environment') o frontal ('user') */
  facingMode?: 'environment' | 'user';
  /** Mostrar overlay de escaneo animado */
  showOverlay?: boolean;
  /** Vibrar al detectar código (móviles) */
  vibrate?: boolean;
  /** Detener automáticamente tras primer escaneo */
  stopOnFirstScan?: boolean;
}

export type ScanMode = 'all' | 'qr-only' | 'barcode-only';

export interface ScanResult {
  /** Contenido decodificado */
  data: string;
  /** Formato detectado: QR_CODE, EAN_13, CODE_128, etc. */
  format: string;
  /** Tipo general del código */
  type: '2d' | '1d';
  /** Momento del escaneo */
  timestamp: Date;
}

export const FORMATS_2D: BarcodeFormat[] = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.AZTEC,
  BarcodeFormat.PDF_417,
];

export const FORMATS_1D: BarcodeFormat[] = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.RSS_14,
];

export const MODE_LABELS: Record<ScanMode, string> = {
  all: 'QR + Códigos de barras',
  'qr-only': 'Solo QR',
  'barcode-only': 'Solo códigos de barras',
};

export const MODE_HINT: Record<ScanMode, string> = {
  all: 'Apunta al código QR o de barras',
  'qr-only': 'Apunta al código QR',
  'barcode-only': 'Apunta al código de barras',
};

export const SCANNER_MODES = [
  {
    value: 'all' as ScanMode,
    label: 'Todos',
    icon: '<rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="10" width="2" height="2"/><rect x="13" y="10" width="2" height="2"/><rect x="9" y="13" width="2" height="2"/><rect x="13" y="13" width="2" height="2"/>',
  },
  {
    value: 'qr-only' as ScanMode,
    label: 'QR / 2D',
    icon: '<rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1" opacity="0.3"/>',
  },
  {
    value: 'barcode-only' as ScanMode,
    label: 'Barras',
    icon: '<rect x="1" y="2" width="2" height="12" rx="1"/><rect x="5" y="2" width="3" height="12" rx="1"/><rect x="10" y="2" width="2" height="12" rx="1"/><rect x="14" y="2" width="1" height="12" rx="1"/>',
  },
];
