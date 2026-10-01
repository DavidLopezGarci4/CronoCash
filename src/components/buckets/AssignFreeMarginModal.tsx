import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, ShieldAlert } from 'lucide-react';
import { Bucket, getBucketMonthLimit } from '../../types';
import { DBService } from '../../services/db';

interface AssignFreeMarginModalProps {
  isOpen: boolean;
  onClose: () => void;
  freeMargin: number;
  monthPrefix: string;
  monthName: string;
  currency: string;
  buckets: Bucket[];
  onMarginAssigned: () => void;
}

export const AssignFreeMarginModal: React.FC<AssignFreeMarginModalProps> = ({
  isOpen,
  onClose,
  freeMargin,
  monthPrefix,
  monthName,
  currency,
  buckets,
  onMarginAssigned,
}) => {
  const [selectedBucketId, setSelectedBucketId] = useState<string>(buckets[0]?.id || '');
  const [amount, setAmount] = useState<number>(freeMargin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickPercent = (pct: number) => {
    const val = Math.round(freeMargin * pct * 100) / 100;
    setAmount(val);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedBucketId) {
      setError('Selecciona una bolsa de destino');
      return;
    }
    if (amount <= 0) {
      setError('Introduce un importe superior a 0');
      return;
    }
    if (amount > freeMargin + 0.01) {
      setError(`El importe máximo disponible es ${freeMargin.toFixed(2)} ${currency}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await DBService.assignFreeMarginToBucket(selectedBucketId, amount, monthPrefix);
      onMarginAssigned();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Error al asignar margen libre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBucket = buckets.find((b) => b.id === selectedBucketId);
  const currentLimit = selectedBucket ? getBucketMonthLimit(selectedBucket, monthPrefix) : 0;
  const newProjectedLimit = currentLimit + (Number(amount) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-emerald-300 dark:border-emerald-500/40 rounded-3xl w-full max-w-md p-5 text-slate-900 dark:text-white shadow-2xl flex flex-col space-y-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 truncate">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                Asignar Margen Libre
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {monthName} • Ajuste puntual del mes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Margen Disponible */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-1">
          <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-800 dark:text-emerald-300">
            Margen Libre sin Asignar
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            +{freeMargin.toFixed(2)} {currency}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
            Ingresos disponibles que aún no han sido repartidos a ninguna bolsa
          </p>
        </div>

        {/* Selector de Bolsa Receptora */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Bolsa de destino para este mes:
          </label>
          <select
            value={selectedBucketId}
            onChange={(e) => setSelectedBucketId(e.target.value)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
          >
            {buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (Límite actual: {getBucketMonthLimit(b, monthPrefix).toFixed(2)} {currency})
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Importe */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Importe a sumar a la bolsa:
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {Number(amount || 0).toFixed(2)} {currency}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={freeMargin}
              value={amount || ''}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0);
                setError(null);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
              {currency}
            </span>
          </div>

          {/* Botones de porcentaje rápido */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleQuickPercent(0.25)}
              className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(0.5)}
              className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(0.75)}
              className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition-colors"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => handleQuickPercent(1.0)}
              className="py-1 px-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-black text-[11px] transition-colors"
            >
              100% (Todo)
            </button>
          </div>
        </div>

        {/* Comparativa de Impacto */}
        {selectedBucket && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl flex items-center justify-between text-xs min-w-0">
            <div className="min-w-0 truncate">
              <span className="text-[10px] text-slate-400 block truncate">Límite de {selectedBucket.name}</span>
              <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                {currentLimit.toFixed(2)} {currency}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0 mx-2" />
            <div className="text-right min-w-0 truncate">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block truncate">Nuevo Límite {monthPrefix}</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {newProjectedLimit.toFixed(2)} {currency}
              </span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
          💡 Este incremento es <strong>puntual para {monthName}</strong>. Los límites de los meses futuros no se verán afectados. Si dejas margen sin asignar, se añadirá automáticamente a tu Colchón al cerrar el mes.
        </p>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || amount <= 0}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSubmitting ? 'Asignando...' : 'Asignar a Bolsa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
