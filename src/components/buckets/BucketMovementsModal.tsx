import React, { useState } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  FileText,
  DollarSign,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bucket, Expense, ExtraIncome, Settings } from '../../types';
import { IncomeAllocationService } from '../../services/incomeAllocationService';
import { MASTER_ICON_MAP } from '../../constants/icons';
import { usePrivacy } from '../../context/PrivacyContext';

interface BucketMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucket: Bucket | null;
  monthPrefix: string; // 'YYYY-MM'
  monthLabel: string;  // 'Septiembre 2026'
  expenses: Expense[];
  settings?: Settings;
  currency: string;
}

type MovementFilter = 'all' | 'expenses' | 'incomes';

interface UnifiedMovement {
  id: string;
  type: 'expense' | 'refund' | 'budget_injection';
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  categoryOrSupplier?: string;
}

export const BucketMovementsModal: React.FC<BucketMovementsModalProps> = ({
  isOpen,
  onClose,
  bucket,
  monthPrefix,
  monthLabel,
  expenses,
  settings,
  currency,
}) => {
  const { isPrivate } = usePrivacy();
  const [filter, setFilter] = useState<MovementFilter>('all');

  if (!isOpen || !bucket) return null;

  const IconComp = MASTER_ICON_MAP[bucket.icon] || Wallet;

  // 1. Gastos de la bolsa en este mes
  const bucketExpenses = expenses.filter(
    (e) => e.bucketId === bucket.id && (e.date || '').startsWith(monthPrefix)
  );
  const grossExpensesTotal = bucketExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 2. Ingresos asignados a la bolsa en este mes
  const allocatedIncomes = IncomeAllocationService.getBucketAllocatedIncomes(
    bucket.id,
    monthPrefix,
    settings
  );
  const refundsTotal = IncomeAllocationService.getBucketRefunds(bucket.id, monthPrefix, settings);
  const injectionsTotal = IncomeAllocationService.getBucketInjectedBudget(
    bucket.id,
    monthPrefix,
    settings
  );

  // 3. Totales de límite y saldo neto
  const accumulated = bucket.rolloverSurplus ? (bucket.accumulatedSurplus || 0) : 0;
  const effectiveLimit = bucket.budgetLimit + accumulated + injectionsTotal;
  const netSpent = Math.max(0, grossExpensesTotal - refundsTotal);
  const isOver = netSpent > effectiveLimit;
  const diff = effectiveLimit - netSpent;
  const remaining = isOver ? 0 : diff;
  const deficit = isOver ? netSpent - effectiveLimit : 0;

  // 4. Crear lista unificada de movimientos
  const movements: UnifiedMovement[] = [
    ...bucketExpenses.map((e) => ({
      id: e.id,
      type: 'expense' as const,
      title: e.title,
      amount: e.amount,
      date: (e.date || '').split('T')[0],
      notes: e.notes,
      categoryOrSupplier: e.supplier || (e.isInvoice ? 'Con Factura' : undefined),
    })),
    ...allocatedIncomes.map((inc) => ({
      id: inc.id,
      type: (inc.allocationMode === 'bucket_refund' ? 'refund' : 'budget_injection') as
        | 'refund'
        | 'budget_injection',
      title: inc.title,
      amount: inc.amount,
      date: (inc.date || '').split('T')[0],
      notes: inc.notes,
      categoryOrSupplier:
        inc.allocationMode === 'bucket_refund' ? 'Reembolso / Devolución' : 'Inyección de presupuesto',
    })),
  ];

  // Ordenar cronológicamente (más recientes primero)
  movements.sort((a, b) => b.date.localeCompare(a.date));

  // Filtrado según pestaña
  const filteredMovements = movements.filter((m) => {
    if (filter === 'expenses') return m.type === 'expense';
    if (filter === 'incomes') return m.type === 'refund' || m.type === 'budget_injection';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-white">
        {/* Luz ambiental en cabecera */}
        <div
          className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: bucket.color }}
        />

        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: bucket.color }}
            >
              <IconComp className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {bucket.name}
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 capitalize">
                  {monthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Desglose integral de gastos, reembolsos e inyecciones de la bolsa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuadrícula de KPIs Financieros */}
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Límite Efectivo */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Límite Mensual
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {isPrivate ? '••••' : effectiveLimit.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                Base: {isPrivate ? '••••' : bucket.budgetLimit.toFixed(0)}€{injectionsTotal > 0 ? ` +${injectionsTotal.toFixed(0)}€ extra` : ''}
              </span>
            </div>

            {/* Gasto Bruto */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Gasto Bruto ({bucketExpenses.length})
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                {isPrivate ? '••••' : grossExpensesTotal.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                Total registrado
              </span>
            </div>

            {/* Reembolsos */}
            <div className="p-3 rounded-2xl bg-cyan-50/80 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 shadow-xs">
              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block truncate">
                Reembolsos
              </span>
              <div className="text-base font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                +{isPrivate ? '••••' : refundsTotal.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate block">
                Minoran gasto
              </span>
            </div>

            {/* Saldo / Exceso */}
            <div
              className={`p-3 rounded-2xl border shadow-xs ${
                isOver
                  ? 'bg-rose-50/80 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
                  : 'bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
                  isOver ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {isOver ? 'Exceso / Déficit' : 'Disponible'}
              </span>
              <div
                className={`text-base font-mono font-black mt-0.5 ${
                  isOver ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {isOver
                  ? `+${isPrivate ? '••••' : deficit.toFixed(2)} ${currency}`
                  : `${isPrivate ? '••••' : remaining.toFixed(2)} ${currency}`}
              </div>
              <span
                className={`text-[10px] truncate block ${
                  isOver ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                Neto: {isPrivate ? '••••' : netSpent.toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtro de Movimientos */}
        <div className="px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('expenses')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'expenses'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Gastos ({bucketExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('incomes')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'incomes'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Reembolsos ({allocatedIncomes.length})
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
            Neto: {isPrivate ? '••••' : netSpent.toFixed(2)} {currency}
          </div>
        </div>

        {/* Lista Cronológica de Movimientos (Scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-2.5 flex-1 pr-2">
          {filteredMovements.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Sin movimientos registrados
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                No hay movimientos para esta bolsa en {monthLabel} con el filtro seleccionado.
              </p>
            </div>
          ) : (
            filteredMovements.map((item) => {
              const isExpense = item.type === 'expense';
              const isRefund = item.type === 'refund';
              const isInjection = item.type === 'budget_injection';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isExpense
                      ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : isRefund
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-500/30'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isExpense
                          ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                          : isRefund
                          ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                      }`}
                    >
                      {isExpense ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : isRefund ? (
                        <ArrowRightLeft className="w-4 h-4" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {isRefund && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/40">
                            Reembolso
                          </span>
                        )}
                        {isInjection && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/40">
                            Inyección extra
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                        {item.categoryOrSupplier && (
                          <>
                            <span>•</span>
                            <span className="truncate">{item.categoryOrSupplier}</span>
                          </>
                        )}
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span
                      className={`text-xs font-bold ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : isRefund
                          ? 'text-cyan-600 dark:text-cyan-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {isPrivate ? '••••' : item.amount.toFixed(2)}&nbsp;{currency}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal con Resumen Aritmético */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
            <span>Aritmética neta:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {isPrivate ? '••••' : grossExpensesTotal.toFixed(2)}€ bruto
            </span>
            <span>-</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {isPrivate ? '••••' : refundsTotal.toFixed(2)}€ reembolso
            </span>
            <span>=</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {isPrivate ? '••••' : netSpent.toFixed(2)}€ neto
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
