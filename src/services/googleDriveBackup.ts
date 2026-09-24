import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DBService } from './db';
import { Expense, Bucket, RecurringRule, Settings, FinancialTip } from '../types';

export const DRIVE_SLOT_ACTUAL = 'CronoCash_Actual.json';
export const DRIVE_SLOT_PREVIA = 'CronoCash_Previa.json';
export const CURRENT_BACKUP_SCHEMA_VERSION = 2;

export interface BackupPackage {
  format: 'CRONOCASH_BACKUP';
  version: '1.5.0';
  slot?: 'actual' | 'previa';
  fileName: string;
  exportDate: string;
  exportDateMadrid: string;
  checksum: string;
  metadata: {
    expensesCount: number;
    bucketsCount: number;
    recurringRulesCount: number;
    tipsCount: number;
    totalHistoricalSpent: number;
    latestExpenseDate: string;
    latestExpenseRaw: string | null;
    settingsIncluded: boolean;
    schemaVersion: number;
  };
  data: {
    expenses: Expense[];
    buckets: Bucket[];
    recurringRules: RecurringRule[];
    settings?: Settings;
    tips?: FinancialTip[];
    [key: string]: any;
  };
}

export interface BackupInspectionResult {
  isValid: boolean;
  error?: string;
  slot?: 'actual' | 'previa';
  fileNameSuggested: string;
  expensesCount: number;
  bucketsCount: number;
  recurringRulesCount: number;
  tipsCount: number;
  totalHistoricalSpent: number;
  latestExpenseDate: string;
  latestExpenseRaw: string | null;
  exportDate: string;
  exportDateMadrid: string;
  checksum: string;
  packageData?: BackupPackage | any;
}

export interface DatabaseCurrentStats {
  expensesCount: number;
  bucketsCount: number;
  recurringRulesCount: number;
  tipsCount: number;
  totalHistoricalSpent: number;
  latestExpenseDate: string;
  latestExpenseRaw: string | null;
  lastBackupDate?: string;
}

