import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { DBService } from './db';

class HapticServiceImpl {
  private _enabled: boolean = true;
  private _initialized: boolean = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (this._initialized) return;
    try {
      const settings = DBService.getSettings();
      this._enabled = settings.hapticsEnabled ?? true;
      this._initialized = true;
    } catch {
      this._enabled = true;
    }
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  /**
   * Impacto táctil ligero (ej: toques de botones, cambio de tabs, selector numérico)
   */
  public async impactLight(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    }
  }

  /**
   * Impacto táctil medio (ej: abrir modales, registrar un pago, deslizar límites)
   */
  public async impactMedium(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(35);
      }
    }
  }

  /**
   * Impacto táctil intenso (ej: eliminar registros, bloqueos o reequilibrios drásticos)
   */
  public async impactHeavy(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(55);
      }
    }
  }

  /**
   * Confirmación positiva (ej: guardado con éxito, meta completada, backup restaurado)
   */
  public async notificationSuccess(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([25, 40, 25]);
      }
    }
  }

  /**
   * Advertencia táctil (ej: sobrecoste de bolsa, aproximación a límite)
   */
  public async notificationWarning(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 50, 40]);
      }
    }
  }

  /**
   * Error o acción no permitida (ej: PIN erróneo, validación fallida)
   */
  public async notificationError(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 60, 50]);
      }
    }
  }

  /**
   * Selección de elementos de lista o dropdowns
   */
  public async selection(): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }
  }

  /**
   * Vibración personalizada por duración
   */
  public async vibrate(durationMs: number = 200): Promise<void> {
    if (!this._enabled) return;
    try {
      await Haptics.vibrate({ duration: durationMs });
    } catch {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(durationMs);
      }
    }
  }
}

export const HapticService = new HapticServiceImpl();
