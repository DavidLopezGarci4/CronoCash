import { Expense, RecurringRule, Bucket, SavingsGoal } from '../types';
import { SinkingFundsService } from './sinkingFundsService';

export interface PendingBill {
  id: string;
  title: string;
  amount: number;
  dueDay: number;
  isVampire?: boolean;
}

export interface SafeToSpendMetrics {
  monthlyIncome: number;
  totalSpentMonth: number;
  pendingRecurringTotal: number;
  pendingBillsCount: number;
  pendingBills: PendingBill[];
  bufferReserved: number;
  committedGoalsMonthly: number;
  netAvailable: number;
  totalDaysInMonth: number;
  currentDay: number;
  daysRemaining: number;
  dailySafeToSpend: number;
  status: 'optimal' | 'warning' | 'critical';
  burnRatePercentage: number;
  expectedPacePercentage: number;
  paceStatus: 'ahead' | 'on_track' | 'behind';
}

export class SafeToSpendService {
  /**
   * Calcula el gasto diario seguro (Safe-to-Spend) y la telemetría del burn-rate mensual
   */
  static calculate(
    expenses: Expense[],
    recurringRules: RecurringRule[],
    buckets: Bucket[],
    monthlyIncome: number,
    referenceDate = new Date(),
    savingsGoals: SavingsGoal[] = []
  ): SafeToSpendMetrics {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth(); // 0-11
    const currentDay = referenceDate.getDate();

    // Días totales en el mes de referencia
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

    // Prefijo de mes YYYY-MM
    const monthStr = String(month + 1).padStart(2, '0');
    const currentMonthPrefix = `${year}-${monthStr}`;

    // Gastos consolidados del mes
    const currentMonthExpenses = expenses.filter((e) =>
      (e.date || '').startsWith(currentMonthPrefix)
    );
    const totalSpentMonth = currentMonthExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    // Identificar reglas recurrentes pendientes de cobro este mes
    const pendingBills: PendingBill[] = [];
    let pendingRecurringTotal = 0;

    const activeRules = recurringRules.filter((r) => r.isActive !== false);

    for (const rule of activeRules) {
      // Verificar si ya se ha generado o registrado un gasto vinculado este mes
      const alreadyPaidThisMonth = currentMonthExpenses.some(
        (e) => e.recurringRuleId === rule.id
      );

      if (!alreadyPaidThisMonth) {
        // Asignar día de vencimiento aproximado si no está especificado
        const dueDay = rule.dayOfMonth || 1;
        pendingBills.push({
          id: rule.id,
          title: rule.title,
          amount: rule.amount,
          dueDay,
          isVampire: rule.isVampire,
        });
        pendingRecurringTotal += rule.amount;
      }
    }

    // Ordenar facturas pendientes por fecha de vencimiento
    pendingBills.sort((a, b) => a.dueDay - b.dueDay);

    // Reserva de fondos amortiguadores / colchón de emergencias
    const bufferBuckets = buckets.filter((b) => b.isBuffer);
    const bufferReserved = bufferBuckets.reduce((acc, curr) => acc + (curr.budgetLimit || 0), 0);

    // Cuota mensual comprometida para Metas de Ahorro con deducción activa
    const committedGoalsMonthly = SinkingFundsService.calculateTotalCommittedMonthly(
      savingsGoals,
      referenceDate
    );

    // Liquidez Neta Real Disponible para el resto del mes
    const netAvailable = Math.max(
      0,
      monthlyIncome - totalSpentMonth - pendingRecurringTotal - bufferReserved - committedGoalsMonthly
    );

    // Safe-to-Spend diario
    const dailySafeToSpend = netAvailable > 0 ? netAvailable / daysRemaining : 0;

    // Semáforo de salud de gasto diario
    let status: 'optimal' | 'warning' | 'critical' = 'optimal';
    if (dailySafeToSpend < 15 || netAvailable <= 0) {
      status = 'critical';
    } else if (dailySafeToSpend < 35) {
      status = 'warning';
    } else {
      status = 'optimal';
    }

    // Ritmo de consumo (Burn Rate vs Calendario)
    const expectedPacePercentage = Math.round((currentDay / totalDaysInMonth) * 100);
    const burnRatePercentage = monthlyIncome > 0
      ? Math.round((totalSpentMonth / monthlyIncome) * 100)
      : 100;

    let paceStatus: 'ahead' | 'on_track' | 'behind' = 'on_track';
    if (burnRatePercentage > expectedPacePercentage + 10) {
      paceStatus = 'behind'; // Ha gastado más rápido que los días del mes
    } else if (burnRatePercentage < expectedPacePercentage - 10) {
      paceStatus = 'ahead'; // Gasto más prudente que el ritmo del calendario
    }

    return {
      monthlyIncome,
      totalSpentMonth,
      pendingRecurringTotal,
      pendingBillsCount: pendingBills.length,
      pendingBills,
      bufferReserved,
      committedGoalsMonthly,
      netAvailable,
      totalDaysInMonth,
      currentDay,
      daysRemaining,
      dailySafeToSpend,
      status,
      burnRatePercentage,
      expectedPacePercentage,
      paceStatus,
    };
  }

  /**
   * Simula el impacto de un gasto puntual sobre el Safe-to-Spend diario restante
   */
  static simulateImpulse(
    baseMetrics: SafeToSpendMetrics,
    simulatedAmount: number
  ): { simulatedDailySafe: number; dailyReduction: number; isFeasible: boolean } {
    const newNet = Math.max(0, baseMetrics.netAvailable - simulatedAmount);
    const simulatedDailySafe = baseMetrics.daysRemaining > 0 ? newNet / baseMetrics.daysRemaining : 0;
    const dailyReduction = Math.max(0, baseMetrics.dailySafeToSpend - simulatedDailySafe);
    const isFeasible = simulatedAmount <= baseMetrics.netAvailable;

    return {
      simulatedDailySafe,
      dailyReduction,
      isFeasible,
    };
  }
}
