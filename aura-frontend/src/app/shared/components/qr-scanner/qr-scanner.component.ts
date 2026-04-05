import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  QrScannerService,
  QrScanResult,
} from '../../services/qr.scanner.service';
import {
  MODE_HINT,
  MODE_LABELS,
  QrScannerConfig,
  ScanMode,
  SCANNER_MODES,
  ScannerState,
  ScannerTheme,
  ScanResult,
} from '../../interfaces';

/**
 * Componente para escanear códigos QR
 * 
 * @example
 * ```html
   <app-qr-scanner (scanned)="onScanned($event)"></app-qr-scanner>
 * ```
 * 
 * @example con titulo y configuracion
 * ```html
 * <app-qr-scanner
    title="Lector de tickets"
    [config]="scannerConfig"
    (scanned)="onScanned($event)"
    (stateChange)="onStateChange($event)"
    (scanError)="onError($event)"
    [scanMode]="'all'"
    [theme]="'dark'"
    (themeChange)="onThemeChange($event)"
    />
 * ```
 * 
 * @example
 * ```typescript
 *    onScanned(result: QrScanResult) {
 *   console.log(result.data); // URL, texto, etc.
 *   console.log(result.timestamp); // Fecha y hora del escaneo
 *   console.log(result.location); // Posición del escaneo
 * }
 * ```
 */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-scanner.component.html',
  styleUrl: './qr-scanner.component.scss',
})
export class QrScannerComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('videoElement') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() title = 'Escaner';
  @Input() config: QrScannerConfig = {};
  @Input() scanMode: ScanMode = 'all';
  @Input() showModeSelector = true;
  @Input() showResult = true;
  /**
   * Tema visual del componente.
   * - 'dark'  → fondo oscuro (default)
   * - 'light' → fondo claro
   * - 'auto'  → sigue la preferencia dark/light del sistema operativo
   */
  @Input() theme: ScannerTheme = 'auto';

  @Output() scanned = new EventEmitter<ScanResult>();
  @Output() scannedRaw = new EventEmitter<ScanResult>();
  @Output() stateChange = new EventEmitter<ScannerState>();
  @Output() scanError = new EventEmitter<string>();
  /** Emite cuando el usuario cambia el tema desde el botón interno */
  @Output() themeChange = new EventEmitter<ScannerTheme>();

  state: ScannerState = 'idle';
  lastResult: ScanResult | null = null;
  errorMessage = '';
  copied = false;

  readonly modes = SCANNER_MODES;

  get modeLabelText(): string {
    return MODE_LABELS[this.scanMode];
  }
  get modeHintText(): string {
    return MODE_HINT[this.scanMode];
  }

  /** Clase CSS aplicada al wrapper según el tema activo */
  get themeClass(): string {
    return `theme-${this.theme}`;
  }

  /**
   * Tema efectivo resuelto: cuando es 'auto', detecta la preferencia del SO.
   * Se usa solo para mostrar el icono correcto en el botón toggle.
   */
  get effectiveTheme(): 'dark' | 'light' {
    if (this.theme !== 'auto') return this.theme;
    return window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  get themeToggleTitle(): string {
    const map: Record<ScannerTheme, string> = {
      dark: 'Cambiar a tema claro',
      light: 'Cambiar a tema oscuro',
      auto: 'Tema automatico (sistema)',
    };
    return map[this.theme];
  }

  /** Cicla entre dark → light → dark (omite 'auto', que se controla desde fuera) */
  cycleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.themeChange.emit(this.theme);
    this.cdr.markForCheck();
  }

  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private lastScannedData = '';
  private facingMode: 'environment' | 'user' = 'environment';

  constructor(
    private qrService: QrScannerService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.facingMode = this.config.facingMode ?? 'environment';
    this.qrService.init(this.scanMode);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scanMode'] && !changes['scanMode'].firstChange) {
      this.qrService.init(this.scanMode);
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
    this.qrService.destroy();
  }

  get stateLabel(): string {
    const labels: Record<ScannerState, string> = {
      idle: 'Listo',
      requesting: 'Iniciando',
      scanning: 'Escaneando',
      error: 'Error',
      stopped: 'Completado',
    };
    return labels[this.state];
  }

  setScanMode(mode: ScanMode): void {
    this.scanMode = mode;
    this.qrService.init(mode);
    this.cdr.markForCheck();
  }

  async startScanning(): Promise<void> {
    this.setState('requesting');
    this.lastResult = null;
    this.lastScannedData = '';
    this.stopStream();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: this.config.width ?? 1280 },
          height: { ideal: this.config.height ?? 720 },
        },
      });
      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.setState('scanning');
      this.ngZone.runOutsideAngular(() => this.tick());
    } catch (err: any) {
      const msg = this.parseError(err);
      this.errorMessage = msg;
      this.setState('error');
      this.scanError.emit(msg);
    }
  }

  stopScanning(): void {
    this.stopStream();
    if (this.state === 'scanning') this.setState('stopped');
  }

  async toggleCamera(): Promise<void> {
    this.facingMode =
      this.facingMode === 'environment' ? 'user' : 'environment';
    await this.startScanning();
  }

  async copyResult(): Promise<void> {
    if (!this.lastResult) return;
    await navigator.clipboard.writeText(this.lastResult.data).catch(() => {});
    this.copied = true;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.copied = false;
      this.cdr.markForCheck();
    }, 2000);
  }

  openUrl(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  isUrl(text: string): boolean {
    return /^https?:\/\//i.test(text);
  }

  private tick(): void {
    if (this.state !== 'scanning') return;

    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas || video.readyState < 2) {
      this.animationFrameId = requestAnimationFrame(() => this.tick());
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const result = this.qrService.decode(canvas);

    if (result && result.data !== this.lastScannedData) {
      this.lastScannedData = result.data;
      this.ngZone.run(() => this.handleResult(result));
      return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  private handleResult(result: ScanResult): void {
    this.lastResult = result;
    this.scannedRaw.emit(result);
    this.scanned.emit(result);

    if (this.config.vibrate !== false && 'vibrate' in navigator) {
      navigator.vibrate(100);
    }

    if (this.config.stopOnFirstScan) {
      this.stopScanning();
    } else {
      setTimeout(() => {
        this.lastScannedData = '';
        if (this.state === 'scanning') {
          this.ngZone.runOutsideAngular(() => this.tick());
        }
      }, 2000);
    }
    this.cdr.markForCheck();
  }

  private stopStream(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.videoRef?.nativeElement)
      this.videoRef.nativeElement.srcObject = null;
  }

  private setState(s: ScannerState): void {
    this.state = s;
    this.stateChange.emit(s);
    this.cdr.markForCheck();
  }

  private parseError(err: any): string {
    const map: Record<string, string> = {
      NotAllowedError:
        'Permiso de camara denegado. Habilítalo en ajustes del navegador.',
      NotFoundError: 'No se encontro ninguna camara en el dispositivo.',
      NotReadableError: 'La camara esta en uso por otra aplicacion.',
      OverconstrainedError: 'La camara no cumple los requisitos solicitados.',
    };
    return map[err?.name] ?? 'Error al acceder a la camara. Intenta de nuevo.';
  }
}
