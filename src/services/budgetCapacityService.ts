import { Bucket, Settings } from '../types';
import { DBService } from './db';

export interface BudgetCapacityMetrics {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Septiembre 2026"
  baseSalary: number;
  punctualExtraIncome: number;
  recurringExtraIncome: number;
  totalIncome: number;
  totalBucketsBudget: number; // Suma de límites mensuales de bolsas
  difference: number; // totalIncome - totalBucketsBudget (>0: libre, <0: excedido, ===0: equilibrado)
  status: 'free' | 'exceeded' | 'balanced';
  percentageAllocated: number; // Porcentaje de ingresos asignado a bolsas
}

export class BudgetCapacityService {
  /**
   * Obtiene el ingreso estimado total para un mes específico (YYYY-MM).
   * Considera salario base o blindado real para ese mes + ingresos extras puntuales del mes + recurrentes activos.
   */
  static getMonthlyEstimatedIncome(settings: Settings, monthKey: string): {
    baseSalary: number;
    punctualExtraIncome: number;
    recurringExtraIncome: number;
    totalIncome: number;
  } {
    const baseSalary = DBService.getEffectiveMonthlySalary(settings, monthKey);
    const extraIncomes = settings.extraIncomes || [];

    const punctualExtraIncome = extraIncomes
      .filter((inc) => inc.isActive !== false && inc.type === 'punctual' && (inc.date || '').startsWith(monthKey))
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    const recurringExtraIncome = extraIncomes
      .filter((inc) => inc.isActive !== false && inc.type === 'recurring')
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    const totalIncome = baseSalary + punctualExtraIncome + recurringExtraIncome;

    return {
      baseSalary,
      punctualExtraIncome,
      recurringExtraIncome,
      totalIncome,
    };
  }

  /**
   * Calcula el balance de capacidad presupuestaria entre los ingresos del mes y la suma de techos/límites de bolsas.
   */
  static calculateCapacity(
    buckets: Bucket[],
    settings: Settings,
    monthKey: string,
    monthName: string = monthKey
  ): BudgetCapacityMetrics {
    const incomeDetails = this.getMonthlyEstimatedIncome(settings, monthKey);
    const totalBucketsBudget = buckets.reduce((sum, b) => sum + (Number(b.budgetLimit) || 0), 0);
    const difference = incomeDetails.totalIncome - totalBucketsBudget;

    let status: 'free' | 'exceeded' | 'balanced' = 'balanced';
    if (Math.abs(difference) < 0.005) {
      status = 'balanced';
    } else if (difference > 0) {
      status = 'free';
    } else {
      status = 'exceeded';
    }

    const percentageAllocated =
      incomeDetails.totalIncome > 0
        ? Math.round((totalBucketsBudget / incomeDetails.totalIncome) * 100)
        : totalBucketsBudget > 0
        ? 999
        : 0;

    return {
      monthKey,
      monthName,
      ...incomeDetails,
      totalBucketsBudget,
      difference,
      status,
      percentageAllocated,
    };
  }
}
