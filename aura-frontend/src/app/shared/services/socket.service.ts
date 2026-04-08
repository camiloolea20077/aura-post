import { effect, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StateStore } from '../../core/store/state';
import { GpsService } from '../../core/services/gps.service';

export type MonitorRole = 'provider' | 'viewer';

export interface MonitorLocation {
  lat: number;
  lng: number;
}

export interface MonitorData {
  location?: MonitorLocation;
  status?: string;
  battery?: string;
  [key: string]: any;
}

export interface MonitorMessage {
  type: 'full_state' | 'update' | 'connect' | 'disconnect';
  providerId?: string;
  data?: any;
}

/**
 * 
 * @example Uso para un Observador:
 * ```ts
  this.socketService.messages$.subscribe(msg => {
    if (msg.type === 'update') {
      // Actualizar UI con msg.data
    }
  });
 * ```
 * @example Uso para un Proveedor:
 * ```ts
  this.socketService.connectMonitor('provider', 'mi-id-123');
  this.socketService.startReportingSimulation('mi-id-123', 4.6097, -74.0817);
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private stateStore = inject(StateStore);
  private gpsService = inject(GpsService);
  private ws?: WebSocket;
  private reportingInterval?: any;
  private reconnectTimer?: any;

  private isManualDisconnect = false;
  private lastParams?: { role: MonitorRole; id?: string; monitorId: string };

  private messagesSubject = new Subject<MonitorMessage>();
  public messages$ = this.messagesSubject.asObservable();

  public connected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    effect(() => {
      const role = this.stateStore.role();
      const usuarioId = this.stateStore.usuarioId();
      this.initAutoConnect(role, usuarioId ?? 0);
    });
  }

  /**
   * Inicializa la escucha de cambios de estado para auto-conectar al VENDEDOR.
   */
  private initAutoConnect(role: string, usuarioId: number): void {
    if (role === 'VENDEDOR' && usuarioId) {
      this.connectMonitor('provider', usuarioId.toString(), role);
      this.startAutomaticReporting();
    } else {
      if (!this.isManualDisconnect && this.ws) {
        this.disconnect();
      }
    }
  }

  /**
   * Conecta al monitor con un rol específico.
   * @param role 'provider' o 'viewer'
   * @param id ID obligatorio para providers
   * @param monitorId ID del monitor (opcional, por defecto 'default')
   */
  connectMonitor(
    role: MonitorRole,
    id?: string,
    monitorId: string = 'default',
  ): void {
    // Si ya existe una conexión con los mismos parámetros y está abierta, no hacemos nada
    if (
      this.ws &&
      this.ws.readyState === WebSocket.OPEN &&
      this.lastParams?.role === role &&
      this.lastParams?.id === id &&
      this.lastParams?.monitorId === monitorId
    ) {
      return;
    }

    this.isManualDisconnect = false;
    this.lastParams = { role, id, monitorId };

    if (this.ws) {
      this.ws.close();
    }

    // Construcción de la URL dinámica
    const baseUrl = environment.socketUrl.replace(/\/$/, ''); // Quitar barra final si existe
    let url = `${baseUrl}/monitor?role=${role}&monitorId=${monitorId}`;

    if (role === 'provider' && id) {
      url += `&id=${id}`;
    }

    this.ws = new WebSocket(url);
    this.handleWsLifecycle();
  }

  private handleWsLifecycle(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Monitor WebSocket connected');
      this.connected$.next(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: MonitorMessage = JSON.parse(event.data);
        this.messagesSubject.next(msg);
      } catch (err) {
        console.warn('Error parsing monitor message:', event.data);
      }
    };

    this.ws.onclose = () => {
      console.log('Monitor WebSocket disconnected');
      this.connected$.next(false);
      this.stopReporting();

      if (!this.isManualDisconnect) {
        this.reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('Monitor WebSocket error:', error);
      this.connected$.next(false);
    };
  }

  /**
   * Envía una actualización desde el proveedor.
   */
  sendProviderUpdate(data: MonitorData): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ data }));
    }
  }

  /**
   * Inicia un reporte periódico simulado (como en el snippet).
   */
  startReportingSimulation(
    id: string,
    initialLat: number,
    initialLng: number,
  ): void {
    this.stopReporting();

    let lat = initialLat;
    let lng = initialLng;

    this.reportingInterval = setInterval(() => {
      if (this.connected$.value) {
        // Simular pequeños movimientos
        lat += (Math.random() - 0.5) * 0.001;
        lng += (Math.random() - 0.5) * 0.001;

        const data: MonitorData = {
          location: { lat, lng },
          status: 'Activo (Simulado)',
          battery: Math.floor(Math.random() * 100) + '%',
        };

        this.sendProviderUpdate(data);
      }
    }, 3000);
  }

  /**
   * Inicia el reporte automático usando el servicio de GPS real.
   */
  async startAutomaticReporting(): Promise<void> {
    if (this.reportingInterval) return;

    this.reportingInterval = setInterval(async () => {
      if (this.connected$.value) {
        try {
          const location = await this.gpsService.getCurrentPosition();
          if (location) {
            this.sendProviderUpdate({
              location: { lat: location.latitud, lng: location.longitud },
              status: 'Reporte automático GPS',
              battery: 'N/A', // Opcional: se podría integrar un servicio de batería
            });
          }
        } catch (err) {
          console.error('Error in automatic reporting:', err);
        }
      }
    }, 10000); // 10 segundos
  }

  stopReporting(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = undefined;
    }
  }

  private reconnect(): void {
    if (this.reconnectTimer) return;

    console.log('Attempting to reconnect in 5s...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      if (this.lastParams && !this.isManualDisconnect) {
        this.connectMonitor(
          this.lastParams.role,
          this.lastParams.id,
          this.lastParams.monitorId,
        );
      }
    }, 5000);
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.stopReporting();
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  /**
   * Método genérico para enviar mensajes (mantenido por compatibilidad)
   */
  sendMessage(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }
}
