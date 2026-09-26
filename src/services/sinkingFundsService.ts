import { SavingsGoal } from '../types';

export interface CruisePaceResult {
  monthsRemaining: number;
  monthlyContribution: number;
  dailyPace: number;
  status: 'on_track' | 'behind' | 'completed' | 'critical';
}

export interface SurplusDistributionItem {
  goalId: string;
  amount: number;
}

export class SinkingFundsService {
  /**
   * Calcula el ritmo de crucero necesario para alcanzar la meta en su fecha objetivo
   */
  static calculateCruisePace(goal: SavingsGoal, referenceDate: Date = new Date()): CruisePaceResult {
    // Si la meta ya está completada o el saldo actual supera el objetivo
    if (goal.isCompleted || goal.currentAmount >= goal.targetAmount) {
      return {
        monthsRemaining: 0,
        monthlyContribution: 0,
        dailyPace: 0,
        status: 'completed',
      };
    }

    const refYear = referenceDate.getFullYear();
    const refMonth = referenceDate.getMonth() + 1; // 1-12

    let tYear = refYear;
    let tMonth = refMonth;

    if (goal.targetDate) {
      const parts = goal.targetDate.split('-');
      tYear = parseInt(parts[0], 10) || refYear;
      tMonth = parseInt(parts[1], 10) || refMonth;
    }

    let monthsRemaining = (tYear - refYear) * 12 + (tMonth - refMonth);
    const deficit = Math.max(0, goal.targetAmount - goal.currentAmount);

    // Si la fecha ya venció o vence este mismo mes y aún falta saldo
    if (monthsRemaining <= 0) {
      return {
        monthsRemaining: 1,
        monthlyContribution: Math.round(deficit * 100) / 100,
        dailyPace: Math.round((deficit / 30) * 100) / 100,
        status: 'critical',
      };
    }

    const monthlyContribution = Math.round((deficit / monthsRemaining) * 100) / 100;
    const dailyPace = Math.round((monthlyContribution / 30) * 100) / 100;

    // Evaluación de estado 'on_track' vs 'behind'
    let status: 'on_track' | 'behind' | 'completed' | 'critical' = 'on_track';

    if (monthsRemaining <= 1 && deficit > 0) {
      status = 'critical';
    } else if (goal.createdAt) {
      const cDateParts = goal.createdAt.split('T')[0].split('-');
      const cYear = parseInt(cDateParts[0], 10) || refYear;
      const cMonth = parseInt(cDateParts[1], 10) || refMonth;
      const totalMonths = Math.max(1, (tYear - cYear) * 12 + (tMonth - cMonth));
      const monthsElapsed = Math.max(0, totalMonths - monthsRemaining);
      const expectedAccumulated = (goal.targetAmount / totalMonths) * monthsElapsed;

      if (goal.currentAmount < expectedAccumulated * 0.8) {
        status = 'behind';
      } else {
        status = 'on_track';
      }
    }

    return {
      monthsRemaining,
      monthlyContribution,
      dailyPace,
      status,
    };
  }

  /**
   * Suma de la cuota mensual de crucero comprometida de todas las metas activas
   * con autoDeductFromSafeToSpend: true y !isCompleted
   */
  static calculateTotalCommittedMonthly(goals: SavingsGoal[], referenceDate: Date = new Date()): number {
    if (!goals || goals.length === 0) return 0;

    let total = 0;
    for (const goal of goals) {
      if (goal.autoDeductFromSafeToSpend && !goal.isCompleted && goal.currentAmount < goal.targetAmount) {
        const pace = this.calculateCruisePace(goal, referenceDate);
        total += pace.monthlyContribution;
      }
    }

    return Math.round(total * 100) / 100;
  }

  /**
   * Reparto proporcional del excedente entre metas activas no completadas ponderando por su prioridad
   * (Prioridad 1 peso 3, Prioridad 2 peso 2, Prioridad 3 peso 1)
   */
  static distributeSurplus(surplusAmount: number, goals: SavingsGoal[]): SurplusDistributionItem[] {
    if (surplusAmount <= 0 || !goals || goals.length === 0) return [];

    const eligibleGoals = goals.filter((g) => !g.isCompleted && g.currentAmount < g.targetAmount);
    if (eligibleGoals.length === 0) return [];

    const getWeight = (priority: number): number => {
      if (priority === 1) return 3;
      if (priority === 2) return 2;
      return 1;
    };

    const totalWeight = eligibleGoals.reduce((sum, g) => sum + getWeight(g.priority), 0);
    if (totalWeight <= 0) return [];

    let distributedSum = 0;
    const result: SurplusDistributionItem[] = [];

    for (let i = 0; i < eligibleGoals.length; i++) {
      const g = eligibleGoals[i];
      const weight = getWeight(g.priority);

      // Si es el último, asignar el remanente para evitar desvíos por redondeo
      let allocated: number;
      if (i === eligibleGoals.length - 1) {
        allocated = Math.max(0, Math.round((surplusAmount - distributedSum) * 100) / 100);
      } else {
        allocated = Math.round(((surplusAmount * weight) / totalWeight) * 100) / 100;
        distributedSum += allocated;
      }

      result.push({
        goalId: g.id,
        amount: allocated,
      });
    }

    return result;
  }
}
