import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { RecurringRule, ReminderOffset, Settings } from '../types';
import { TaxService } from './taxService';

export const CRONO_BILLS_CHANNEL_ID = 'crono_bills_alerts';
export const CRONO_DAILY_CHANNEL_ID = 'crono_daily_review';
export const CRONO_BUDGET_CHANNEL_ID = 'crono_budget_alerts';
export const CRONO_TASKS_CHANNEL_ID = 'crono_tasks_alerts';

export const DAILY_REVIEW_NOTIFICATION_ID = 2001;
export const TEST_NOTIFICATION_ID = 2002;
export const RECURRING_ID_MIN = 10000;
export const RECURRING_ID_MAX = 899999;
export const TAX_NOTIFICATION_BASE_ID = 900000;

export function offsetToDays(offset: ReminderOffset): number {
  switch (offset) {
    case 'same_day':
      return 0;
    case '1_day':
      return 1;
    case '3_days':
      return 3;
    case '1_week':
      return 7;
    case '2_weeks':
      return 14;
    case '1_month':
      return 30;
    case '1_quarter':
      return 90;
    default:
      return 0;
  }
}

export function offsetToLabel(offset: ReminderOffset): string {
  switch (offset) {
    case 'same_day':
      return 'hoy';
    case '1_day':
      return '1 día';
    case '3_days':
      return '3 días';
    case '1_week':
      return '1 semana';
    case '2_weeks':
      return '2 semanas';
    case '1_month':
      return '1 mes';
    case '1_quarter':
      return '1 trimestre (90 días)';
    default:
      return 'unos días';
  }
}

