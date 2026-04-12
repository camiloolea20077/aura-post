# QR Scanner — Componente Angular Reutilizable

Componente standalone para leer códigos QR usando la cámara del dispositivo.
Compatible con **PC** (webcam) y **móviles** (cámara trasera/frontal).

---

## Instalación

```bash
npm install jsqr
```

---

## Uso básico

```html
<!-- app.component.html -->
<app-qr-scanner (scanned)="onScanned($event)" />
```

```ts
// app.component.ts
import { QrScannerComponent, QrScanResult } from './qr-scanner';

@Component({
  imports: [QrScannerComponent],
  ...
})
export class AppComponent {
  onScanned(result: QrScanResult) {
    console.log('QR detectado:', result.data);
    console.log('Hora:', result.timestamp);
    console.log('Posición:', result.location);
  }
}
```

---

## Con configuración personalizada

```html
<app-qr-scanner title="Lector de tickets" [config]="scannerConfig" (scanned)="onScanned($event)" (stateChange)="onStateChange($event)" (scanError)="onError($event)" />
```

```ts
import { QrScannerConfig, ScannerState } from "./qr-scanner";

export class MyComponent {
  scannerConfig: QrScannerConfig = {
    facingMode: "environment", // 'environment' | 'user'
    stopOnFirstScan: true, // Detener tras el primer QR
    vibrate: true, // Vibrar en móvil al detectar
    showOverlay: true, // Mostrar marco de escaneo
    width: 1280, // Resolución preferida
    height: 720,
  };

  onScanned(result: QrScanResult) {
    alert("Contenido: " + result.data);
  }

  onStateChange(state: ScannerState) {
    console.log("Estado:", state); // idle | requesting | scanning | error | stopped
  }

  onError(msg: string) {
    console.error("Error de cámara:", msg);
  }
}
```

---

## API

### Inputs

| Input    | Tipo              | Default        | Descripción                   |
| -------- | ----------------- | -------------- | ----------------------------- |
| `title`  | `string`          | `'Escáner QR'` | Título visible en la cabecera |
| `config` | `QrScannerConfig` | `{}`           | Opciones del escáner          |

### QrScannerConfig

| Propiedad         | Tipo                      | Default         | Descripción                          |
| ----------------- | ------------------------- | --------------- | ------------------------------------ |
| `facingMode`      | `'environment' \| 'user'` | `'environment'` | Cámara trasera o frontal             |
| `stopOnFirstScan` | `boolean`                 | `false`         | Detener al primer QR detectado       |
| `vibrate`         | `boolean`                 | `true`          | Vibrar en móvil al detectar QR       |
| `showOverlay`     | `boolean`                 | `true`          | Mostrar overlay con línea de escaneo |
| `width`           | `number`                  | `1280`          | Ancho preferido del stream de cámara |
| `height`          | `number`                  | `720`           | Alto preferido del stream de cámara  |

### Outputs

| Output        | Tipo                         | Descripción                                     |
| ------------- | ---------------------------- | ----------------------------------------------- |
| `scanned`     | `EventEmitter<QrScanResult>` | Emite cada QR único (sin duplicados inmediatos) |
| `scannedRaw`  | `EventEmitter<QrScanResult>` | Emite todos los QR (con posibles duplicados)    |
| `stateChange` | `EventEmitter<ScannerState>` | Emite cuando cambia el estado del escáner       |
| `scanError`   | `EventEmitter<string>`       | Emite mensajes de error de cámara               |

### QrScanResult

```ts
interface QrScanResult {
  data: string; // Contenido del QR (URL, texto, etc.)
  timestamp: Date; // Momento del escaneo
  location?: {
    // Coordenadas del QR en el frame
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}
```

### ScannerState

```ts
type ScannerState = "idle" | "requesting" | "scanning" | "error" | "stopped";
```

---

## Métodos públicos (vía ViewChild)

```ts
@ViewChild(QrScannerComponent) scanner!: QrScannerComponent;

this.scanner.startScanning();  // Iniciar cámara
this.scanner.stopScanning();   // Detener cámara
this.scanner.toggleCamera();   // Alternar cámara frontal/trasera
```

---

## Requisitos

- Angular 17+ (standalone components)
- `jsqr` npm package
- HTTPS en producción (requerido por la API de cámara)
- Permisos de cámara en el navegador

---
