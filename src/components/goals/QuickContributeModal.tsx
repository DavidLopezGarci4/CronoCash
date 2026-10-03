import React, { useState, useMemo } from 'react';
import { X, Plus, PiggyBank, Sparkles, Shield, Wallet, Banknote, ArrowRight, Gauge } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { SinkingFundsService } from '../../services/sinkingFundsService';

interface QuickContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal;
  currency: string;
  onAddContribution: (
    goalId: string,
    amount: number,
    source: 'manual' | 'cushion_buffer' | 'free_margin',
    notes?: string
  ) => Promise<void>;
  cushionBalance?: number;
  freeMarginBalance?: number;
}

export const QuickContributeModal: React.FC<QuickContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  currency,
  onAddContribution,
  cushionBalance = 0,
  freeMarginBalance = 0,
}) => {
  // Por defecto, sugerir traspaso desde el Colchón si tiene saldo, o desde Margen Libre
  const defaultSource: 'cushion_buffer' | 'free_margin' | 'manual' =
    cushionBalance > 0 ? 'cushion_buffer' : freeMarginBalance > 0 ? 'free_margin' : 'manual';

  const [source, setSource] = useState<'cushion_buffer' | 'free_margin' | 'manual'>(defaultSource);
  const [amount, setAmount] = useState<string>('50');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const parsedAmount = Math.max(0, parseFloat(amount.replace(',', '.')) || 0);
  const deficit = Math.max(0, goal.targetAmount - goal.currentAmount);

  // Ritmo de crucero actual
  const currentPace = useMemo(() => {
    return SinkingFundsService.calculateCruisePace(goal);
  }, [goal]);

  // Ritmo de crucero simulado adaptado tras la aportación
  const simulatedPace = useMemo(() => {
    if (parsedAmount <= 0) return currentPace;
    const simulatedGoal: SavingsGoal = {
      ...goal,
      currentAmount: Math.min(goal.targetAmount, goal.currentAmount + parsedAmount),
    };
    return SinkingFundsService.calculateCruisePace(simulatedGoal);
  }, [goal, parsedAmount, currentPace]);

  const paceSaved = Math.max(
    0,
    Math.round((currentPace.monthlyContribution - simulatedPace.monthlyContribution) * 100) / 100
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    if (source === 'cushion_buffer' && parsedAmount > cushionBalance) {
      const confirmExceed = window.confirm(
        `El importe (${parsedAmount.toFixed(2)} ${currency}) supera el saldo disponible en tu Colchón (${cushionBalance.toFixed(2)} ${currency}). ¿Deseas continuar igualmente?`
      );
      if (!confirmExceed) return;
    }

    if (source === 'free_margin' && parsedAmount > freeMarginBalance) {
      const confirmExceed = window.confirm(
        `El importe (${parsedAmount.toFixed(2)} ${currency}) supera el Margen Libre estimado del mes (${freeMarginBalance.toFixed(2)} ${currency}). ¿Deseas continuar?`
      );
      if (!confirmExceed) return;
    }

    setLoading(true);
    try {
      await onAddContribution(goal.id, parsedAmount, source, notes.trim() || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
            >
              <PiggyBank className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Aportar a Meta (Sinking Fund)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          {/* Selector de Origen de Fondos */}
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1.5">
              Origen de los fondos:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSource('cushion_buffer')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  source === 'cushion_buffer'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 dark:border-teal-500/60 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">Colchón</span>
                </div>
                <span className="text-[10px] font-mono text-teal-700 dark:text-teal-300 font-semibold truncate">
                  {cushionBalance.toFixed(0)} {currency}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSource('free_margin')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  source === 'free_margin'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-500/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">Margen Libre</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold truncate">
                  {freeMarginBalance.toFixed(0)} {currency}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSource('manual')}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  source === 'manual'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500/60 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Banknote className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-bold text-[11px] text-slate-900 dark:text-white truncate">Manual</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Externo
                </span>
              </button>
            </div>

            {source === 'cushion_buffer' && (
              <p className="mt-1 text-[11px] text-teal-700 dark:text-teal-400">
                🛡️ Se traspasará directamente desde tu Colchón de Ahorro e Imprevistos.
              </p>
            )}
            {source === 'free_margin' && (
              <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                💰 Se imputa al Margen Libre presupuestario sin asignar de este mes.
              </p>
            )}
          </div>

          {/* Importe a Aportar */}
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1">
              <span>Importe a ingresar:</span>
              <span className="font-mono text-[11px]">Déficit meta: {deficit.toFixed(2)} {currency}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3.5 top-2.5 text-sm font-mono text-slate-400">{currency}</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {['10', '25', '50', '100'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`flex-1 py-1 rounded-lg font-mono font-bold text-xs border transition-colors cursor-pointer ${
                    amount === val
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  +{val}€
                </button>
              ))}
              {source === 'cushion_buffer' && cushionBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.min(deficit, cushionBalance)))}
                  className="px-2 py-1 rounded-lg font-mono font-bold text-[10px] border border-teal-300 dark:border-teal-500/40 bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 cursor-pointer"
                  title="Todo el colchón disponible para esta meta"
                >
                  Todo Colchón
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta de Adaptación Dinámica de Ritmo de Crucero */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Adaptación del Ritmo de Crucero</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {currentPace.monthsRemaining} {currentPace.monthsRemaining === 1 ? 'mes restante' : 'meses restantes'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Crucero Actual</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {currentPace.monthlyContribution.toFixed(2)} {currency}/mes
                </span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

              <div className="flex flex-col text-right">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Nuevo Crucero</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {simulatedPace.monthlyContribution.toFixed(2)} {currency}/mes
                </span>
              </div>
            </div>

            {paceSaved > 0 && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl px-2.5 py-1 text-center font-bold border border-emerald-200/50 dark:border-emerald-800/40">
                ✨ Desahogas tu esfuerzo mensual en -{paceSaved.toFixed(2)} {currency}/mes
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Nota o concepto (Opcional):</label>
            <input
              type="text"
              placeholder="Ej: Traspaso desde colchón, ahorro quincenal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-transparent font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{loading ? 'Añadiendo...' : 'Aportar Saldo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
