import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  GitMerge,
  ShieldCheck,
  CheckSquare,
  Square,
  Wallet,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { Bucket, Expense, ExtraIncome, RecurringRule, Settings, getExpenseEffectiveMonth } from '../../types';
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
  recurringRules?: RecurringRule[];
  onDeleteExpense?: (id: string) => void;
  onReconcileExpenses?: (bankExpenseId: string, recurringExpenseId: string) => void;
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
  originalExpense?: Expense;
}

interface DuplicateCandidatePair {
  bankExpense: Expense;
  recurringExpense: Expense;
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
  recurringRules = [],
  onDeleteExpense,
  onReconcileExpenses,
}) => {
  const { isPrivate } = usePrivacy();
  const [filter, setFilter] = useState<MovementFilter>('all');

  // Estados de doble conformidad para eliminación
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null);
  const [deleteConfirmedCheck, setDeleteConfirmedCheck] = useState(false);

  // Estados de doble conformidad para fusión / conciliación
  const [mergePair, setMergePair] = useState<DuplicateCandidatePair | null>(null);
  const [mergeConfirmedCheck, setMergeConfirmedCheck] = useState(false);
  const [manualMergeSource, setManualMergeSource] = useState<Expense | null>(null);

  if (!isOpen || !bucket) return null;

  const IconComp = MASTER_ICON_MAP[bucket.icon] || Wallet;

  // 1. Gastos de la bolsa en este mes (respetando mes efectivo de imputación)
  const bucketExpenses = useMemo(() => {
    return expenses.filter(
      (e) => e.bucketId === bucket.id && getExpenseEffectiveMonth(e) === monthPrefix
    );
  }, [expenses, bucket.id, monthPrefix]);

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
      originalExpense: e,
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

  // 5. Detección automática de candidatos a duplicidad / conciliación
  const duplicatePairs = useMemo<DuplicateCandidatePair[]>(() => {
    const pairs: DuplicateCandidatePair[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < bucketExpenses.length; i++) {
      for (let j = i + 1; j < bucketExpenses.length; j++) {
        const a = bucketExpenses[i];
        const b = bucketExpenses[j];

        if (usedIds.has(a.id) || usedIds.has(b.id)) continue;

        // Mismo importe exacto
        if (Math.abs(a.amount - b.amount) < 0.01) {
          const aIsRecurring = Boolean(a.recurringRuleId) || (a.id || '').startsWith('exp_rec_') || (a.notes || '').includes('automático');
          const bIsRecurring = Boolean(b.recurringRuleId) || (b.id || '').startsWith('exp_rec_') || (b.notes || '').includes('automático');

          if (aIsRecurring && !bIsRecurring) {
            pairs.push({ bankExpense: b, recurringExpense: a });
            usedIds.add(a.id);
            usedIds.add(b.id);
          } else if (bIsRecurring && !aIsRecurring) {
            pairs.push({ bankExpense: a, recurringExpense: b });
            usedIds.add(a.id);
            usedIds.add(b.id);
          } else if (!aIsRecurring && !bIsRecurring && (a.title.toLowerCase().includes(b.title.toLowerCase().substring(0, 5)) || b.title.toLowerCase().includes(a.title.toLowerCase().substring(0, 5)))) {
            // Mismo importe y conceptos análogos
            pairs.push({ bankExpense: a, recurringExpense: b });
            usedIds.add(a.id);
            usedIds.add(b.id);
          }
        }
      }
    }
    return pairs;
  }, [bucketExpenses]);

  // Manejo de eliminación con doble paso
  const handleOpenDelete = (expense: Expense) => {
    setDeleteCandidate(expense);
    setDeleteConfirmedCheck(false);
  };

  const handleExecuteDelete = () => {
    if (!deleteCandidate || !onDeleteExpense || !deleteConfirmedCheck) return;
    onDeleteExpense(deleteCandidate.id);
    setDeleteCandidate(null);
    setDeleteConfirmedCheck(false);
  };

  // Manejo de conciliación con doble paso
  const handleOpenMerge = (pair: DuplicateCandidatePair) => {
    setMergePair(pair);
    setMergeConfirmedCheck(false);
  };

  const handleExecuteMerge = () => {
    if (!mergePair || !onReconcileExpenses || !mergeConfirmedCheck) return;
    onReconcileExpenses(mergePair.bankExpense.id, mergePair.recurringExpense.id);
    setMergePair(null);
    setMergeConfirmedCheck(false);
  };

  const handleStartManualMerge = (sourceExp: Expense) => {
    // Buscar si hay algún otro gasto en la bolsa con el mismo importe
    const candidate = bucketExpenses.find(
      (e) => e.id !== sourceExp.id && Math.abs(e.amount - sourceExp.amount) < 0.01
    );
    if (candidate) {
      const isCandidateRecurring = Boolean(candidate.recurringRuleId) || (candidate.id || '').startsWith('exp_rec_');
      const isSourceRecurring = Boolean(sourceExp.recurringRuleId) || (sourceExp.id || '').startsWith('exp_rec_');

      if (isCandidateRecurring && !isSourceRecurring) {
        handleOpenMerge({ bankExpense: sourceExp, recurringExpense: candidate });
      } else if (isSourceRecurring && !isCandidateRecurring) {
        handleOpenMerge({ bankExpense: candidate, recurringExpense: sourceExp });
      } else {
        handleOpenMerge({ bankExpense: sourceExp, recurringExpense: candidate });
      }
    } else {
      setManualMergeSource(sourceExp);
    }
  };

  // Regla recurrente asociada al candidato a eliminación (si existe)
  const candidateRecurringRule = deleteCandidate?.recurringRuleId
    ? recurringRules.find((r) => r.id === deleteCandidate.recurringRuleId)
    : undefined;

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
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: bucket.color }}
            >
              <IconComp className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {bucket.name}
                </h2>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 capitalize shrink-0">
                  {monthLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Desglose integral de movimientos, conciliación y auditoría de bolsa
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

        {/* Alerta de Duplicidad Detectada (si existen pares) */}
        {duplicatePairs.length > 0 && (
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate">
                  Posible duplicidad detectada ({duplicatePairs.length}):
                </p>
                <p className="text-[11px] text-amber-600 dark:text-amber-400/90 truncate">
                  '{duplicatePairs[0].bankExpense.title}' ({duplicatePairs[0].bankExpense.amount.toFixed(2)} {currency}) coincide con cobro programado.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenMerge(duplicatePairs[0])}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-auto"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Conciliar Ahora</span>
            </button>
          </div>
        )}

        {/* Cuadrícula de KPIs Financieros */}
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Límite Efectivo */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs min-w-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Límite Mensual
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {isPrivate ? '••••' : effectiveLimit.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                Base: {isPrivate ? '••••' : bucket.budgetLimit.toFixed(0)}€{injectionsTotal > 0 ? ` +${injectionsTotal.toFixed(0)}€ extra` : ''}
              </span>
            </div>

            {/* Gasto Bruto */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs min-w-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                Gasto Bruto ({bucketExpenses.length})
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {isPrivate ? '••••' : grossExpensesTotal.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                Total registrado
              </span>
            </div>

            {/* Reembolsos */}
            <div className="p-3 rounded-2xl bg-cyan-50/80 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 shadow-xs min-w-0">
              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block truncate">
                Reembolsos
              </span>
              <div className="text-base font-mono font-bold text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">
                +{isPrivate ? '••••' : refundsTotal.toFixed(2)}&nbsp;{currency}
              </div>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-300 truncate block">
                Minoran gasto
              </span>
            </div>

            {/* Saldo / Exceso */}
            <div
              className={`p-3 rounded-2xl border shadow-xs min-w-0 ${
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
                className={`text-base font-mono font-black mt-0.5 truncate ${
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

          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block shrink-0">
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
              const isRecurring = Boolean(item.originalExpense?.recurringRuleId) || (item.originalExpense?.id || '').startsWith('exp_rec_');
              const isBankImport = Boolean(item.originalExpense?.rawHash || item.originalExpense?.importBatchId);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 min-w-0 ${
                    isExpense
                      ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      : isRefund
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-500/30'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                  }`}
                >
                  {/* Bloque Izquierdo: Icono e Información */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-full">
                          {item.title}
                        </span>
                        {isRefund && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/40 shrink-0">
                            Reembolso
                          </span>
                        )}
                        {isInjection && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/40 shrink-0">
                            Inyección extra
                          </span>
                        )}
                        {isRecurring && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                            Recurrente
                          </span>
                        )}
                        {isBankImport && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-500/30 shrink-0">
                            Banco
                          </span>
                        )}
                        {isExpense && item.originalExpense?.effectiveMonth && item.originalExpense.effectiveMonth !== item.date.substring(0, 7) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30 shrink-0 max-w-full truncate">
                            🗓️ Compra {item.date.split('-').slice(1).reverse().join('/')} &rarr; Imputado a {monthLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 min-w-0">
                        <span className="flex items-center gap-1 font-mono shrink-0">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.date}
                        </span>
                        {item.categoryOrSupplier && (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="truncate">{item.categoryOrSupplier}</span>
                          </>
                        )}
                        {item.notes && (
                          <>
                            <span className="shrink-0">•</span>
                            <span className="italic truncate">{item.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloque Derecho: Importe y Botones de Acción */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right font-mono shrink-0">
                      <span
                        className={`text-xs sm:text-sm font-bold block ${
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

                    {/* Acciones para Gastos: Conciliar y Eliminar con Doble Conformidad */}
                    {isExpense && item.originalExpense && (
                      <div className="flex items-center gap-1 shrink-0">
                        {onReconcileExpenses && (
                          <button
                            type="button"
                            onClick={() => handleStartManualMerge(item.originalExpense!)}
                            title="Conciliar / Unificar apunte duplicado"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                          >
                            <GitMerge className="w-4 h-4" />
                          </button>
                        )}
                        {onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item.originalExpense!)}
                            title="Eliminar este apunte puntual de la bolsa"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal con Resumen Aritmético */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] flex-wrap">
            <span>Aritmética neta:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
              {isPrivate ? '••••' : grossExpensesTotal.toFixed(2)}€ bruto
            </span>
            <span>-</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 shrink-0">
              {isPrivate ? '••••' : refundsTotal.toFixed(2)}€ reembolso
            </span>
            <span>=</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
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

      {/* ========================================================================= */}
      {/* MODAL DE DOBLE PASO DE CONFORMIDAD: ELIMINACIÓN SEGURA                    */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white space-y-4">
            {/* Cabecera */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold truncate">Eliminar Apunte</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider shrink-0">
                    Paso 1 de 2
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Confirmación de seguridad con doble conformidad
                </p>
              </div>
            </div>

            {/* Ficha Resumen del Movimiento */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {deleteCandidate.title}
                </span>
                <span className="text-sm font-mono font-black text-rose-600 dark:text-rose-400 shrink-0">
                  -{deleteCandidate.amount.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-mono">{deleteCandidate.date}</span>
                <span>•</span>
                <span className="truncate">{bucket.name}</span>
              </div>
              {deleteCandidate.notes && (
                <p className="text-[11px] italic text-slate-400 dark:text-slate-500 truncate">
                  {deleteCandidate.notes}
                </p>
              )}
            </div>

            {/* Aviso de Protección de Regla Recurrente */}
            {deleteCandidate.recurringRuleId ? (
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs text-indigo-900 dark:text-indigo-200 space-y-0.5">
                  <p className="font-bold">Regla recurrente protegida</p>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                    Esta acción solo suprime este apunte puntual. La regla recurrente continuará activa para los próximos meses y no se volverá a regenerar para esta fecha.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Este apunte contable se retirará de la bolsa. El saldo disponible se actualizará de inmediato.
              </p>
            )}

            {/* Paso 1: Checkbox explícito de conformidad */}
            <div
              onClick={() => setDeleteConfirmedCheck(!deleteConfirmedCheck)}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center gap-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {deleteConfirmedCheck ? (
                <CheckSquare className="w-5 h-5 text-rose-500 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                He revisado este apunte y confirmo que deseo eliminarlo permanentemente
              </span>
            </div>

            {/* Paso 2: Botones de Acción */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDeleteCandidate(null);
                  setDeleteConfirmedCheck(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!deleteConfirmedCheck}
                onClick={handleExecuteDelete}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  deleteConfirmedCheck
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Paso 2: Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE DOBLE PASO DE CONFORMIDAD: CONCILIACIÓN / FUSIÓN SEGURA          */}
      {/* ========================================================================= */}
      {mergePair && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white space-y-4">
            {/* Cabecera */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-500/30">
                <GitMerge className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold truncate">Conciliación de Duplicados</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold uppercase tracking-wider shrink-0">
                    Paso 1 de 2
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Unificar apunte bancario con regla recurrente
                </p>
              </div>
            </div>

            {/* Comparativa de los dos apuntes */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Apuntes a unificar en un solo movimiento:
              </div>

              {/* Registro 1: Extracto Bancario */}
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-500/30 text-amber-800 dark:text-amber-300 font-bold uppercase">
                      Extracto Bancario
                    </span>
                    <span className="text-xs font-bold truncate">{mergePair.bankExpense.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Fecha: {mergePair.bankExpense.date}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0">
                  -{mergePair.bankExpense.amount.toFixed(2)} {currency}
                </span>
              </div>

              {/* Registro 2: Cobro Recurrente */}
              <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-200 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-300 font-bold uppercase">
                      Cobro Recurrente
                    </span>
                    <span className="text-xs font-bold truncate">{mergePair.recurringExpense.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    Fecha: {mergePair.recurringExpense.date}
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
                  -{mergePair.recurringExpense.amount.toFixed(2)} {currency}
                </span>
              </div>
            </div>

            {/* Resumen del Resultado Financiero */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-0.5">
                <p className="font-bold">Corrección contable exacta</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Se conservará el extracto bancario oficial vinculado a la regla recurrente. Se suprimirá el apunte automático duplicado, reduciendo el déficit de la bolsa en{' '}
                  <strong className="font-mono font-bold">{mergePair.recurringExpense.amount.toFixed(2)} {currency}</strong>.
                </p>
              </div>
            </div>

            {/* Paso 1: Checkbox explícito de conformidad */}
            <div
              onClick={() => setMergeConfirmedCheck(!mergeConfirmedCheck)}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center gap-3 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {mergeConfirmedCheck ? (
                <CheckSquare className="w-5 h-5 text-cyan-500 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Confirmo la concordancia y la unificación de ambos apuntes en un único movimiento
              </span>
            </div>

            {/* Paso 2: Botones de Acción */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMergePair(null);
                  setMergeConfirmedCheck(false);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!mergeConfirmedCheck}
                onClick={handleExecuteMerge}
                className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                  mergeConfirmedCheck
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                <GitMerge className="w-4 h-4" />
                <span>Paso 2: Confirmar Conciliación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal auxiliar cuando no se encuentra pareja automática para conciliar */}
      {manualMergeSource && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 text-slate-900 dark:text-white space-y-3">
            <h3 className="text-sm font-bold">Sin apunte coincidente</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No se ha encontrado otro apunte de {manualMergeSource.amount.toFixed(2)} {currency} en esta bolsa para este mes con el que conciliar automáticamente.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setManualMergeSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
