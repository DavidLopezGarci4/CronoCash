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
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Expense, RecurringRule, Bucket, Settings } from '../../types';
import { HapticService } from '../../services/hapticService';

interface CalendarViewProps {
  expenses: Expense[];
  recurringRules: RecurringRule[];
  buckets: Bucket[];
  settings?: Settings;
  currency: string;
  onAddExpense?: (expense: Expense) => void;
  onRequestConfirmRecurring?: (rule: RecurringRule, targetDate?: string) => void;
}

export function isRuleOnDate(rule: RecurringRule, date: Date): boolean {
  if (!rule.isActive) return false;
  const dayNum = date.getDate();
  const monthNum = date.getMonth() + 1; // 1 - 12
  const dayOfWeek = date.getDay(); // 0 - 6

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
    return dayOfWeek === targetDayOfWeek;
  }

  // Por defecto mensual:
  const targetDay = rule.dayOfMonth || 1;
  return targetDay === dayNum;
}

type ViewPeriod = 'month' | 'week' | 'yoy';

export const CalendarView: React.FC<CalendarViewProps> = ({
  expenses,
  recurringRules,
  buckets,
  settings,
  currency,
  onAddExpense,
  onRequestConfirmRecurring,
}) => {
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

  // Gastos registrados en este mes
  const expensesInMonth = expenses.filter((e) => (e.date || '').startsWith(formattedMonthStr));
  const totalMonthSpent = expensesInMonth.reduce((acc, curr) => acc + curr.amount, 0);

  // Recurrentes comprometidos esperados en este mes (excluyendo tareas sin coste)
  const currentMonthNum = currentDate.getMonth() + 1;
  const monthlyRecurringTotal = recurringRules
    .filter((r) => {
      if (!r.isActive || r.costType === 'none' || !r.amount || r.amount <= 0) return false;
      if (r.frequency === 'yearly') {
        const targetM = r.monthOfYear || (r.startDate ? new Date(r.startDate).getMonth() + 1 : 1);
        return targetM === currentMonthNum;
      }
      if (r.frequency === 'quarterly') {
        const startM = r.startDate ? new Date(r.startDate).getMonth() + 1 : 1;
        return Math.abs(currentMonthNum - startM) % 3 === 0;
      }
      return true; // monthly o weekly
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Ingreso mensual para el cálculo de Cash-Flow Runway
  const monthlyIncome = settings?.monthlyIncome || 2200;
  const projectedBalanceEnd = monthlyIncome - totalMonthSpent - monthlyRecurringTotal;

  // Detalle del día seleccionado
  const selectedDayStr = format(selectedDay, 'yyyy-MM-dd');
  const selectedDayExpenses = expenses.filter((e) => e.date === selectedDayStr);
  const selectedDayTotalSpent = selectedDayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Recurrentes que caen en el día seleccionado respetando frecuencia
  const selectedDayRecurring = recurringRules.filter((r) => isRuleOnDate(r, selectedDay));
  const selectedDayRecurringTotal = selectedDayRecurring
    .filter((r) => r.costType !== 'none' && r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);

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
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Calendario & Cash-Flow</span>
          </h2>
          <p className="text-xs text-slate-400">
            Vencimientos futuros, liquidez proyectada y análisis interanual (YoY)
          </p>
        </div>

        {/* Selector de Pestañas de Vista */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setViewPeriod('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewPeriod === 'month'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewPeriod('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewPeriod === 'week'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewPeriod('yoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              viewPeriod === 'yoy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
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
          {/* Barra de Navegación de Mes/Semana */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-3xl">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrev}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-sm font-black text-white capitalize pl-1">
                {viewPeriod === 'month'
                  ? format(currentDate, 'MMMM yyyy', { locale: es })
                  : `Semana del ${format(weekStart, 'd MMM')} al ${format(weekEnd, 'd MMM yyyy', {
                      locale: es,
                    })}`}
              </span>
            </div>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
            >
              Hoy
            </button>
          </div>

          {/* Tarjetas de Cash-Flow Runway del Mes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gastado Real en el Mes</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {totalMonthSpent.toFixed(2)} {currency}
              </div>
              <span className="text-[11px] text-slate-500">
                {expensesInMonth.length} movimientos ejecutados
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Recurrentes Comprometidos</span>
              <div className="text-2xl font-black font-mono text-blue-400 mt-1">
                {monthlyRecurringTotal.toFixed(2)} {currency}
              </div>
              <span className="text-[11px] text-slate-500">Previsión fija del mes</span>
            </div>

            <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Saldo Proyectado Fin de Mes
              </span>
              <div
                className={`text-2xl font-black font-mono mt-1 ${
                  projectedBalanceEnd >= 0 ? 'text-white' : 'text-rose-400'
                }`}
              >
                {projectedBalanceEnd >= 0 ? '+' : ''}
                {projectedBalanceEnd.toFixed(2)} {currency}
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    projectedBalanceEnd > 400
                      ? 'bg-emerald-400'
                      : projectedBalanceEnd >= 0
                      ? 'bg-amber-400'
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

          {/* Rejilla de Días del Calendario */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl">
            {/* Cabecera de días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, idx) => (
                <span key={idx} className="text-[11px] font-bold text-slate-500 py-1 uppercase">
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

                // Recurrentes de este día
                const dayRecurring = recurringRules.filter((r) => isRuleOnDate(r, day));
                const totalDayRecurring = dayRecurring
                  .filter((r) => r.costType !== 'none' && r.amount > 0)
                  .reduce((sum, r) => sum + r.amount, 0);

                const hasHealthOrTask = dayRecurring.some(
                  (r) => r.costType === 'none' || r.categoryType === 'health' || r.categoryType === 'maintenance' || r.categoryType === 'personal'
                );
                const hasFinancialBill = dayRecurring.some((r) => r.costType !== 'none' && r.amount > 0);
                const hasActivity = dayExpenses.length > 0 || dayRecurring.length > 0;

                return (
                  <button
                    key={dayDateStr}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`h-16 p-1.5 rounded-2xl flex flex-col justify-between transition-all border text-left cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/40 shadow-lg'
                        : isToday(day)
                        ? 'border-emerald-500/60 bg-slate-900'
                        : hasActivity
                        ? 'border-slate-700/80 bg-slate-800/60 hover:border-slate-600'
                        : 'border-slate-800/40 bg-slate-950/30 hover:border-slate-800'
                    } ${!isCurrentMonth && viewPeriod === 'month' ? 'opacity-30' : 'opacity-100'}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-bold ${
                          isToday(day)
                            ? 'text-emerald-400 font-black'
                            : isSelected
                            ? 'text-white'
                            : 'text-slate-300'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Puntos de evento */}
                      <div className="flex items-center space-x-1">
                        {hasHealthOrTask && (
                          <span
                            className="w-2 h-2 rounded-full bg-purple-400 shadow-xs shadow-purple-400/50"
                            title="Tareas o citas periódicas programadas"
                          />
                        )}
                        {hasFinancialBill && (
                          <span
                            className="w-2 h-2 rounded-full bg-blue-400 shadow-xs shadow-blue-400/50"
                            title="Facturas o gastos previstos"
                          />
                        )}
                        {dayExpenses.length > 0 && (
                          <span
                            className="w-2 h-2 rounded-full bg-emerald-400"
                            title={`${dayExpenses.length} gastos realizados`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Desglose resumido de importes */}
                    <div className="w-full truncate">
                      {totalDaySpent > 0 && (
                        <div className="text-[10px] font-mono font-bold text-rose-300 truncate">
                          -{totalDaySpent.toFixed(0)} {currency}
                        </div>
                      )}
                      {totalDayRecurring > 0 && totalDaySpent === 0 && (
                        <div className="text-[10px] font-mono font-bold text-blue-300 truncate">
                          ~{totalDayRecurring.toFixed(0)} {currency}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Detalle del Día Seleccionado */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span>
                    Detalle del {format(selectedDay, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  {selectedDayExpenses.length} gastos ejecutados • {selectedDayRecurring.length} pagos programados
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total del Día</span>
                <div className="text-base font-mono font-black text-emerald-400">
                  {(selectedDayTotalSpent + selectedDayRecurringTotal).toFixed(2)} {currency}
                </div>
              </div>
            </div>

            {/* Listado de Actos y Vencimientos Programados para este día */}
            {selectedDayRecurring.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Actos y Recordatorios Previstos para este Día:</span>
                </span>

                <div className="space-y-2">
                  {selectedDayRecurring.map((rule) => {
                    const bucket = buckets.find((b) => b.id === rule.bucketId);
                    const isTask = rule.costType === 'none' || !rule.amount || rule.amount <= 0;
                    const isEstimated = rule.costType === 'estimated';

                    let categoryBadge = '💳 Recibo';
                    if (rule.categoryType === 'health') categoryBadge = '🩺 Salud / Lentillas';
                    else if (rule.categoryType === 'maintenance') categoryBadge = '🔧 Mantenimiento';
                    else if (rule.categoryType === 'tax') categoryBadge = '🏛️ Impuesto';
                    else if (rule.categoryType === 'personal') categoryBadge = '🎂 Personal';
                    else if (rule.categoryType === 'subscription') categoryBadge = '🔁 Suscripción';

                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${
                          isTask
                            ? 'bg-purple-950/20 border-purple-500/30'
                            : isEstimated
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-blue-950/20 border-blue-500/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{rule.title}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                              {categoryBadge}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {bucket?.name || 'General'} • {rule.frequency}
                            {rule.reminderOffsets && rule.reminderOffsets.length > 0 && (
                              <span className="text-slate-500"> • {rule.reminderOffsets.length} alertas</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-white mr-1">
                            {isTask ? (
                              <span className="text-purple-300 text-[11px] font-semibold">Sin coste</span>
                            ) : isEstimated ? (
                              <span className="text-amber-300 font-black">~{rule.amount.toFixed(2)} {currency}</span>
                            ) : (
                              <span>{rule.amount.toFixed(2)} {currency}</span>
                            )}
                          </span>
                          <button
                            onClick={() => handlePayRecurringNow(rule)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>{isTask ? 'Completar' : isEstimated ? 'Confirmar' : 'Pagar'}</span>
                          </button>
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
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gastos Registrados:</span>
                </span>

                <div className="space-y-2">
                  {selectedDayExpenses.map((exp) => {
                    const bucket = buckets.find((b) => b.id === exp.bucketId);
                    return (
                      <div
                        key={exp.id}
                        className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{exp.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {bucket?.name || 'General'} {exp.supplier ? `• ${exp.supplier}` : ''}
                          </div>
                        </div>
                        <div className="text-xs font-mono font-bold text-rose-300">
                          -{exp.amount.toFixed(2)} {currency}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              selectedDayRecurring.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-500">
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
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Análisis Comparativo Interanual</span>
              </h3>
              <p className="text-xs text-slate-400">
                Compara el gasto total y la variación porcentual entre dos ejercicios
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={compareYearA}
                onChange={(e) => setCompareYearA(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>
                    Año A: {y}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold text-slate-500">vs</span>

              <select
                value={compareYearB}
                onChange={(e) => setCompareYearB(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-400"
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
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gasto Total {compareYearA}</span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {dataYearA.totalYear.toFixed(2)} {currency}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gasto Total {compareYearB}</span>
              <div className="text-2xl font-black font-mono text-slate-300 mt-1">
                {dataYearB.totalYear.toFixed(2)} {currency}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Variación Interanual</span>
              <div
                className={`text-2xl font-black font-mono mt-1 flex items-center gap-1.5 ${
                  diffYear <= 0 ? 'text-emerald-400' : 'text-rose-400'
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
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                      <span className="font-bold text-slate-300 w-10">{lbl}</span>
                      <div className="space-x-3 text-right font-mono text-[11px]">
                        <span className="text-emerald-400 font-bold">
                          {compareYearA}: {valA.toFixed(0)} {currency}
                        </span>
                        <span className="text-slate-500">
                          {compareYearB}: {valB.toFixed(0)} {currency}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full flex gap-1 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pctA / 2}%` }}
                      />
                      <div
                        className="h-full bg-slate-600 rounded-full transition-all duration-500"
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