export function getNotificationId(key: string, suffix: string = ''): number {
  const str = `${key}_${suffix}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return RECURRING_ID_MIN + Math.abs(hash % (RECURRING_ID_MAX - RECURRING_ID_MIN));
}

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
        description: 'Avisos previos y alertas el día del cargo de facturas y seguros',
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

      // 4. Canal para tareas periódicas, salud y recordatorios preventivos
      await LocalNotifications.createChannel({
        id: CRONO_TASKS_CHANNEL_ID,
        name: 'Tareas, Salud y Recordatorios Preventivos',
        description: 'Avisos escalonados para lentillas, vacunas, mantenimientos, citas y actos recurrentes',
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
  static async init(onAction?: (actionType: string, extra?: Record<string, any>) => void): Promise<void> {
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
          onAction(actionType, action.notification.extra);
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
   * Calcula la próxima fecha de ocurrencia del evento según su frecuencia y configuración
   */
  static computeNextOccurrence(rule: RecurringRule, fromDate = new Date()): Date {
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth(); // 0-11
    const dayOfMonth = Math.min(Math.max(1, rule.dayOfMonth || 1), 28);
    const [hourStr, minStr] = (rule.reminderTime || '09:00').split(':');
    const hour = parseInt(hourStr || '9', 10);
    const minute = parseInt(minStr || '0', 10);

    if (rule.frequency === 'yearly') {
      const monthOfYear = rule.monthOfYear || (rule.startDate ? new Date(rule.startDate).getMonth() + 1 : 1);
      let target = new Date(year, monthOfYear - 1, dayOfMonth, hour, minute, 0, 0);
      if (target.getTime() <= fromDate.getTime()) {
        target = new Date(year + 1, monthOfYear - 1, dayOfMonth, hour, minute, 0, 0);
      }
      return target;
    }

    if (rule.frequency === 'quarterly') {
      const startM = rule.startDate ? new Date(rule.startDate).getMonth() : 0;
      for (let offsetMonths = 0; offsetMonths <= 12; offsetMonths++) {
        const checkM = (month + offsetMonths);
        if (Math.abs(checkM - startM) % 3 === 0) {
          const target = new Date(year, checkM, dayOfMonth, hour, minute, 0, 0);
          if (target.getTime() > fromDate.getTime()) {
            return target;
          }
        }
      }
    }

    if (rule.frequency === 'weekly') {
      const targetDayOfWeek = rule.dayOfWeek ?? (rule.startDate ? new Date(rule.startDate).getDay() : 1);
      const currentDayOfWeek = fromDate.getDay();
      let diff = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
      if (diff === 0) {
        const candidateToday = new Date(year, month, fromDate.getDate(), hour, minute, 0, 0);
        if (candidateToday.getTime() <= fromDate.getTime()) {
          diff = 7;
        }
      }
      const target = new Date(year, month, fromDate.getDate() + diff, hour, minute, 0, 0);
      return target;
    }

    // Default: 'monthly'
    let target = new Date(year, month, dayOfMonth, hour, minute, 0, 0);
    if (target.getTime() <= fromDate.getTime()) {
      target = new Date(year, month + 1, dayOfMonth, hour, minute, 0, 0);
    }
    return target;
  }

  /**
   * Programa avisos escalonados para actos y tareas recurrentes (mismo día, 1 día, 3 días, 1 semana, 1 mes, 1 trimestre)
   */
  static async scheduleRecurringBillReminders(rules: RecurringRule[]): Promise<number> {
    if (!Capacitor.isNativePlatform()) return 0;

    try {
      const perm = await this.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await this.requestPermissions();
        if (req.display !== 'granted') return 0;
      }

      // Cancelar notificaciones previas en el rango gestionado
      const pending = await LocalNotifications.getPending();
      const recurringPendingIds = pending.notifications
        .filter((n) => (n.id >= RECURRING_ID_MIN && n.id <= RECURRING_ID_MAX) || (n.id >= 3000 && n.id < 5000))
        .map((n) => ({ id: n.id }));

      if (recurringPendingIds.length > 0) {
        await LocalNotifications.cancel({ notifications: recurringPendingIds });
      }

      const activeRules = rules.filter((r) => r.isActive !== false);
      const notificationsToSchedule = [];
      const now = new Date();
      const maxWindowTime = now.getTime() + 90 * 24 * 60 * 60 * 1000; // Ventana de 90 días

      let scheduledCount = 0;

      for (const rule of activeRules) {
        const nextOccurrence = this.computeNextOccurrence(rule, now);
        const offsets: ReminderOffset[] = rule.reminderOffsets && rule.reminderOffsets.length > 0
          ? rule.reminderOffsets
          : ['3_days', 'same_day'];

        const isTaskWithoutCost = rule.costType === 'none' || !rule.amount || rule.amount <= 0;
        const isEstimatedCost = rule.costType === 'estimated';
        const isHealthOrMaintenance = rule.categoryType === 'health' || rule.categoryType === 'maintenance' || rule.categoryType === 'personal';
        const channelId = isTaskWithoutCost || isHealthOrMaintenance ? CRONO_TASKS_CHANNEL_ID : CRONO_BILLS_CHANNEL_ID;

        const [hourStr, minStr] = (rule.reminderTime || '09:00').split(':');
        const hour = parseInt(hourStr || '9', 10);
        const minute = parseInt(minStr || '0', 10);

        for (const offset of offsets) {
          const daysBefore = offsetToDays(offset);
          const triggerDate = new Date(nextOccurrence);
          triggerDate.setDate(triggerDate.getDate() - daysBefore);
          triggerDate.setHours(hour, minute, 0, 0);

          // Solo agendar si es en el futuro y dentro de la ventana de 90 días
          if (triggerDate.getTime() > now.getTime() && triggerDate.getTime() <= maxWindowTime) {
            const notifId = getNotificationId(rule.id, offset);
            const formattedDate = nextOccurrence.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
            });

            let title = '';
            let body = '';

            if (offset === 'same_day') {
              if (isTaskWithoutCost) {
                title = `🩺 Tarea Hoy: ${rule.title}`;
                body = `Hoy toca: ${rule.title}. Pulsa para marcarla como realizada o registrarla.`;
              } else if (isEstimatedCost) {
                title = `⚖️ Cargo Estimado Hoy: ${rule.title}`;
                body = `Coste estimado: ${rule.amount.toFixed(2)} €. Pulsa para confirmar o actualizar el importe real cobrado.`;
              } else {
                title = `💳 Cargo Hoy: ${rule.title}`;
                body = `Hoy se cobra tu recibo de ${rule.amount.toFixed(2)} €. Saldo proyectado listo en tu bolsa.`;
              }
            } else {
              const leadStr = offsetToLabel(offset);
              if (isTaskWithoutCost) {
                title = `🔔 En ${leadStr} toca: ${rule.title}`;
                body = `Recordatorio preventivo: programado para el ${formattedDate}. Prepárate con tiempo.`;
              } else if (isEstimatedCost) {
                title = `🔔 En ${leadStr} vence: ${rule.title}`;
                body = `Gasto estimado de ${rule.amount.toFixed(2)} € para el ${formattedDate}. Prevé tu saldo en CronoCash.`;
              } else {
                title = `🔔 En ${leadStr} vence: ${rule.title}`;
                body = `Recibo previsto de ${rule.amount.toFixed(2)} € para el ${formattedDate}. Saldo en tu bolsa.`;
              }
            }

            notificationsToSchedule.push({
              id: notifId,
              title,
              body,
              channelId,
              schedule: {
                at: triggerDate,
                allowWhileIdle: true,
              },
              extra: {
                action: 'confirm_recurring',
                ruleId: rule.id,
                offset,
                costType: rule.costType || (rule.amount > 0 ? 'fixed' : 'none'),
                dueDate: nextOccurrence.toISOString().split('T')[0],
              },
              smallIcon: 'ic_launcher',
              sound: 'default',
            });
            scheduledCount++;
          }
        }
      }

      if (notificationsToSchedule.length > 0) {
        await this.ensureChannels();
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }

      return scheduledCount;
    } catch (e) {
      console.error('[NotificationService] Error al programar avisos escalonados de tareas/facturas:', e);
      return 0;
    }
  }

  /**
   * Programa avisos para las fechas límite de liquidación tributaria (Modelos 130 y 303 AEAT)
   */
  static async scheduleTaxDeadlines(): Promise<number> {
    if (!Capacitor.isNativePlatform()) return 0;

    try {
      const now = new Date();
      const deadlines = TaxService.getAllUpcomingTaxDeadlines(now);
      const notificationsToSchedule = [];

      for (const item of deadlines) {
        const deadlineDate = new Date(`${item.deadlineDate}T09:00:00`);
        if (deadlineDate.getTime() <= now.getTime()) continue;

        const offsets: Array<{ offset: ReminderOffset; days: number }> = [
          { offset: '1_month', days: 30 },
          { offset: '1_week', days: 7 },
          { offset: 'same_day', days: 0 },
        ];

        for (const { offset, days } of offsets) {
          const trigger = new Date(deadlineDate);
          trigger.setDate(trigger.getDate() - days);
          trigger.setHours(9, 0, 0, 0);

          if (trigger.getTime() > now.getTime() && trigger.getTime() <= now.getTime() + 90 * 86400000) {
            const notifId = getNotificationId(`tax_${item.quarter}_${item.year}`, offset);
            const leadStr = offsetToLabel(offset);
            const title = offset === 'same_day'
              ? `🏛️ Plazo Fiscal Hoy: ${item.name}`
              : `🏛️ En ${leadStr}: Plazo ${item.name}`;

            const body = offset === 'same_day'
              ? `Hoy concluye el plazo voluntario oficial en la AEAT para el T${item.quarter} ${item.year}.`
              : `Fecha límite de presentación: ${item.deadlineDate}. Revisa tus deducciones e IVA en CronoCash.`;

            notificationsToSchedule.push({
              id: notifId,
              title,
              body,
              channelId: CRONO_BILLS_CHANNEL_ID,
              schedule: {
                at: trigger,
                allowWhileIdle: true,
              },
              extra: {
                action: 'open_taxes',
                quarter: item.quarter,
                year: item.year,
              },
              smallIcon: 'ic_launcher',
              sound: 'default',
            });
          }
        }
      }

      if (notificationsToSchedule.length > 0) {
        await this.ensureChannels();
        await LocalNotifications.schedule({ notifications: notificationsToSchedule });
      }

      return notificationsToSchedule.length;
    } catch (e) {
      console.warn('[NotificationService] Error al programar plazos fiscales:', e);
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
      this.scheduleTaxDeadlines(),
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
            body: 'Las alarmas exactas y avisos escalonados funcionan a la perfección en tu móvil Android.',
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
