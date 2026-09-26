import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
  AlertTriangle,
  FileText,
  Filter,
  Trash2,
  Edit2,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { Expense, Bucket, Settings, RecurringRule } from '../../types';
import { SafeToSpendService } from '../../services/safeToSpendService';
import { SafeToSpendWidget } from './SafeToSpendWidget';

interface DashboardProps {
  expenses: Expense[];
  buckets: Bucket[];
  recurringRules?: RecurringRule[];
  settings: Settings;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onSelectBucketTab: () => void;
  onSelectRecurringTab?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  expenses,
  buckets,
  recurringRules = [],
  settings,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onSelectBucketTab,
  onSelectRecurringTab,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'invoices' | 'pending'>('all');
  const currency = settings.currency || '€';
  const monthlyIncome = settings.monthlyIncome || 0;

  // Filtrar gastos del mes actual (YYYY-MM)
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentMonthExpenses = expenses.filter((e) =>
    (e.date || '').startsWith(currentMonthPrefix)
  );

  const totalSpentMonth = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = monthlyIncome - totalSpentMonth;

  // Cálculo del motor Safe-to-Spend
  const safeMetrics = SafeToSpendService.calculate(
    expenses,
    recurringRules,
    buckets,
    monthlyIncome
  );

  // Facturas e IVA desgravable
  const invoiceExpenses = currentMonthExpenses.filter((e) => e.isInvoice);
  const totalInvoiced = invoiceExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalTaxDeductible = invoiceExpenses.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);

  // Gastos filtrados para la lista
  const filteredList = expenses.filter((e) => {
    if (filterType === 'invoices') return e.isInvoice;
    if (filterType === 'pending') return e.status === 'pending';
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* 0. Widget Hero de Gasto Diario Seguro (Safe-to-Spend) */}
      <SafeToSpendWidget
        metrics={safeMetrics}
        currency={currency}
        onOpenRecurringTab={onSelectRecurringTab}
        onOpenBucketsTab={onSelectBucketTab}
      />

      {/* 1. Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Gastos Totales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gastos Mes</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">
            {totalSpentMonth.toFixed(2)}
            <span className="text-sm text-slate-400 ml-1">{currency}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {currentMonthExpenses.length} movimientos registrados
          </div>
        </div>

        {/* Saldo Restante / Ahorro */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Disponible</span>
            <div
              className={`p-1.5 rounded-lg ${
                remainingBudget >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {remainingBudget >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black font-mono ${
              remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {remainingBudget >= 0 ? '+' : ''}
            {remainingBudget.toFixed(2)}
            <span className="text-sm opacity-70 ml-1">{currency}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            De {monthlyIncome.toFixed(0)} {currency} ingresos
          </div>
        </div>

        {/* Facturación y Deducible */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Facturas</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-teal-300">
            {totalInvoiced.toFixed(2)}
            <span className="text-sm text-slate-400 ml-1">{currency}</span>
          </div>
          <div className="text-[10px] text-teal-400/80 mt-1">
            {invoiceExpenses.length} con factura oficial
          </div>
        </div>

        {/* IVA Desgravable Estimado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">IVA Deducible</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-blue-300">
            {totalTaxDeductible.toFixed(2)}
            <span className="text-sm text-slate-400 ml-1">{currency}</span>
          </div>
          <div className="text-[10px] text-blue-400/80 mt-1">Deducción fiscal directa</div>
        </div>
      </div>

      {/* Botón Flotante / Destacado Añadir Gasto */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Estado de Presupuestos</h2>
          <p className="text-xs text-slate-400">Monitoreo activo por bolsas financieras</p>
        </div>
        <button
          onClick={onAddExpense}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo Gasto</span>
        </button>
      </div>

      {/* 2. Barra de Progreso de Bolsas (Buckets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {buckets.map((bucket) => {
          const bucketExpenses = currentMonthExpenses.filter((e) => e.bucketId === bucket.id);
          const spent = bucketExpenses.reduce((sum, e) => sum + e.amount, 0);
          const limit = bucket.budgetLimit || 1;
          const percentage = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;

          return (
            <div
              key={bucket.id}
              onClick={onSelectBucketTab}
              className={`p-3.5 rounded-2xl bg-slate-900/90 border cursor-pointer hover:border-slate-700 transition-all ${
                bucket.isBuffer
                  ? 'border-purple-500/40 bg-purple-950/15'
                  : isOver
                  ? 'border-rose-500/40'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="text-xs font-bold text-slate-200">{bucket.name}</span>
                  {bucket.isBuffer && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Colchón
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono font-bold">
                  <span className={isOver ? 'text-rose-400' : 'text-slate-200'}>
                    {spent.toFixed(1)}
                  </span>
                  <span className="text-slate-500"> / {limit} {currency}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: isOver ? '#f43f5e' : bucket.color,
                  }}
                />
              </div>

              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
                <span>{percentage}% utilizado</span>
                <span>
                  {isOver ? (
                    <span className="text-rose-400 font-bold">Excedido en {(spent - limit).toFixed(1)} {currency}</span>
                  ) : (
                    <span>Restan {(limit - spent).toFixed(1)} {currency}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Lista de Movimientos / Gastos Recientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-white">Movimientos Recientes</h2>
          {/* Filtros */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({expenses.length})
            </button>
            <button
              onClick={() => setFilterType('invoices')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterType === 'invoices'
                  ? 'bg-slate-800 text-teal-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facturas ({expenses.filter((e) => e.isInvoice).length})
            </button>
            <button
              onClick={() => setFilterType('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                filterType === 'pending'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-2">
            <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No hay movimientos registrados</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Presiona el botón de "Nuevo Gasto" para empezar a registrar compras y facturas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredList.slice(0, 15).map((expense) => {
              const bucket = buckets.find((b) => b.id === expense.bucketId);

              return (
                <div
                  key={expense.id}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                      style={{
                        backgroundColor: `${bucket?.color || '#10b981'}15`,
                        borderColor: `${bucket?.color || '#10b981'}40`,
                        color: bucket?.color || '#10b981',
                      }}
                    >
                      {expense.isInvoice ? <Receipt className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white truncate">
                          {expense.title}
                        </span>
                        {expense.isInvoice && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono font-bold">
                            FACTURA
                          </span>
                        )}
                        {expense.status === 'pending' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            PENDIENTE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                        <span>{expense.date}</span>
                        <span>•</span>
                        <span style={{ color: bucket?.color }}>{bucket?.name || 'General'}</span>
                        {expense.invoiceNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">Nº {expense.invoiceNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black font-mono text-white">
                        -{expense.amount.toFixed(2)} {currency}
                      </div>
                      {expense.isInvoice && expense.taxAmount ? (
                        <div className="text-[10px] text-teal-400 font-mono">
                          IVA: {expense.taxAmount.toFixed(2)} {currency}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center space-x-1 pl-1">
                      <button
                        onClick={() => onEditExpense(expense)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar gasto "${expense.title}"?`)) {
                            onDeleteExpense(expense.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
