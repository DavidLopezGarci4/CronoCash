import React, { useState } from 'react';
import { X, Plus, Check, Receipt, Tag, Calendar, DollarSign, Building, Sparkles, Repeat } from 'lucide-react';
import { Expense, Bucket, SmartRule, RecurringRule } from '../../types';
import { HapticService } from '../../services/hapticService';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  buckets: Bucket[];
  currency: string;
  initialExpense?: Expense | null;
  smartRules?: SmartRule[];
  recurringRules?: RecurringRule[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  buckets,
  currency,
  initialExpense,
  smartRules = [],
  recurringRules = [],
}) => {
  const [title, setTitle] = useState(initialExpense?.title || '');
  const [amount, setAmount] = useState(initialExpense?.amount ? String(initialExpense.amount) : '');
  const initialDate = initialExpense?.date || new Date().toISOString().split('T')[0];
  const [bucketId, setBucketId] = useState(
    initialExpense?.bucketId || (buckets.length > 0 ? buckets[0].id : '')
  );
  const [date, setDate] = useState(initialDate);
  const [effectiveMonth, setEffectiveMonth] = useState(
    initialExpense?.effectiveMonth || initialDate.substring(0, 7)
  );
  const [isCustomEffectiveMonth, setIsCustomEffectiveMonth] = useState(
    Boolean(initialExpense?.effectiveMonth && initialExpense.effectiveMonth !== initialDate.substring(0, 7))
  );
  const [isInvoice, setIsInvoice] = useState(initialExpense?.isInvoice || false);
  const [invoiceNumber, setInvoiceNumber] = useState(initialExpense?.invoiceNumber || '');
  const [supplier, setSupplier] = useState(initialExpense?.supplier || '');
  const [taxRate, setTaxRate] = useState(initialExpense?.taxRate !== undefined ? String(initialExpense.taxRate) : '21');
  const [notes, setNotes] = useState(initialExpense?.notes || '');
  const [status, setStatus] = useState<'paid' | 'pending'>(initialExpense?.status || 'paid');

  // Estados de coincidencia inteligente y recurrente
  const [matchedSmartPattern, setMatchedSmartPattern] = useState<string | null>(null);
  const [matchedRecurringRule, setMatchedRecurringRule] = useState<RecurringRule | null>(null);
  const [linkToRecurring, setLinkToRecurring] = useState<boolean>(true);
  const [userTouchedBucket, setUserTouchedBucket] = useState<boolean>(false);

  const getNextMonth = (monthStr: string) => {
    const [y, m] = monthStr.split('-').map(Number);
    const d = new Date(y, m - 1 + 1, 1);
    const nextY = d.getFullYear();
    const nextM = String(d.getMonth() + 1).padStart(2, '0');
    return `${nextY}-${nextM}`;
  };

  const evaluateMatches = (currTitle: string, currAmountStr: string) => {
    const cleanTitle = (currTitle || '').trim();
    const upperTitle = cleanTitle.toUpperCase();
    const parsedAmount = parseFloat(currAmountStr.replace(',', '.'));

    // 1. Reglas inteligentes de auto-categorización
    let foundSmartPattern: string | null = null;
    if (cleanTitle && smartRules.length > 0) {
      for (const rule of smartRules) {
        if (!rule.isActive) continue;
        const pat = (rule.pattern || '').trim().toUpperCase();
        if (!pat) continue;

        let isMatch = false;
        switch (rule.matchType) {
          case 'startsWith':
            isMatch = upperTitle.startsWith(pat);
            break;
          case 'exact':
            isMatch = upperTitle === pat;
            break;
          case 'regex':
            try {
              isMatch = new RegExp(rule.pattern, 'i').test(cleanTitle);
            } catch {
              isMatch = false;
            }
            break;
          case 'contains':
          default:
            isMatch = upperTitle.includes(pat);
            break;
        }

        if (isMatch) {
          foundSmartPattern = rule.pattern;
          if (!userTouchedBucket && buckets.some((b) => b.id === rule.bucketId)) {
            setBucketId(rule.bucketId);
          }
          if (rule.isInvoice && !initialExpense) {
            setIsInvoice(true);
          }
          break;
        }
      }
    }
    setMatchedSmartPattern(foundSmartPattern);

    // 2. Coincidencia heurística con reglas recurrentes activas
    let foundRecRule: RecurringRule | null = null;
    if (recurringRules.length > 0 && (cleanTitle || !isNaN(parsedAmount))) {
      for (const rRule of recurringRules) {
        if (rRule.isActive === false || rRule.costType === 'none' || rRule.amount <= 0) continue;

        const isSameAmount = !isNaN(parsedAmount) && Math.abs(rRule.amount - parsedAmount) < 0.01;
        const rTitleUpper = (rRule.title || '').trim().toUpperCase();
        const isTitleMatch =
          rTitleUpper &&
          (upperTitle.includes(rTitleUpper) || (upperTitle.length >= 4 && rTitleUpper.includes(upperTitle)));

        if ((isSameAmount && isTitleMatch) || (isSameAmount && !cleanTitle) || (isTitleMatch && isNaN(parsedAmount))) {
          foundRecRule = rRule;
          if (!userTouchedBucket && rRule.bucketId && buckets.some((b) => b.id === rRule.bucketId)) {
            setBucketId(rRule.bucketId);
          }
          break;
        }
      }
    }
    setMatchedRecurringRule(foundRecRule);
    if (foundRecRule) {
      setLinkToRecurring(true);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialExpense?.title || '');
      setAmount(initialExpense?.amount ? String(initialExpense.amount) : '');
      setBucketId(initialExpense?.bucketId || (buckets.length > 0 ? buckets[0].id : ''));
      const d = initialExpense?.date || new Date().toISOString().split('T')[0];
      setDate(d);
      const effM = initialExpense?.effectiveMonth || d.substring(0, 7);
      setEffectiveMonth(effM);
      setIsCustomEffectiveMonth(Boolean(initialExpense?.effectiveMonth && initialExpense.effectiveMonth !== d.substring(0, 7)));
      setIsInvoice(initialExpense?.isInvoice || false);
      setInvoiceNumber(initialExpense?.invoiceNumber || '');
      setSupplier(initialExpense?.supplier || '');
      setTaxRate(initialExpense?.taxRate !== undefined ? String(initialExpense.taxRate) : '21');
      setNotes(initialExpense?.notes || '');
      setStatus(initialExpense?.status || 'paid');
      setUserTouchedBucket(false);
      setMatchedSmartPattern(null);

      // Si ya estaba vinculado a una regla recurrente, mantener el vínculo
      if (initialExpense?.recurringRuleId) {
        const found = recurringRules.find((r) => r.id === initialExpense.recurringRuleId);
        if (found) {
          setMatchedRecurringRule(found);
          setLinkToRecurring(true);
        }
      } else {
        setMatchedRecurringRule(null);
        evaluateMatches(initialExpense?.title || '', initialExpense?.amount ? String(initialExpense.amount) : '');
      }
    }
  }, [isOpen, initialExpense, buckets, smartRules, recurringRules]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await HapticService.notificationWarning();
      alert('Por favor, introduce un importe válido.');
      return;
    }

    const parsedTaxRate = parseFloat(taxRate) || 0;
    const taxAmount = isInvoice ? (parsedAmount * parsedTaxRate) / (100 + parsedTaxRate) : 0;
    const finalEffectiveMonth = (effectiveMonth && effectiveMonth !== date.substring(0, 7)) ? effectiveMonth : undefined;

    const expense: Expense = {
      id: initialExpense?.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Gasto sin título',
      amount: parsedAmount,
      date,
      effectiveMonth: finalEffectiveMonth,
      bucketId: bucketId || (buckets[0]?.id ?? 'default'),
      recurringRuleId: (matchedRecurringRule && linkToRecurring) ? matchedRecurringRule.id : initialExpense?.recurringRuleId,
      isInvoice,
      invoiceNumber: isInvoice ? invoiceNumber.trim() : undefined,
      supplier: supplier.trim() || undefined,
      taxRate: isInvoice ? parsedTaxRate : undefined,
      taxAmount: isInvoice ? Number(taxAmount.toFixed(2)) : undefined,
      notes: notes.trim() || undefined,
      status,
      createdAt: initialExpense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await HapticService.notificationSuccess();
    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-lg p-5 text-slate-900 dark:text-white shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <span>{initialExpense ? 'Editar Gasto' : 'Nuevo Gasto o Factura'}</span>
          </h2>
          <button
            onClick={() => {
              HapticService.selection();
              onClose();
            }}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Concepto e Importe */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Concepto / Nombre *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  evaluateMatches(val, amount);
                }}
                placeholder="Ej. Fibra óptica, Compra semanal..."
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Importe ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val);
                  evaluateMatches(title, val);
                }}
                placeholder="0.00"
                className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Bolsa y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Bolsa de Presupuesto *</label>
                {matchedSmartPattern && (
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 truncate max-w-[150px]">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>Regla auto</span>
                  </span>
                )}
              </div>
              <select
                value={bucketId}
                onChange={(e) => {
                  setUserTouchedBucket(true);
                  setBucketId(e.target.value);
                }}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.budgetLimit} {currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  <span className="truncate">Fecha de Origen / Pago *</span>
                </label>
                {date && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                    {date === new Date().toISOString().split('T')[0] ? 'Hoy' : date.split('-').reverse().join('/')}
                  </span>
                )}
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  const newD = e.target.value;
                  setDate(newD);
                  if (!isCustomEffectiveMonth && newD) {
                    setEffectiveMonth(newD.substring(0, 7));
                  }
                }}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 truncate">
                Día en que se originó el desembolso o factura.
              </p>
            </div>
          </div>

          {/* Detección y Vinculación con Cargo Recurrente Programado */}
          {matchedRecurringRule && (
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 shrink-0">
                    <Repeat className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">
                      Coincide con cargo recurrente
                    </div>
                    <div className="text-[11px] text-purple-700/80 dark:text-purple-300/80 truncate">
                      {matchedRecurringRule.title}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-white dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-xl border border-purple-200 dark:border-purple-700/50 shrink-0">
                  {matchedRecurringRule.amount} {currency}
                </span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-purple-200/60 dark:border-purple-800/40">
                <input
                  type="checkbox"
                  checked={linkToRecurring}
                  onChange={(e) => setLinkToRecurring(e.target.checked)}
                  className="mt-0.5 rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0"
                />
                <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug min-w-0 flex-1">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    Vincular y marcar completado para este mes
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Evita cobros duplicados suprimiendo el cargo automático programado.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Imputación Presupuestaria Dual (Mes Efectivo de Imputación a Bolsa) */}
          <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="p-1.5 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    Mes de Imputación a la Bolsa
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {effectiveMonth !== date.substring(0, 7)
                      ? `Imputado a bolsa de ${effectiveMonth} (compra en ${date.substring(0, 7)})`
                      : `Imputado al mes en curso (${effectiveMonth})`}
                  </div>
                </div>
              </div>

              {/* Botón rápido para mes siguiente */}
              <button
                type="button"
                onClick={() => {
                  HapticService.selection();
                  const targetNext = getNextMonth(date.substring(0, 7));
                  if (effectiveMonth === targetNext) {
                    setEffectiveMonth(date.substring(0, 7));
                    setIsCustomEffectiveMonth(false);
                  } else {
                    setEffectiveMonth(targetNext);
                    setIsCustomEffectiveMonth(true);
                  }
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer border ${
                  effectiveMonth === getNextMonth(date.substring(0, 7))
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600/50 hover:bg-purple-50'
                }`}
              >
                ⏩ Mes +1
              </button>
            </div>

            {/* Selector manual de mes de imputación */}
            <div className="flex items-center gap-2 pt-1">
              <label className="text-xs text-slate-600 dark:text-slate-400 font-semibold shrink-0">
                Imputar al mes:
              </label>
              <input
                type="month"
                value={effectiveMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  setEffectiveMonth(val);
                  setIsCustomEffectiveMonth(Boolean(val && val !== date.substring(0, 7)));
                }}
                className="h-8 px-2 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-600/60 rounded-lg text-xs font-mono font-bold text-purple-900 dark:text-purple-200 focus:outline-hidden focus:border-purple-500"
              />
              {isCustomEffectiveMonth && (
                <button
                  type="button"
                  onClick={() => {
                    setEffectiveMonth(date.substring(0, 7));
                    setIsCustomEffectiveMonth(false);
                  }}
                  className="text-[11px] text-purple-600 dark:text-purple-400 underline font-semibold cursor-pointer shrink-0"
                >
                  Restablecer
                </button>
              )}
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              💡 Permite comprar con antelación o aprovechar ofertas imputando el consumo de la bolsa al presupuesto del mes siguiente.
            </p>
          </div>

          {/* Switch Factura */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">¿Es Factura con IVA?</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Para desgravación fiscal trimestral</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isInvoice}
                onChange={(e) => {
                  HapticService.selection();
                  setIsInvoice(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          {/* Campos de Factura si está activo */}
          {isInvoice && (
            <div className="p-4 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nº de Factura</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="FAC-2026-001"
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Proveedor / Emisor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Empresa S.L."
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">% IVA Aplicado</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full h-10 px-3 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-teal-500"
                  >
                    <option value="21">21% General</option>
                    <option value="10">10% Reducido</option>
                    <option value="4">4% Superreducido</option>
                    <option value="0">0% Exento</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cuota IVA Estimada</label>
                  <div className="w-full h-10 px-3 bg-white/60 dark:bg-slate-900/60 border border-teal-200/50 dark:border-teal-800/40 rounded-xl text-xs font-mono font-bold text-teal-700 dark:text-teal-400 flex items-center">
                    {amount && !isNaN(parseFloat(amount))
                      ? ((parseFloat(amount) * parseFloat(taxRate)) / (100 + parseFloat(taxRate))).toFixed(2)
                      : '0.00'}{' '}
                    {currency}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Notas / Detalles adicionales</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el gasto, persona o justificación..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                HapticService.selection();
                onClose();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wide shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>{initialExpense ? 'Actualizar Gasto' : 'Guardar Gasto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