export class GoogleDriveBackupService {
  /**
   * Genera una cadena con fecha y hora en zona horaria Madrid (Europa/Madrid)
   */
  static formatMadridDateTime(isoOrDate?: string | Date | null): string {
    if (!isoOrDate) return 'Desconocida';
    try {
      const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
      if (isNaN(date.getTime())) return String(isoOrDate);

      return new Intl.DateTimeFormat('es-ES', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return String(isoOrDate);
    }
  }

  /**
   * Genera un checksum determinista simple para verificar la integridad del archivo JSON
   */
  static generateChecksum(dataStr: string): string {
    let hash = 0;
    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Extrae la fecha del gasto más reciente
   */
  static extractLatestExpense(expenses: Expense[]): { formattedMadrid: string; raw: string | null } {
    if (!Array.isArray(expenses) || expenses.length === 0) {
      return { formattedMadrid: 'Sin gastos registrados', raw: null };
    }
    const valid = expenses.filter((e) => e && e.date);
    if (valid.length === 0) {
      return { formattedMadrid: 'Sin gastos registrados', raw: null };
    }
    const sorted = [...valid].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0];
    const raw = latest.date;
    return {
      formattedMadrid: this.formatMadridDateTime(raw),
      raw,
    };
  }

  /**
   * Obtiene las métricas actuales del teléfono para la comparativa previa a restaurar
   */
  static async getCurrentStats(): Promise<DatabaseCurrentStats> {
    const [expenses, buckets, recurringRules, tips] = await Promise.all([
      DBService.getExpenses(),
      DBService.getBuckets(),
      DBService.getRecurringRules(),
      DBService.getTips(),
    ]);

    const latest = this.extractLatestExpense(expenses);
    const totalHistoricalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const lastBackupDate = typeof localStorage !== 'undefined'
      ? localStorage.getItem('cronocash_last_backup_date') || undefined
      : undefined;

    return {
      expensesCount: expenses.length,
      bucketsCount: buckets.length,
      recurringRulesCount: recurringRules.length,
      tipsCount: tips.length,
      totalHistoricalSpent,
      latestExpenseDate: latest.formattedMadrid,
      latestExpenseRaw: latest.raw,
      lastBackupDate,
    };
  }

  /**
   * Genera el paquete estructurado y validado con 2 ranuras canónicas para Google Drive
   */
  static async createBackupPayload(slot: 'actual' | 'previa' = 'actual'): Promise<BackupPackage> {
    const [expenses, buckets, recurringRules, tips] = await Promise.all([
      DBService.getExpenses(),
      DBService.getBuckets(),
      DBService.getRecurringRules(),
      DBService.getTips(),
    ]);

    const settings = DBService.getSettings();
    const latest = this.extractLatestExpense(expenses);
    const totalHistoricalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const nowIso = new Date().toISOString();
    const nowMadrid = this.formatMadridDateTime(nowIso);
    const fileName = slot === 'actual' ? DRIVE_SLOT_ACTUAL : DRIVE_SLOT_PREVIA;

    const dataBlock = {
      expenses,
      buckets,
      recurringRules,
      settings,
      tips,
    };

    const checksum = this.generateChecksum(JSON.stringify(dataBlock));

    return {
      format: 'CRONOCASH_BACKUP',
      version: '1.5.0',
      slot,
      fileName,
      exportDate: nowIso,
      exportDateMadrid: nowMadrid,
      checksum,
      metadata: {
        expensesCount: expenses.length,
        bucketsCount: buckets.length,
        recurringRulesCount: recurringRules.length,
        tipsCount: tips.length,
        totalHistoricalSpent,
        latestExpenseDate: latest.formattedMadrid,
        latestExpenseRaw: latest.raw,
        settingsIncluded: Boolean(settings),
        schemaVersion: CURRENT_BACKUP_SCHEMA_VERSION,
      },
      data: dataBlock,
    };
  }

  /**
   * Exporta y comparte el archivo a través del Storage Access Framework (SAF) de Android
   * permitiendo al usuario guardarlo en Google Drive, enviarlo o guardarlo localmente.
   */
  static async exportOrShareFile(
    fileName: string,
    content: string,
    title: string,
    dialogTitle: string
  ): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await Share.share({
          title,
          text: `Copia de Seguridad CronoCash: ${fileName}`,
          url: fileResult.uri,
          dialogTitle,
        });

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cronocash_last_backup_date', new Date().toISOString());
        }
        return true;
      } else {
        // En navegador Web (fallback Blob)
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('cronocash_last_backup_date', new Date().toISOString());
        }
        return true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      throw new Error(`No se pudo generar o compartir el archivo: ${err?.message || 'Error'}`);
    }
  }

  /**
   * Inspecciona exhaustivamente un archivo de respaldo antes de restaurarlo,
   * extrayendo sus estadísticas y verificando su integridad.
   */
  static inspectBackupFile(jsonStr: string): BackupInspectionResult {
    const emptyResult = (error: string): BackupInspectionResult => ({
      isValid: false,
      error,
      fileNameSuggested: DRIVE_SLOT_ACTUAL,
      expensesCount: 0,
      bucketsCount: 0,
      recurringRulesCount: 0,
      tipsCount: 0,
      totalHistoricalSpent: 0,
      latestExpenseDate: 'Desconocida',
      latestExpenseRaw: null,
      exportDate: '',
      exportDateMadrid: 'Desconocida',
      checksum: '',
    });

    try {
      if (!jsonStr || typeof jsonStr !== 'string' || !jsonStr.trim()) {
        return emptyResult('El archivo seleccionado está vacío.');
      }

      const parsed = JSON.parse(jsonStr);

      // Formato v1.5.0 con Envelope y Metadata
      if (parsed.format === 'CRONOCASH_BACKUP' && parsed.data) {
        const expenses: Expense[] = Array.isArray(parsed.data.expenses) ? parsed.data.expenses : [];
        const buckets: Bucket[] = Array.isArray(parsed.data.buckets) ? parsed.data.buckets : [];
        const recurringRules: RecurringRule[] = Array.isArray(parsed.data.recurringRules) ? parsed.data.recurringRules : [];
        const tips: FinancialTip[] = Array.isArray(parsed.data.tips) ? parsed.data.tips : [];

        const latest = this.extractLatestExpense(expenses);
        const totalHistoricalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const exportDate = parsed.exportDate || '';
        const exportDateMadrid = parsed.exportDateMadrid || this.formatMadridDateTime(exportDate);

        return {
          isValid: true,
          slot: parsed.slot,
          fileNameSuggested: parsed.fileName || (parsed.slot === 'previa' ? DRIVE_SLOT_PREVIA : DRIVE_SLOT_ACTUAL),
          expensesCount: expenses.length,
          bucketsCount: buckets.length,
          recurringRulesCount: recurringRules.length,
          tipsCount: tips.length,
          totalHistoricalSpent,
          latestExpenseDate: latest.formattedMadrid,
          latestExpenseRaw: latest.raw,
          exportDate,
          exportDateMadrid,
          checksum: parsed.checksum || '',
          packageData: parsed,
        };
      }

      // Formato v1.0.0 (BackupEnvelope estándar)
      if (parsed.expenses && (parsed.buckets || parsed.recurringRules)) {
        const expenses: Expense[] = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        const buckets: Bucket[] = Array.isArray(parsed.buckets) ? parsed.buckets : [];
        const recurringRules: RecurringRule[] = Array.isArray(parsed.recurringRules) ? parsed.recurringRules : [];
        const tips: FinancialTip[] = Array.isArray(parsed.tips) ? parsed.tips : [];

        const latest = this.extractLatestExpense(expenses);
        const totalHistoricalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const exportDate = parsed.exportedAt || '';
        const exportDateMadrid = this.formatMadridDateTime(exportDate);

        return {
          isValid: true,
          fileNameSuggested: DRIVE_SLOT_ACTUAL,
          expensesCount: expenses.length,
          bucketsCount: buckets.length,
          recurringRulesCount: recurringRules.length,
          tipsCount: tips.length,
          totalHistoricalSpent,
          latestExpenseDate: latest.formattedMadrid,
          latestExpenseRaw: latest.raw,
          exportDate,
          exportDateMadrid,
          checksum: this.generateChecksum(JSON.stringify(parsed)),
          packageData: { data: parsed },
        };
      }

      return emptyResult('El archivo no posee la estructura de base de datos de CronoCash.');
    } catch (e: any) {
      return emptyResult(`Error al parsear el archivo JSON: ${e?.message || 'Archivo dañado'}`);
    }
  }

  /**
   * Restaura la base de datos a partir de los datos inspeccionados
   */
  static async restoreBackup(
    jsonStr: string,
    mode: 'overwrite' | 'merge' = 'overwrite'
  ): Promise<{ success: boolean; message: string }> {
    const inspection = this.inspectBackupFile(jsonStr);
    if (!inspection.isValid || !inspection.packageData) {
      return { success: false, message: inspection.error || 'Copia de seguridad no válida.' };
    }

    try {
      const rawData = inspection.packageData.data || inspection.packageData;
      const expenses: Expense[] = Array.isArray(rawData.expenses) ? rawData.expenses : [];
      const buckets: Bucket[] = Array.isArray(rawData.buckets) ? rawData.buckets : [];
      const recurringRules: RecurringRule[] = Array.isArray(rawData.recurringRules) ? rawData.recurringRules : [];
      const settings: Settings | undefined = rawData.settings;
      const tips: FinancialTip[] = Array.isArray(rawData.tips) ? rawData.tips : [];

      if (mode === 'overwrite') {
        await DBService.clearAndRestore({
          expenses,
          buckets,
          recurringRules,
          settings,
          tips,
        });
      } else {
        await DBService.mergeAndRestore({
          expenses,
          buckets,
          recurringRules,
          settings,
          tips,
        });
      }

      return {
        success: true,
        message: `Restauración completada con éxito: ${expenses.length} gastos, ${buckets.length} bolsas y ${recurringRules.length} reglas recurrentes cargadas.`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Error al restaurar la base de datos: ${e?.message || 'Error desconocido'}`,
      };
    }
  }
}
