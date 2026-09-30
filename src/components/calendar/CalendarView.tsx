import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Play,
  BarChart3,
  CalendarDays,
  Sparkles,
  Info,
  Zap,
  Hand,
  AlertTriangle,
  RotateCcw,
  Coins,
  ArrowRightLeft,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  differenceInCalendarWeeks,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Expense, RecurringRule, Bucket, Settings, ExtraIncome } from '../../types';
import { HapticService } from '../../services/hapticService';
import { usePrivacy } from '../../context/PrivacyContext';
import { IncomeAllocationService } from '../../services/incomeAllocationService';

interface CalendarViewProps {
  expenses: Expense[];
  recurringRules: RecurringRule[];
  buckets: Bucket[];
  settings?: Settings;
  extraIncomes?: ExtraIncome[];
  currency: string;
  onAddExpense?: (expense: Expense) => void;
  onRequestConfirmRecurring?: (rule: RecurringRule, targetDate?: string) => void;
  onRevertExpense?: (expense: Expense) => void;
}

export function isIncomeOnDate(income: ExtraIncome, date: Date): boolean {
  if (income.isActive === false) return false;
  const dateStr = format(date, 'yyyy-MM-dd');

  if (income.type === 'punctual') {
    return (income.date || '').split('T')[0] === dateStr;
  }

  if (income.type === 'recurring') {
    const startDateStr = (income.date || '').split('T')[0];
    if (startDateStr && dateStr < startDateStr) return false;

    const dayNum = date.getDate();
    const targetDay =
      income.dayOfMonth || (startDateStr ? parseInt(startDateStr.split('-')[2], 10) : 1);
    if (dayNum !== targetDay) return false;

    const monthNum = date.getMonth() + 1;
    if (income.frequency === 'yearly') {
      const targetM = startDateStr ? parseInt(startDateStr.split('-')[1], 10) : 1;
      return monthNum === targetM;
    }
    if (income.frequency === 'quarterly') {
      const startM = startDateStr ? parseInt(startDateStr.split('-')[1], 10) : 1;
      return Math.abs(monthNum - startM) % 3 === 0;
    }
    return true; // mensual por defecto
  }
  return false;
}

export function isRuleOnDate(rule: RecurringRule, date: Date): boolean {
  if (!rule.isActive) return false;

  const dateStr = format(date, 'yyyy-MM-dd');
  if (rule.startDate) {
    const startStr = rule.startDate.split('T')[0];
    if (dateStr < startStr) return false;
  }
  if (rule.endDate) {
    const endStr = rule.endDate.split('T')[0];
    if (dateStr > endStr) return false;
  }

  const dayNum = date.getDate();
  const monthNum = date.getMonth() + 1; // 1 - 12
  const dayOfWeek = date.getDay(); // 0 - 6
  const interval = rule.interval && rule.interval > 1 ? rule.interval : 1;

  if (rule.frequency === 'yearly') {
    const targetMonth = rule.monthOfYear || (rule.startDate ? new Date(rule.startDate).getMonth() + 1 : 1);
    const targetDay = rule.dayOfMonth || 1;
    return targetMonth === monthNum && targetDay === dayNum;
  }

  if (rule.frequency === 'quarterly') {
    const targetDay = rule.dayOfMonth || 1;
    if (targetDay !== dayNum) return false;
    const startM = rule.startDate ? new Date(rule.startDate).getMonth() + 1 : 1;
    return Math.abs(monthNum - startM) % 3 === 0;
  }

  if (rule.frequency === 'weekly') {
    const targetDayOfWeek = rule.dayOfWeek ?? (rule.startDate ? new Date(rule.startDate).getDay() : 1);
    if (dayOfWeek !== targetDayOfWeek) return false;
    if (interval > 1 && rule.startDate) {
      const startDateObj = parseISO(rule.startDate.split('T')[0]);
      const weeksDiff = differenceInCalendarWeeks(date, startDateObj, { weekStartsOn: 1 });
      return weeksDiff >= 0 && weeksDiff % interval === 0;
    }
    return true;
  }

  // Por defecto mensual:
  const targetDay = rule.dayOfMonth || 1;
  if (targetDay !== dayNum) return false;
  if (interval > 1 && rule.startDate) {
    const startObj = parseISO(rule.startDate.split('T')[0]);
    const monthsDiff = (date.getFullYear() - startObj.getFullYear()) * 12 + (date.getMonth() - startObj.getMonth());
    return monthsDiff >= 0 && monthsDiff % interval === 0;
  }
  return true;
}

