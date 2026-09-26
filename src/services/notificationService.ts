import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { RecurringRule, Settings } from '../types';

export const CRONO_BILLS_CHANNEL_ID = 'crono_bills_alerts';
export const CRONO_DAILY_CHANNEL_ID = 'crono_daily_review';
export const CRONO_BUDGET_CHANNEL_ID = 'crono_budget_alerts';

export const DAILY_REVIEW_NOTIFICATION_ID = 2001;
export const TEST_NOTIFICATION_ID = 2002;
export const RECURRING_PRE_BASE_ID = 3000;
export const RECURRING_DAY_BASE_ID = 4000;

export class NotificationService {
  private static isInitialized = false;
  private static actionListenerRegistered = false;

  /**
   * Asegura que los canales nativos de alta prioridad existan en Android
   */
  static async ensureChannels(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // 1. Canal para vencimientos y facturas (Alta prioridad)
      await LocalNotifications.createChannel({
        id: CRONO_BILLS_CHANNEL_ID,
        name: 'Vencimientos y Facturas Recurrentes',
        description: 'Avisos previos (3 días antes) y alertas el día del cargo de facturas',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
      });

      // 2. Canal para revisión nocturna de gastos (Alta prioridad)
      await LocalNotifications.createChannel({
        id: CRONO_DAILY_CHANNEL_ID,
        name: 'Recordatorio Diario de Gastos',
        description: 'Aviso nocturno para asentar compras y gastos diarios pendientes',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
      });

      // 3. Canal para alertas de presupuesto y bolsas
      await LocalNotifications.createChannel({
        id: CRONO_BUDGET_CHANNEL_ID,
        name: 'Control de Bolsas de Presupuesto',
        description: 'Alertas cuando una bolsa supera el 85% o el 100% de su límite',
        importance: 4, // HIGH
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
      });
    } catch (e) {
      console.warn('[NotificationService] Error al crear canales de notificación:', e);
    }
  }

  /**
   * Inicializa canales de Android y oyente de acciones interactivas
   */
  static async init(onAction?: (actionType: string) => void): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await this.ensureChannels();

      // Registrar oyente al pulsar una notificación
      if (onAction && !this.actionListenerRegistered) {
        this.actionListenerRegistered = true;
        await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const actionType = action.notification.extra?.action || 'open_app';
          onAction(actionType);
        });
      }
    } catch (e) {
      console.warn('[NotificationService] Error al inicializar servicio de notificaciones:', e);
    }
  }

  /**
   * Verifica permisos de notificación (Android 13+ y Web)
   */
  static async checkPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = window.Notification.permission;
        const display = perm === 'granted' ? 'granted' : perm === 'denied' ? 'denied' : 'prompt';
        return { display };
      }
      return { display: 'granted' };
    }

    try {
      return await LocalNotifications.checkPermissions();
    } catch (e) {
      console.warn('[NotificationService] Error al comprobar permisos:', e);
      return { display: 'prompt' };
    }
  }

  /**
   * Solicita permisos de notificación al usuario
   */
  static async requestPermissions(): Promise<PermissionStatus> {
    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        try {
          const res = await window.Notification.requestPermission();
          const display = res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'prompt';
          return { display };
        } catch {
          return { display: 'prompt' };
        }
      }
      return { display: 'granted' };
    }

    try {
      return await LocalNotifications.requestPermissions();
    } catch (e) {
      console.warn('[NotificationService] Error al solicitar permisos:', e);
      return { display: 'prompt' };
    }
  }

  /**
   * Calcula fecha próxima dado un string 'HH:MM'
   */
  static getNextScheduleTime(timeStr: string = '21:30'): { hour: number; minute: number; nextDate: Date } {
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0] || '21', 10);
    const minute = parseInt(parts[1] || '30', 10);

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // Si ya pasó la hora en el día de hoy, programar para mañana
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return { hour, minute, nextDate: target };
  }

  /**
   * Programa el recordatorio nocturno para registrar gastos diarios (21:30)
   */
  static async scheduleDailyReviewReminder(enabled: boolean, timeStr: string = '21:30'): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: DAILY_REVIEW_NOTIFICATION_ID }],
      });

      if (!enabled) return true;

      const perm = await this.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await this.requestPermissions();
        if (req.display !== 'granted') return false;
      }

      await this.ensureChannels();
      const { hour, minute } = this.getNextScheduleTime(timeStr);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: DAILY_REVIEW_NOTIFICATION_ID,
            title: '🌙 Cierre Diario — CronoCash',
            body: '¿Has realizado compras hoy? Revisa y registra tus tickets o gastos para mantener al día tus bolsas.',
            channelId: CRONO_DAILY_CHANNEL_ID,
            schedule: {
              on: { hour, minute },
              allowWhileIdle: true,
            },
            extra: {
              action: 'open_dashboard',
            },
            smallIcon: 'ic_launcher',
            sound: 'default',
          },
        ],
      });

      return true;
    } catch (e) {
      console.error('[NotificationService] Error al programar cierre diario:', e);
      return false;
    }
  }

  /**
   * Programa avisos escalonados para las facturas recurrentes activas:
   * 1. Aviso previo 3 días antes a las 09:30 AM
   * 2. Aviso el mismo día del cargo a las 09:00 AM
   */
  static async scheduleRecurringBillReminders(rules: RecurringRule[]): Promise<number> {
    if (!Capacitor.isNativePlatform()) return 0;

    try {
      const perm = await this.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await this.requestPermissions();
        if (req.display !== 'granted') return 0;
      }

      // Cancelar notificaciones de recurrentes anteriores
      const pending = await LocalNotifications.getPending();
      const recurringPendingIds = pending.notifications
        .filter((n) => n.id >= RECURRING_PRE_BASE_ID && n.id < 5000)
        .map((n) => ({ id: n.id }));

      if (recurringPendingIds.length > 0) {
        await LocalNotifications.cancel({ notifications: recurringPendingIds });
      }

      const activeRules = rules.filter((r) => r.isActive);
      const notificationsToSchedule = [];
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      let scheduledCount = 0;

      for (let i = 0; i < activeRules.length; i++) {
        const rule = activeRules[i];
        const dayOfMonth = Math.min(Math.max(1, rule.dayOfMonth || 1), 28);

        // Fecha de cobro en este mes o en el siguiente
        let billDate = new Date(currentYear, currentMonth, dayOfMonth, 9, 0, 0);
        if (billDate.getTime() < today.getTime()) {
          billDate = new Date(currentYear, currentMonth + 1, dayOfMonth, 9, 0, 0);
        }

        // 1. Alerta el mismo día del cargo a las 09:00
        notificationsToSchedule.push({
          id: RECURRING_DAY_BASE_ID + i,
          title: `💳 Cargo Hoy: ${rule.title}`,
          body: `Hoy se cobra tu recibo de ${rule.amount.toFixed(2)} €. Comprueba tu saldo proyectado en CronoCash.`,
          channelId: CRONO_BILLS_CHANNEL_ID,
          schedule: {
            at: billDate,
            allowWhileIdle: true,
          },
          extra: {
            action: 'open_recurring',
            ruleId: rule.id,
          },
          smallIcon: 'ic_launcher',
          sound: 'default',
        });
        scheduledCount++;

        // 2. Alerta pre-cobro 3 días antes a las 09:30 AM
        const preDate = new Date(billDate);
        preDate.setDate(preDate.getDate() - 3);
        preDate.setHours(9, 30, 0, 0);

        if (preDate.getTime() > today.getTime()) {
          notificationsToSchedule.push({
            id: RECURRING_PRE_BASE_ID + i,
            title: `🔔 En 3 días vence: ${rule.title}`,
            body: `Recibo previsto de ${rule.amount.toFixed(2)} €. Saldo proyectado listo en tu bolsa.`,
            channelId: CRONO_BILLS_CHANNEL_ID,
            schedule: {
              at: preDate,
              allowWhileIdle: true,
            },
            extra: {
              action: 'open_recurring',
              ruleId: rule.id,
            },
            smallIcon: 'ic_launcher',
            sound: 'default',
          });
          scheduledCount++;
        }
      }

      if (notificationsToSchedule.length > 0) {
        await this.ensureChannels();
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }

      return scheduledCount;
    } catch (e) {
      console.error('[NotificationService] Error al programar avisos de facturas:', e);
      return 0;
    }
  }

  /**
   * Sincroniza todos los recordatorios programados recurrentes según la configuración
   */
  static async syncAllScheduledReminders(settings: Settings, rules: RecurringRule[] = []): Promise<void> {
    const isDailyEnabled = settings.notificationsEnabled ?? true;
    const timeStr = settings.notificationHour || '21:30';
    await Promise.all([
      this.scheduleDailyReviewReminder(isDailyEnabled, timeStr),
      this.scheduleRecurringBillReminders(rules),
    ]);
  }

  /**
   * Lanza una notificación de prueba tras 3 segundos para validar el funcionamiento del motor de alarmas
   */
  static async sendTestNotification(delaySeconds: number = 3): Promise<boolean> {
    const fireDate = new Date(Date.now() + delaySeconds * 1000);

    if (!Capacitor.isNativePlatform()) {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        setTimeout(() => {
          new window.Notification('🔔 Prueba Exitosa — CronoCash', {
            body: 'El motor de notificaciones y recordatorios está activo y sincronizado correctamente.',
          });
        }, delaySeconds * 1000);
        return true;
      }
      alert('Notificación simulada: Las notificaciones nativas operan en tu móvil Android.');
      return true;
    }

    try {
      const perm = await this.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await this.requestPermissions();
        if (req.display !== 'granted') return false;
      }

      await this.ensureChannels();
      await LocalNotifications.schedule({
        notifications: [
          {
            id: TEST_NOTIFICATION_ID,
            title: '🔔 Prueba Exitosa — CronoCash',
            body: 'Las alarmas exactas y avisos de facturación funcionan a la perfección en tu móvil Android.',
            channelId: CRONO_BILLS_CHANNEL_ID,
            schedule: {
              at: fireDate,
              allowWhileIdle: true,
            },
            extra: {
              action: 'open_dashboard',
            },
            smallIcon: 'ic_launcher',
            sound: 'default',
          },
        ],
      });

      return true;
    } catch (e) {
      console.error('[NotificationService] Error al lanzar notificación de prueba:', e);
      return false;
    }
  }
}
