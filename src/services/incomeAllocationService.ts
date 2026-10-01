import { ExtraIncome, Settings, getIncomeEffectiveMonth } from '../types';

/**
 * Servicio desacoplado para la gestión y cálculo de ingresos asignados a bolsas
 * (Inyecciones de Presupuesto vs Reembolsos de Gastos).
 */
export class IncomeAllocationService {
  /**
   * Comprueba si un ingreso extra aplica a un mes específico ('YYYY-MM').
   */
  static isMatchingMonth(income: ExtraIncome, monthKey: string): boolean {
    if (!income || income.isActive === false) return false;

    // Ingresos puntuales: coinciden si el mes efectivo de imputación pertenece al mes
    if (income.type === 'punctual') {
      return getIncomeEffectiveMonth(income) === monthKey;
    }

    // Ingresos recurrentes
    if (income.type === 'recurring') {
      const incomeStartMonth = (income.date || '').substring(0, 7);
      if (incomeStartMonth && monthKey < incomeStartMonth) {
        return false; // El compromiso aún no había iniciado
      }

      if (income.frequency === 'yearly') {
        const parts = monthKey.split('-');
        const targetMonth = parseInt(parts[1], 10);
        const incomeMonth = income.date ? parseInt(income.date.split('-')[1], 10) : 1;
        return targetMonth === incomeMonth;
      }

      if (income.frequency === 'quarterly') {
        const parts = monthKey.split('-');
        const targetMonth = parseInt(parts[1], 10) - 1; // 0-11
        const startM = income.date ? parseInt(income.date.split('-')[1], 10) - 1 : 0;
        return Math.abs(targetMonth - startM) % 3 === 0;
      }

      // Por defecto mensual
      return true;
    }

    return false;
  }

  /**
   * Obtiene la suma total de suplementos/inyecciones de presupuesto ('bucket_budget')
   * destinados a una bolsa concreta en un mes específico.
   */
  static getBucketInjectedBudget(
    bucketId: string,
    monthKey: string,
    settings?: Settings
  ): number {
    if (!bucketId || !settings || !settings.extraIncomes) return 0;

    return settings.extraIncomes
      .filter(
        (inc) =>
          inc.isActive !== false &&
          inc.targetBucketId === bucketId &&
          inc.allocationMode === 'bucket_budget' &&
          this.isMatchingMonth(inc, monthKey)
      )
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  }

  /**
   * Obtiene la suma total de reembolsos/compensaciones de gasto ('bucket_refund')
   * destinados a minorar los costes de una bolsa concreta en un mes específico.
   */
  static getBucketRefunds(
    bucketId: string,
    monthKey: string,
    settings?: Settings
  ): number {
    if (!bucketId || !settings || !settings.extraIncomes) return 0;

    return settings.extraIncomes
      .filter(
        (inc) =>
          inc.isActive !== false &&
          inc.targetBucketId === bucketId &&
          inc.allocationMode === 'bucket_refund' &&
          this.isMatchingMonth(inc, monthKey)
      )
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  }

  /**
   * Obtiene la suma total de todos los reembolsos en todas las bolsas para un mes.
   * Se utiliza para minorar el gasto global consolidado sin inflar los ingresos brutos.
   */
  static getAllRefundsForMonth(monthKey: string, settings?: Settings): number {
    if (!settings || !settings.extraIncomes) return 0;

    return settings.extraIncomes
      .filter(
        (inc) =>
          inc.isActive !== false &&
          inc.allocationMode === 'bucket_refund' &&
          this.isMatchingMonth(inc, monthKey)
      )
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  }

  /**
   * Obtiene la suma total de todas las inyecciones de presupuesto a bolsas para un mes.
   */
  static getAllBudgetInjectionsForMonth(monthKey: string, settings?: Settings): number {
    if (!settings || !settings.extraIncomes) return 0;

    return settings.extraIncomes
      .filter(
        (inc) =>
          inc.isActive !== false &&
          inc.allocationMode === 'bucket_budget' &&
          this.isMatchingMonth(inc, monthKey)
      )
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  }

  /**
   * Lista detallada de ingresos extras asignados a una bolsa en un mes (para inspección en UI).
   */
  static getBucketAllocatedIncomes(
    bucketId: string,
    monthKey: string,
    settings?: Settings
  ): ExtraIncome[] {
    if (!bucketId || !settings || !settings.extraIncomes) return [];

    return settings.extraIncomes.filter(
      (inc) =>
        inc.isActive !== false &&
        inc.targetBucketId === bucketId &&
        this.isMatchingMonth(inc, monthKey)
    );
  }
}
