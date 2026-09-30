import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CreditCard,
  Stethoscope,
  Wrench,
  Landmark,
  Gift,
  CheckSquare,
} from 'lucide-react';
import { RecurringRule, Bucket } from '../../types';
import { HapticService } from '../../services/hapticService';
import { DBService } from '../../services/db';
import { LUCIDE_CATEGORY_ICONS } from '../recurring/FunctionalCategoriesModal';

interface ConfirmRecurringExpenseModalProps {
  rule: RecurringRule | null;
  initialDate?: string;
  buckets: Bucket[];
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmExpense: (data: {
    ruleId: string;
    amount: number;
    date: string;
    bucketId: string;
    isInvoice: boolean;
    updateRuleBaseAmount: boolean;
    adaptFutureDates: boolean;
  }) => void;
  onCompleteTaskWithoutExpense: (data: {
    ruleId: string;
    date: string;
    adaptFutureDates: boolean;
  }) => void;
}

export const ConfirmRecurringExpenseModal: React.FC<ConfirmRecurringExpenseModalProps> = ({
  rule,
  initialDate,
  buckets,
  currency,
  isOpen,
  onClose,
  onConfirmExpense,
  onCompleteTaskWithoutExpense,
}) => {
  const [date, setDate] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [bucketId, setBucketId] = useState<string>('');
  const [isInvoice, setIsInvoice] = useState<boolean>(false);
  const [updateRuleBaseAmount, setUpdateRuleBaseAmount] = useState<boolean>(false);
  const [adaptFutureDates, setAdaptFutureDates] = useState<boolean>(true);
  const [includeUnexpectedExpense, setIncludeUnexpectedExpense] = useState<boolean>(false);

  useEffect(() => {
    if (rule && isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setDate(initialDate || todayStr);
      setAmount(rule.amount ? String(rule.amount) : '');
      setBucketId(rule.bucketId || (buckets[0]?.id ?? ''));
      setIsInvoice(false);
      setUpdateRuleBaseAmount(false);
      setAdaptFutureDates(rule.autoAdaptNextDates ?? true);
      setIncludeUnexpectedExpense(false);
    }
  }, [rule, isOpen, initialDate, buckets]);

  if (!isOpen || !rule) return null;

  const isPureTask = rule.costType === 'none' || (!rule.amount && rule.costType !== 'estimated');
  const isEstimated = rule.costType === 'estimated';
  const numericAmount = parseFloat(amount) || 0;

  // Extraer el día del mes seleccionado
  const selectedDayNum = date ? parseInt(date.split('-')[2], 10) : (rule.dayOfMonth || 1);
  const isDayChanged = rule.dayOfMonth !== selectedDayNum;

  const handleConfirm = () => {
    if (isPureTask && !includeUnexpectedExpense) {
      onCompleteTaskWithoutExpense({
        ruleId: rule.id,
        date: date || new Date().toISOString().split('T')[0],
        adaptFutureDates,
      });
      HapticService.notificationSuccess();
      onClose();
      return;
    }

    if (numericAmount <= 0) {
      alert('Por favor, indica un importe válido superior a 0.');
      return;
    }

    onConfirmExpense({
      ruleId: rule.id,
      amount: numericAmount,
      date: date || new Date().toISOString().split('T')[0],
      bucketId: bucketId || (buckets[0]?.id ?? ''),
      isInvoice,
      updateRuleBaseAmount,
      adaptFutureDates,
    });

    HapticService.notificationSuccess();
    onClose();
  };

  const categories = DBService.getFunctionalCategories();
  const catObj = categories.find((c) => c.id === rule.categoryType) || {
    id: rule.categoryType || 'bill',
    name: rule.categoryType === 'bill' ? 'Recibo' : rule.categoryType || 'General',
    icon: 'CreditCard',
    color: '#3b82f6',
  };
  const CategoryIcon = LUCIDE_CATEGORY_ICONS[catObj.icon] || CreditCard;
  const categoryLabel = catObj.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {isPureTask && !includeUnexpectedExpense ? 'Confirmar Tarea Recurrente' : 'Confirmar / Ajustar Gasto'}
              </h2>
              <span
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mt-1"
                style={{
                  backgroundColor: `${catObj.color || '#3b82f6'}15`,
                  borderColor: `${catObj.color || '#3b82f6'}40`,
                  color: catObj.color || '#93c5fd',
                }}
              >
                <CategoryIcon className="w-3 h-3" />
                <span>{categoryLabel}</span>
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Título de la Regla */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Acto / Compromiso</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{rule.title}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Periodicidad: <span className="text-slate-700 dark:text-slate-200 font-semibold">{rule.frequency}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Importe Programado</span>
            <div className="text-base font-mono font-black text-emerald-600 dark:text-emerald-400">
              {rule.costType === 'none' ? '0.00 ' + currency : `${rule.amount.toFixed(2)} ${currency}`}
            </div>
          </div>
        </div>

        {/* Selector de Fecha de Ejecución Real */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Fecha Real de Realización / Pago:</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Toggle Adaptativo Dinámico de Recurrencias Futuras */}
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={adaptFutureDates}
              onChange={(e) => setAdaptFutureDates(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                <span>Adaptar el ciclo de las próximas recurrencias a este día</span>
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                {isDayChanged ? (
                  <span className="text-amber-700 dark:text-amber-300">
                    Has indicado el día <b>{selectedDayNum}</b> (antes día {rule.dayOfMonth}). Las futuras notificaciones y el calendario avisarán a partir del día <b>{selectedDayNum}</b> de los siguientes meses.
                  </span>
                ) : (
                  <span>
                    El ciclo futuro continuará calculándose y enviando alertas automáticas a partir de este día ({selectedDayNum}).
                  </span>
                )}
              </span>
            </div>
          </label>
        </div>

        {/* Sección para Tareas sin coste económico directo */}
        {isPureTask && !includeUnexpectedExpense ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 text-xs text-purple-800 dark:text-purple-200">
              <span className="font-bold mb-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                <span>Tarea de autocuidado / mantenimiento sin coste</span>
              </span>
              Al confirmarla, se registrará como completada en esta fecha, actualizando el ciclo de avisos para el siguiente periodo sin restar dinero de tus presupuestos.
            </div>

            <button
              type="button"
              onClick={() => setIncludeUnexpectedExpense(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline block cursor-pointer"
            >
              ¿Ha tenido algún coste imprevisto esta vez? Pulsa aquí para añadir importe
            </button>
          </div>
        ) : (
          /* Sección de Ajuste de Coste */
          <div className="space-y-4">
            {isEstimated && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
                <span>
                  <b>Coste aproximado</b>: Revisa la factura o ticket final recibido y ajusta la cifra exacta para que tu contabilidad sea 100% precisa.
                </span>
              </div>
            )}

            {/* Input de Importe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  Importe Real Facturado ({currency}):
                </span>
                {rule.amount > 0 && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Estimado: {rule.amount.toFixed(2)} {currency}
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-base font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Selector de Bolsa (Bucket) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                Bolsa de Presupuesto:
              </label>
              <select
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 transition-colors"
              >
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.budgetLimit} {currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox: Actualizar estimación base de la regla */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={updateRuleBaseAmount}
                onChange={(e) => setUpdateRuleBaseAmount(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Actualizar también el <b>importe estimado base</b> de esta regla a{' '}
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{numericAmount > 0 ? numericAmount.toFixed(2) : '0.00'} {currency}</span> para próximas ocasiones
              </span>
            </label>

            {/* Checkbox: Factura deducible */}
            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isInvoice}
                onChange={(e) => setIsInvoice(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Dispone de <b>factura oficial</b> (desgravable para trimestres AEAT)
              </span>
            </label>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isPureTask && !includeUnexpectedExpense ? 'Completar Tarea' : 'Confirmar y Guardar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
