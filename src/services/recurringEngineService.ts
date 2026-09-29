import { RecurringRule, Expense } from '../types';
import { isRuleOnDate } from '../components/calendar/CalendarView';
import { format, subDays, parseISO } from 'date-fns';

export interface ProcessRecurringResult {
  newExpenses: Expense[];
  updatedRules: RecurringRule[];
}

export class RecurringEngineService {
  /**
   * Escanea las reglas recurrentes activas con cobro automático (autoCreateExpense !== false)
   * y genera de forma idempotente los gastos correspondientes para cualquier vencimiento
   * hasta la fecha actual que no haya sido registrado previamente.
   *
   * Para evitar saturación histórica al definir startDates antiguas, escanea hasta un máximo
   * de 60 días hacia atrás desde hoy (o desde rule.startDate si es más reciente).
   */
  static processDueRecurringRules(
    rules: RecurringRule[],
    existingExpenses: Expense[],
    referenceDate = new Date()
  ): ProcessRecurringResult {
    const todayStr = format(referenceDate, 'yyyy-MM-dd');
    const sixtyDaysAgo = subDays(referenceDate, 60);
    const sixtyDaysAgoStr = format(sixtyDaysAgo, 'yyyy-MM-dd');

    const newExpenses: Expense[] = [];
    const updatedRulesMap = new Map<string, RecurringRule>();

    // Indexar gastos existentes por clave compuesta para búsqueda O(1)
    const existingExpenseKeys = new Set<string>();
    for (const exp of existingExpenses) {
      if (exp.recurringRuleId && exp.date) {
        existingExpenseKeys.add(`${exp.recurringRuleId}_${exp.date}`);
      } else if (exp.title && exp.date) {
        existingExpenseKeys.add(`${exp.title.toLowerCase()}_${exp.date}`);
      }
    }

    const activeRules = rules.filter(
      (r) =>
        r.isActive !== false &&
        r.autoCreateExpense !== false && // Cobro automático por defecto
        r.costType !== 'none' &&
        r.amount > 0
    );

    for (const rule of activeRules) {
      if (!rule.startDate) continue;

      const ruleStartStr = rule.startDate.split('T')[0];
      if (ruleStartStr > todayStr) {
        // La regla inicia en el futuro, no genera cobros todavía
        continue;
      }

      // Escanear desde el mayor entre startDate y 60 días atrás
      const scanStartStr = ruleStartStr > sixtyDaysAgoStr ? ruleStartStr : sixtyDaysAgoStr;
      const scanStartDate = parseISO(scanStartStr);

      const completedDatesSet = new Set(rule.completedDates || []);
      let ruleModified = false;
      let latestGeneratedDate = rule.lastGeneratedDate;

      // Iterar día por día desde scanStartDate hasta today
      const currentIter = new Date(scanStartDate);
      while (format(currentIter, 'yyyy-MM-dd') <= todayStr) {
        const dateStr = format(currentIter, 'yyyy-MM-dd');

        // Si la regla tiene fecha de fin y ya pasó esta fecha, no evaluar más
        if (rule.endDate && dateStr > rule.endDate.split('T')[0]) {
          break;
        }

        if (isRuleOnDate(rule, currentIter)) {
          const ruleKey = `${rule.id}_${dateStr}`;
          const titleKey = `${rule.title.toLowerCase()}_${dateStr}`;

          const alreadyInExpenses =
            existingExpenseKeys.has(ruleKey) || existingExpenseKeys.has(titleKey);
          const alreadyInCompleted = completedDatesSet.has(dateStr);

          if (!alreadyInExpenses && !alreadyInCompleted) {
            // Generar nuevo gasto automático
            const autoExpense: Expense = {
              id: `exp_rec_auto_${rule.id}_${dateStr.replace(/-/g, '')}`,
              title: rule.title,
              amount: rule.amount,
              date: dateStr,
              bucketId: rule.bucketId,
              isInvoice: false,
              status: 'paid',
              recurringRuleId: rule.id,
              notes: 'Cobro automático programado',
              createdAt: new Date().toISOString(),
            };

            newExpenses.push(autoExpense);
            existingExpenseKeys.add(ruleKey);
            completedDatesSet.add(dateStr);
            latestGeneratedDate = dateStr;
            ruleModified = true;
          }
        }

        // Avanzar 1 día
        currentIter.setDate(currentIter.getDate() + 1);
      }

      if (ruleModified) {
        updatedRulesMap.set(rule.id, {
          ...rule,
          completedDates: Array.from(completedDatesSet),
          lastGeneratedDate: latestGeneratedDate,
        });
      }
    }

    const updatedRules = rules.map((r) => updatedRulesMap.get(r.id) || r);

    return {
      newExpenses,
      updatedRules,
    };
  }
}
