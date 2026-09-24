import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Receipt, FileText } from 'lucide-react';
import { Expense, RecurringRule, Bucket } from '../../types';

interface CalendarViewProps {
  expenses: Expense[];
  recurringRules: RecurringRule[];
  buckets: Bucket[];
  currency: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  expenses,
  recurringRules,
  buckets,
  currency,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const prevMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(year, month + 1, 1));
  };

  // Días del mes
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // 0 = Lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formattedMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Gastos registrados en este mes
  const expensesInMonth = expenses.filter((e) => (e.date || '').startsWith(formattedMonthStr));
  const totalMonthExpenses = expensesInMonth.reduce((acc, curr) => acc + curr.amount, 0);

  // Recurrentes esperados este mes
  const expectedRecurring = recurringRules.reduce((acc, curr) => acc + curr.amount, 0);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <span>Calendario de Vencimientos</span>
          </h2>
          <p className="text-xs text-slate-400">Previsión temporal y fechas de cobro o pago</p>
        </div>

        {/* Selector de Mes */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={prevMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-200 px-2 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Gastado en el mes</span>
          <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
            {totalMonthExpenses.toFixed(2)} {currency}
          </div>
        </div>
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400">Recurrentes esperados</span>
          <div className="text-lg font-black font-mono text-blue-400 mt-0.5">
            {expectedRecurring.toFixed(2)} {currency}
          </div>
        </div>
      </div>

      {/* Grid Calendario */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, idx) => (
            <span key={idx} className="text-[11px] font-bold text-slate-500 py-1">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Espacios vacíos antes del primer día */}
          {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-950/30" />
          ))}

          {/* Días del mes */}
          {daysArray.map((day) => {
            const dateStr = `${formattedMonthStr}-${String(day).padStart(2, '0')}`;
            const dayExpenses = expensesInMonth.filter((e) => e.date === dateStr);
            const dayRecurring = recurringRules.filter((r) => r.dayOfMonth === day);
            const hasActivity = dayExpenses.length > 0 || dayRecurring.length > 0;
            const totalDay = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

            const isToday =
              new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div
                key={day}
                className={`h-14 p-1 rounded-xl flex flex-col justify-between transition-all border ${
                  isToday
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : hasActivity
                    ? 'border-slate-700 bg-slate-800/60'
                    : 'border-slate-800/40 bg-slate-950/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold ${
                      isToday ? 'text-emerald-400 font-black' : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {dayRecurring.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Vencimiento recurrente" />
                  )}
                </div>

                {dayExpenses.length > 0 && (
                  <div className="text-[9px] font-mono font-bold text-rose-300 truncate">
                    -{totalDay.toFixed(0)}{currency}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista de Próximos Vencimientos Recurrentes */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Vencimientos Recurrentes Programados</span>
        </h3>

        {recurringRules.length === 0 ? (
          <p className="text-xs text-slate-500">No hay reglas de cobro o pago recurrentes configuradas.</p>
        ) : (
          <div className="space-y-2">
            {recurringRules
              .slice()
              .sort((a, b) => (a.dayOfMonth || 1) - (b.dayOfMonth || 1))
              .map((rule) => {
                const bucket = buckets.find((b) => b.id === rule.bucketId);
                return (
                  <div
                    key={rule.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                        {rule.dayOfMonth || 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{rule.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {bucket?.name || 'General'} • Día {rule.dayOfMonth || 1} de cada mes
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-mono font-bold text-white">
                      {rule.amount.toFixed(2)} {currency}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