export function isRecurringRuleCompletedOnDate(
  rule: RecurringRule,
  dateStr: string,
  dayExpenses: Expense[]
): boolean {
  if ((rule.completedDates || []).includes(dateStr)) return true;
  if (rule.lastGeneratedDate === dateStr) return true;
  return dayExpenses.some(
    (e) =>
      e.recurringRuleId === rule.id ||
      (e.title.toLowerCase() === rule.title.toLowerCase() &&
        (rule.amount > 0 ? Math.abs(e.amount - rule.amount) < 0.01 : true))
  );
}

type ViewPeriod = 'month' | 'week' | 'yoy';

export const CalendarView: React.FC<CalendarViewProps> = ({
  expenses,
  recurringRules,
  buckets,
  settings,
  extraIncomes,
  currency,
  onAddExpense,
  onRequestConfirmRecurring,
  onRevertExpense,
}) => {
  const { isPrivate, mask } = usePrivacy();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('month');

  // Estados para el Comparador Anual (YoY)
  const currentYear = new Date().getFullYear();
  const [compareYearA, setCompareYearA] = useState<number>(currentYear);
  const [compareYearB, setCompareYearB] = useState<number>(currentYear - 1);

  // Navegación de fechas
  const handlePrev = () => {
    if (viewPeriod === 'month') {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (viewPeriod === 'week') {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewPeriod === 'month') {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (viewPeriod === 'week') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Cálculos de días para el calendario
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const formattedMonthStr = format(currentDate, 'yyyy-MM');

  // Rango para vista mensual
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Rango para vista semanal
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const activeDays = viewPeriod === 'week' ? weekDays : monthDays;

  // Ingresos efectivos (consolidados desde props o settings)
  const effectiveIncomes = extraIncomes || settings?.extraIncomes || [];

  // Gastos registrados en este mes
  const expensesInMonth = expenses.filter((e) => (e.date || '').startsWith(formattedMonthStr));
  const totalMonthSpent = expensesInMonth.reduce((acc, curr) => acc + curr.amount, 0);

  // Ingresos y reembolsos registrados en este mes
  const incomesInMonth = effectiveIncomes.filter((i) =>
    IncomeAllocationService.isMatchingMonth(i, formattedMonthStr)
  );
  const totalMonthIncomes = incomesInMonth.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Recurrentes comprometidos esperados en este mes (excluyendo tareas sin coste)
  const currentMonthNum = currentDate.getMonth() + 1;
  const monthlyRecurringTotal = recurringRules
    .filter((r) => {
      if (!r.isActive || r.costType === 'none' || !r.amount || r.amount <= 0) return false;

      // Si el compromiso tiene fecha de inicio posterior al mes visualizado, excluir
      if (r.startDate) {
        const startPrefix = r.startDate.slice(0, 7);
        if (formattedMonthStr < startPrefix) return false;
      }
      // Si el compromiso ya finalizó antes de este mes, excluir
      if (r.endDate) {
        const endPrefix = r.endDate.slice(0, 7);
        if (formattedMonthStr > endPrefix) return false;
      }

      if (r.frequency === 'yearly') {
        const targetM = r.monthOfYear || (r.startDate ? new Date(r.startDate).getMonth() + 1 : 1);
        return targetM === currentMonthNum;
      }
      if (r.frequency === 'quarterly') {
        const startM = r.startDate ? new Date(r.startDate).getMonth() + 1 : 1;
        return Math.abs(currentMonthNum - startM) % 3 === 0;
      }
      const interval = r.interval && r.interval > 1 ? r.interval : 1;
      if (r.frequency === 'monthly' && interval > 1) {
        const startObj = r.startDate ? new Date(r.startDate) : new Date(year, 0, 1);
        const monthsDiff = (year - startObj.getFullYear()) * 12 + (month - startObj.getMonth());
        return monthsDiff >= 0 && monthsDiff % interval === 0;
      }
      return true; // monthly estándar o weekly
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Ingreso mensual para el cálculo de Cash-Flow Runway (nómina/salario base del mes + ingresos extra)
  const baseSalary =
    settings?.monthlySalaries?.[formattedMonthStr]?.amount ?? settings?.monthlyIncome ?? 1500;
  const projectedBalanceEnd = baseSalary + totalMonthIncomes - totalMonthSpent - monthlyRecurringTotal;

  // Detalle del día seleccionado
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayExpenses = expenses.filter((e) => e.date === selectedDayStr);
  const selectedDayTotalSpent = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Ingresos del día seleccionado
  const selectedDayIncomes = effectiveIncomes.filter((i) => isIncomeOnDate(i, selectedDay));
  const selectedDayIncomeTotal = selectedDayIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const selectedDayNet = selectedDayIncomeTotal - selectedDayTotalSpent;

  // Recurrentes que caen en el día seleccionado respetando frecuencia
  const selectedDayRecurring = recurringRules.filter((r) => isRuleOnDate(r, selectedDay));

  // Recurrentes verdaderamente PENDIENTES (no completados ni asentados como gasto aún)
  const selectedDayPendingRecurring = selectedDayRecurring.filter(
    (r) => r.costType !== 'none' && r.amount > 0 && !isRecurringRuleCompletedOnDate(r, selectedDayStr, selectedDayExpenses)
  );
  const selectedDayPendingRecurringTotal = selectedDayPendingRecurring.reduce((sum, r) => sum + r.amount, 0);
  const selectedDayRealTotal = selectedDayTotalSpent + selectedDayPendingRecurringTotal;

  // Función para registrar o confirmar un recurrente del día seleccionado
  const handlePayRecurringNow = (rule: RecurringRule) => {
    if (onRequestConfirmRecurring) {
      onRequestConfirmRecurring(rule, selectedDayStr);
      return;
    }
    if (!onAddExpense) return;
    const expense: Expense = {
      id: `exp_cal_${Date.now()}`,
      title: rule.title,
      amount: rule.amount || 0,
      date: selectedDayStr,
      bucketId: rule.bucketId,
      isInvoice: false,
      status: 'paid',
      recurringRuleId: rule.id,
      notes: `Asentado desde calendario para el día ${selectedDayStr}`,
      createdAt: new Date().toISOString(),
    };
    onAddExpense(expense);
    HapticService.notificationSuccess();
  };

  // --- LÓGICA COMPARADOR ANUAL (YoY) ---
  const getExpensesByYearAndMonth = (targetYear: number) => {
    const monthsTotals = Array(12).fill(0);
    const byBucket: Record<string, number> = {};

    expenses.forEach((e) => {
      if (!e.date) return;
      const parts = e.date.split('-');
      const eYear = parseInt(parts[0]);
      const eMonth = parseInt(parts[1]) - 1;

      if (eYear === targetYear) {
        if (eMonth >= 0 && eMonth < 12) {
          monthsTotals[eMonth] += e.amount;
        }
        byBucket[e.bucketId] = (byBucket[e.bucketId] || 0) + e.amount;
      }
    });

    const totalYear = monthsTotals.reduce((a, b) => a + b, 0);
    return { monthsTotals, byBucket, totalYear };
  };

  const dataYearA = getExpensesByYearAndMonth(compareYearA);
  const dataYearB = getExpensesByYearAndMonth(compareYearB);

  const diffYear = dataYearA.totalYear - dataYearB.totalYear;
  const pctYearDiff =
    dataYearB.totalYear > 0
      ? Math.round((diffYear / dataYearB.totalYear) * 100)
      : 0;

  const monthLabels = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Selector de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <span>Calendario & Cash-Flow</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vencimientos futuros, liquidez proyectada y análisis interanual (YoY)
          </p>
        </div>

        {/* Selector de Pestañas de Vista */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setViewPeriod('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewPeriod === 'month'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewPeriod('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewPeriod === 'week'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewPeriod('yoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              viewPeriod === 'yoy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Comparador YoY</span>
          </button>
        </div>
      </div>

      {/* VISTAS DE CALENDARIO (MES O SEMANA) */}
      {viewPeriod !== 'yoy' && (
        <>
          {/* Tarjetas de Cash-Flow Runway del Mes */}
          <div className={`grid gap-3 ${totalMonthIncomes > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'}`}>
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Gastado Real en el Mes</span>
              <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                {mask(totalMonthSpent, currency)}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {expensesInMonth.length} movimientos ejecutados
              </span>
            </div>

            {totalMonthIncomes > 0 && (
              <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Ingresos & Reembolsos</span>
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  +{mask(totalMonthIncomes, currency)}
                </div>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                  {incomesInMonth.length} entradas en el mes
                </span>
              </div>
            )}

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Recurrentes Comprometidos</span>
              <div className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1">
                {mask(monthlyRecurringTotal, currency)}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Previsión fija del mes</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Saldo Proyectado Fin de Mes
              </span>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  projectedBalanceEnd >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isPrivate ? (
                  '•••• ' + currency
                ) : (
                  `${projectedBalanceEnd >= 0 ? '+' : ''}${projectedBalanceEnd.toFixed(2)} ${currency}`
                )}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    projectedBalanceEnd > 400
                      ? 'bg-emerald-500 dark:bg-emerald-400'
                      : projectedBalanceEnd >= 0
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                />
                <span>
                  {projectedBalanceEnd > 400
                    ? 'Holgura de liquidez óptima'
                    : projectedBalanceEnd >= 0
                    ? 'Liquidez ajustada'
                    : 'Riesgo de déficit'}
                </span>
              </span>
            </div>
          </div>

          {/* Barra de Navegación de Mes/Semana (Inmediatamente sobre el Calendario) */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3 rounded-3xl shadow-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-slate-900 dark:text-white capitalize pl-1">
                {viewPeriod === 'month'
                  ? format(currentDate, 'MMMM yyyy', { locale: es })
                  : `Semana del ${format(weekStart, 'd MMM')} al ${format(weekEnd, 'd MMM yyyy', {
                      locale: es,
                    })}`}
              </span>
            </div>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Hoy
            </button>
          </div>

          {/* Rejilla de Días del Calendario */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xl">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, idx) => (
                <span key={idx} className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1 uppercase">
                  {d}
                </span>
              ))}
            </div>

            {/* Días activos */}
            <div className="grid grid-cols-7 gap-1.5">
              {activeDays.map((day) => {
                const dayDateStr = format(day, 'yyyy-MM-dd');
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentMonth = day.getMonth() === month;
                const dayNum = day.getDate();

                // Gastos de este día
                const dayExpenses = expenses.filter((e) => e.date === dayDateStr);
                const totalDaySpent = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

                // Ingresos y reembolsos de este día
                const dayIncomes = effectiveIncomes.filter((i) => isIncomeOnDate(i, day));
                const totalDayIncome = dayIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
                const dayNet = totalDayIncome - totalDaySpent;
                const hasIncome = totalDayIncome > 0;
                const isNetPositiveDay = totalDayIncome > 0 && totalDaySpent > 0 && dayNet >= 0;

                // Recurrentes de este día
                const dayRecurring = recurringRules.filter((r) => isRuleOnDate(r, day));
                const dayCompletedRecurring = dayRecurring.filter((r) =>
                  isRecurringRuleCompletedOnDate(r, dayDateStr, dayExpenses)
                );
                const dayPendingBills = dayRecurring.filter(
                  (r) =>
                    r.costType !== 'none' &&
                    r.amount > 0 &&
                    !isRecurringRuleCompletedOnDate(r, dayDateStr, dayExpenses)
                );
                const dayPendingTasks = dayRecurring.filter(
                  (r) =>
                    (r.costType === 'none' ||
                      r.categoryType === 'health' ||
                      r.categoryType === 'maintenance' ||
                      r.categoryType === 'personal') &&
                    !isRecurringRuleCompletedOnDate(r, dayDateStr, dayExpenses)
                );

                const totalDayPendingRecurring = dayPendingBills.reduce((sum, r) => sum + r.amount, 0);

                const isPastOrToday = dayDateStr <= format(new Date(), 'yyyy-MM-dd');
                const hasUnpaidManualBill = dayPendingBills.some(
                  (r) => r.autoCreateExpense === false && isPastOrToday
                );

                // Indicadores semánticos unificados (máximo 1 punto por tipo)
                const hasExecutedActivity = dayExpenses.length > 0 || dayCompletedRecurring.length > 0;
                const hasPendingBill = dayPendingBills.length > 0;
                const hasPendingTask = dayPendingTasks.length > 0;
                const hasActivity = hasExecutedActivity || hasPendingBill || hasPendingTask || hasUnpaidManualBill;

                return (
                  <button
                    key={dayDateStr}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`h-16 p-1.5 rounded-2xl flex flex-col justify-between transition-all border text-left cursor-pointer overflow-hidden relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/40 shadow-lg'
                        : isToday(day)
                        ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-slate-900'
                        : isNetPositiveDay
                        ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400'
                        : hasUnpaidManualBill
                        ? 'border-rose-300 dark:border-rose-500/60 bg-rose-50 dark:bg-rose-950/20 hover:border-rose-500'
                        : hasActivity || hasIncome
                        ? 'border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600'
                        : 'border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-800'
                    } ${!isCurrentMonth && viewPeriod === 'month' ? 'opacity-30' : 'opacity-100'}`}
                  >
                    <div className="flex items-center justify-between w-full min-w-0">
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          isToday(day)
                            ? 'text-emerald-600 dark:text-emerald-400 font-black'
                            : isSelected
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Puntos de evento ultra-compactos y estrictamente deduplicados */}
                      <div className="flex items-center space-x-0.5 shrink-0 max-w-[28px] overflow-hidden">
                        {hasIncome && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-xs shadow-emerald-400/50 shrink-0"
                            title={`Ingreso o reembolso recibido: +${totalDayIncome.toFixed(2)}${currency}`}
                          />
                        )}
                        {hasUnpaidManualBill ? (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 shadow-xs shadow-rose-400/50 shrink-0 animate-pulse"
                            title="Pago manual vencido pendiente de abonar"
                          />
                        ) : null}
                        {dayExpenses.length > 0 && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-rose-500/80 dark:bg-rose-400/80 shrink-0"
                            title={`Gastos ejecutados: -${totalDaySpent.toFixed(2)}${currency}`}
                          />
                        )}
                        {hasPendingBill && !hasUnpaidManualBill && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-xs shadow-blue-400/50 shrink-0"
                            title="Facturas o pagos programados pendientes"
                          />
                        )}
                        {hasPendingTask && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shadow-xs shadow-purple-400/50 shrink-0"
                            title="Tareas periódicas o salud pendientes"
                          />
                        )}
                      </div>
                    </div>

                    {/* Desglose resumido de importes con balance neto e ingresos */}
                    <div className="w-full truncate min-w-0">
                      {totalDaySpent > 0 && totalDayIncome > 0 ? (
                        <div
                          className={`text-[9px] font-mono font-bold truncate leading-tight whitespace-nowrap ${
                            dayNet >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-300'
                          }`}
                          title={`Gasto: -${totalDaySpent.toFixed(2)}${currency} | Ingreso/Reembolso: +${totalDayIncome.toFixed(2)}${currency} | Neto: ${dayNet >= 0 ? '+' : ''}${dayNet.toFixed(2)}${currency}`}
                        >
                          {dayNet >= 0 ? `+${dayNet.toFixed(0)}` : `-${Math.abs(dayNet).toFixed(0)}`}&nbsp;{currency}
                          <span className="text-[8px] font-normal opacity-75 ml-0.5">neto</span>
                        </div>
                      ) : totalDayIncome > 0 ? (
                        <div className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate leading-tight whitespace-nowrap">
                          +{totalDayIncome.toFixed(0)}&nbsp;{currency}
                        </div>
                      ) : totalDaySpent > 0 ? (
                        <div className="text-[9px] font-mono font-bold text-rose-600 dark:text-rose-300 truncate leading-tight whitespace-nowrap">
                          -{totalDaySpent.toFixed(0)}&nbsp;{currency}
                        </div>
                      ) : totalDayPendingRecurring > 0 ? (
                        <div className="text-[9px] font-mono font-bold text-blue-600 dark:text-blue-300 truncate leading-tight whitespace-nowrap">
                          ~{totalDayPendingRecurring.toFixed(0)}&nbsp;{currency}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Detalle del Día Seleccionado */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>
                    Detalle del {format(selectedDay, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{selectedDayExpenses.length} {selectedDayExpenses.length === 1 ? 'gasto ejecutado' : 'gastos ejecutados'}</span>
                  {selectedDayIncomes.length > 0 && (
                    <span>• {selectedDayIncomes.length} {selectedDayIncomes.length === 1 ? 'ingreso/reembolso' : 'ingresos/reembolsos'}</span>
                  )}
                  {selectedDayPendingRecurring.length > 0
                    ? ` • ${selectedDayPendingRecurring.length} ${selectedDayPendingRecurring.length === 1 ? 'pago pendiente' : 'pagos pendientes'}`
                    : selectedDayRecurring.length > 0
                    ? ' • compromisos al día'
                    : ''}
                </span>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
                {selectedDayTotalSpent > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Gastado</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                      -{isPrivate ? '••••' : selectedDayTotalSpent.toFixed(2)} {currency}
                    </span>
                  </div>
                )}
                {selectedDayIncomeTotal > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Ingresado</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      +{isPrivate ? '••••' : selectedDayIncomeTotal.toFixed(2)} {currency}
                    </span>
                  </div>
                )}
                <div className="text-right pl-2 border-l border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">
                    {selectedDayIncomeTotal > 0 && selectedDayTotalSpent > 0 ? 'Balance Neto' : 'Total del Día'}
                  </span>
                  <div
                    className={`text-base font-black whitespace-nowrap ${
                      selectedDayIncomeTotal > 0 && selectedDayTotalSpent > 0
                        ? selectedDayNet >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {isPrivate
                      ? '•••• ' + currency
                      : selectedDayIncomeTotal > 0 && selectedDayTotalSpent > 0
                      ? `${selectedDayNet >= 0 ? '+' : ''}${selectedDayNet.toFixed(2)} ${currency}`
                      : `${selectedDayRealTotal.toFixed(2)} ${currency}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Listado de Ingresos y Reembolsos Recibidos en este día */}
            {selectedDayIncomes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Ingresos y Reembolsos Recibidos ({selectedDayIncomes.length}):</span>
                </span>

                <div className="space-y-2">
                  {selectedDayIncomes.map((inc) => {
                    const targetBucket = buckets.find((b) => b.id === inc.targetBucketId);
                    const isRefund = inc.allocationMode === 'bucket_refund';
                    const isInjection = inc.allocationMode === 'bucket_budget';

                    return (
                      <div
                        key={inc.id}
                        className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {inc.title}
                            </span>
                            {isRefund && targetBucket && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/40">
                                Reembolso: {targetBucket.name}
                              </span>
                            )}
                            {isInjection && targetBucket && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/40">
                                Inyección: {targetBucket.name}
                              </span>
                            )}
                            {!targetBucket && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                                Ingreso General
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {inc.notes || 'Ingreso registrado en cuenta'}
                          </div>
                        </div>

                        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0">
                          +{isPrivate ? '••••' : inc.amount.toFixed(2)}&nbsp;{currency}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Listado de Actos y Vencimientos Programados para este día */}
            {selectedDayRecurring.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Actos y Recordatorios Previstos para este Día:</span>
                </span>

                <div className="space-y-2">
                  {selectedDayRecurring.map((rule) => {
                    const bucket = buckets.find((b) => b.id === rule.bucketId);
                    const isTask = rule.costType === 'none' || !rule.amount || rule.amount <= 0;
                    const isEstimated = rule.costType === 'estimated';
                    const selectedDayDateStr = format(selectedDay, 'yyyy-MM-dd');
                    const isTaskCompleted = isRecurringRuleCompletedOnDate(rule, selectedDayDateStr, selectedDayExpenses);
                    const isPastOrToday = selectedDayDateStr <= format(new Date(), 'yyyy-MM-dd');
                    const isUnpaidManual =
                      !isTaskCompleted &&
                      rule.costType !== 'none' &&
                      rule.amount > 0 &&
                      rule.autoCreateExpense === false &&
                      isPastOrToday;

                    let categoryBadge = 'Recibo';
                    if (rule.categoryType === 'health') categoryBadge = 'Salud';
                    else if (rule.categoryType === 'maintenance') categoryBadge = 'Mantenimiento';
                    else if (rule.categoryType === 'tax') categoryBadge = 'Impuesto';
                    else if (rule.categoryType === 'personal') categoryBadge = 'Personal';
                    else if (rule.categoryType === 'subscription') categoryBadge = 'Suscripción';

                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isTaskCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/40'
                            : isUnpaidManual
                            ? 'bg-rose-50 dark:bg-rose-950/25 border-rose-200 dark:border-rose-500/50 shadow-md shadow-rose-950/20'
                            : isTask
                            ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-500/30'
                            : isEstimated
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
                            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/30'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{rule.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {categoryBadge}
                            </span>
                            {rule.costType !== 'none' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                {rule.autoCreateExpense !== false ? (
                                  <>
                                    <Zap className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                                    <span>Auto</span>
                                  </>
                                ) : (
                                  <>
                                    <Hand className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
                                    <span>Manual</span>
                                  </>
                                )}
                              </span>
                            )}
                            {isTaskCompleted && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />
                                <span>Completada</span>
                              </span>
                            )}
                            {isUnpaidManual && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-500/40 animate-pulse flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-500 dark:text-rose-400" />
                                <span>No pagado</span>
                              </span>
                            )}
                            {rule.noticePeriodDays && rule.noticePeriodDays > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>Preaviso {rule.noticePeriodDays}d</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {bucket?.name || 'General'} • {rule.frequency}
                            {rule.reminderOffsets && rule.reminderOffsets.length > 0 && (
                              <span className="text-slate-400 dark:text-slate-500"> • {rule.reminderOffsets.length} alertas</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white mr-1 whitespace-nowrap">
                            {isTask ? (
                              <span className="text-purple-600 dark:text-purple-300 text-[11px] font-semibold whitespace-nowrap">Sin coste</span>
                            ) : isEstimated ? (
                              <span className="text-amber-600 dark:text-amber-300 font-black whitespace-nowrap">~{rule.amount.toFixed(2)}&nbsp;{currency}</span>
                            ) : (
                              <span className="whitespace-nowrap">{rule.amount.toFixed(2)}&nbsp;{currency}</span>
                            )}
                          </span>

                          {isTaskCompleted ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 shadow-xs whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{isTask ? 'Completada' : 'Registrado'}</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePayRecurringNow(rule)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 whitespace-nowrap ${
                                isUnpaidManual
                                  ? 'bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                                  : 'bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40'
                              }`}
                            >
                              <Play className="w-3 h-3 fill-current shrink-0" />
                              <span>{isTask ? 'Completar' : isUnpaidManual ? 'Pagar Ahora' : isEstimated ? 'Confirmar' : 'Pagar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Listado de Gastos Realizados en este día */}
            {selectedDayExpenses.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>Gastos Registrados:</span>
                </span>

                <div className="space-y-2">
                  {selectedDayExpenses.map((exp) => {
                    const bucket = buckets.find((b) => b.id === exp.bucketId);
                    const isAutoExpense = !!exp.recurringRuleId || (exp.notes || '').toLowerCase().includes('cobro automático');
                    return (
                      <div
                        key={exp.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{exp.title}</span>
                            {isAutoExpense && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-500/30 shrink-0 flex items-center gap-1 whitespace-nowrap">
                                <Zap className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                                <span>Cobro Automático</span>
                              </span>
                            )}
                            {exp.effectiveMonth && exp.effectiveMonth !== (exp.date || '').substring(0, 7) && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30 shrink-0 flex items-center gap-1 whitespace-nowrap">
                                <span>⏩ Imputado {exp.effectiveMonth}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {bucket?.name || 'General'} {exp.supplier ? `• ${exp.supplier}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-300 whitespace-nowrap">
                            -{exp.amount.toFixed(2)}&nbsp;{currency}
                          </div>
                          {onRevertExpense && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`¿Revertir y deshacer el cobro de "${exp.title}" (${exp.amount.toFixed(2)} ${currency})?`)) {
                                  await HapticService.impactLight();
                                  onRevertExpense(exp);
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 text-[10px] font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              title="Revertir y eliminar este gasto"
                            >
                              <RotateCcw className="w-3 h-3 shrink-0" />
                              <span>Revertir</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              selectedDayRecurring.length === 0 && selectedDayIncomes.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                  No hay movimientos registrados ni cobros programados para esta fecha.
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* VISTA COMPARADOR ANUAL (YoY - YEAR OVER YEAR) */}
      {viewPeriod === 'yoy' && (
        <div className="space-y-6">
          {/* Selectores de Años */}
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Análisis Comparativo Interanual</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compara el gasto total y la variación porcentual entre dos ejercicios
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={compareYearA}
                onChange={(e) => setCompareYearA(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>
                    Año A: {y}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">vs</span>

              <select
                value={compareYearB}
                onChange={(e) => setCompareYearB(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400"
              >
                {[currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
                  <option key={y} value={y}>
                    Año B: {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tarjetas de Resumen YoY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Gasto Total {compareYearA}</span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {dataYearA.totalYear.toFixed(2)} {currency}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Gasto Total {compareYearB}</span>
              <div className="text-2xl font-black font-mono text-slate-700 dark:text-slate-300 mt-1">
                {dataYearB.totalYear.toFixed(2)} {currency}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Variación Interanual</span>
              <div
                className={`text-2xl font-black font-mono mt-1 flex items-center gap-1.5 ${
                  diffYear <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {diffYear <= 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                <span>
                  {diffYear > 0 ? '+' : ''}
                  {pctYearDiff}% ({diffYear.toFixed(2)} {currency})
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {diffYear <= 0 ? 'Ahorro respecto al ejercicio anterior' : 'Incremento de gasto interanual'}
              </span>
            </div>
          </div>

          {/* Comparativa Mes a Mes */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Evolución Comparativa Mensual
            </h4>

            <div className="space-y-2.5">
              {monthLabels.map((lbl, idx) => {
                const valA = dataYearA.monthsTotals[idx] || 0;
                const valB = dataYearB.monthsTotals[idx] || 0;
                const maxVal = Math.max(valA, valB, 1);
                const pctA = Math.min(Math.round((valA / maxVal) * 100), 100);
                const pctB = Math.min(Math.round((valB / maxVal) * 100), 100);

                return (
                  <div key={lbl} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 w-10">{lbl}</span>
                      <div className="space-x-3 text-right font-mono text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {compareYearA}: {valA.toFixed(0)} {currency}
                        </span>
                        <span className="text-slate-500">
                          {compareYearB}: {valB.toFixed(0)} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full flex gap-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pctA / 2}%` }}
                      />
                      <div
                        className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
                        style={{ width: `${pctB / 2}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
