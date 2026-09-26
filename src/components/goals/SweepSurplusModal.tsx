import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Coins,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { SavingsGoal } from '../../types';
import { SinkingFundsService } from '../../services/sinkingFundsService';

interface SweepSurplusModalProps {
  isOpen: boolean;
  onClose: () => void;
  surplusAvailable: number;
  goals: SavingsGoal[];
  currency: string;
  onApplySweep: (allocations: { goalId: string; amount: number }[]) => Promise<void>;
}

export const SweepSurplusModal: React.FC<SweepSurplusModalProps> = ({
  isOpen,
  onClose,
  surplusAvailable,
  goals,
  currency,
  onApplySweep,
}) => {
  const activeGoals = useMemo(
    () => goals.filter((g) => !g.isCompleted && g.currentAmount < g.targetAmount),
    [goals]
  );

  const totalDeficit = useMemo(
    () => activeGoals.reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0),
    [activeGoals]
  );

  // Sugerencia inicial: el excedente disponible o el déficit total si es menor
  const initialSweepAmount = Math.max(
    0,
    Math.min(surplusAvailable, totalDeficit)
  );

  const [sweepAmount, setSweepAmount] = useState<string>(
    initialSweepAmount > 0 ? initialSweepAmount.toFixed(0) : '100'
  );
  const [loading, setLoading] = useState(false);

  const parsedAmount = parseFloat(sweepAmount.replace(',', '.')) || 0;

  // Reparto automático ponderado según prioridad
  const allocations = useMemo(() => {
    return SinkingFundsService.distributeSurplus(parsedAmount, activeGoals);
  }, [parsedAmount, activeGoals]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    if (allocations.length === 0 || parsedAmount <= 0) return;
    setLoading(true);
    try {
      await onApplySweep(allocations);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Sweep & Fund</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Reparto Inteligente
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inyecta superávit mensual en tus metas activas ponderando por prioridad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de Liquidez Disponible */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-400 block">
              Superávit Safe-to-Spend Calculado:
            </span>
            <span className="text-xl font-black font-mono text-emerald-400">
              +{surplusAvailable.toFixed(2)} {currency}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Déficit acumulado en metas:</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              {totalDeficit.toFixed(2)} {currency}
            </span>
          </div>
        </div>

        {/* Input Importe a Repartir */}
        <div className="mt-4 space-y-2">
          <label className="block text-slate-300 font-bold text-xs">
            Importe a distribuir en este barrido ({currency}):
          </label>
          <div className="relative">
            <input
              type="number"
              step="5"
              min="1"
              value={sweepAmount}
              onChange={(e) => setSweepAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            <span className="absolute right-3.5 top-2.5 text-sm font-mono text-slate-400">{currency}</span>
          </div>

          {/* Botones de sugerencia rápida */}
          <div className="flex gap-2 pt-1">
            {[50, 100, 200, Math.round(surplusAvailable)].filter((v) => v > 0).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSweepAmount(String(val))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-semibold cursor-pointer transition-colors"
              >
                {val} {currency}
              </button>
            ))}
          </div>
        </div>

        {/* Desglose de Distribución Ponderada */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-1">
            <span>Metas Beneficiarias ({allocations.length}):</span>
            <span className="text-[11px] text-cyan-400 font-normal">Ponderado por Prioridad (3x/2x/1x)</span>
          </div>

          {activeGoals.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
              🎉 ¡Todas tus metas de ahorro están completadas al 100%!
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {allocations.map((alloc) => {
                const goal = activeGoals.find((g) => g.id === alloc.goalId);
                if (!goal) return null;
                const newTotal = goal.currentAmount + alloc.amount;
                const newPct = Math.min(100, Math.round((newTotal / goal.targetAmount) * 100));

                return (
                  <div
                    key={alloc.goalId}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block truncate">{goal.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {goal.currentAmount.toFixed(0)}€ →{' '}
                          <span className="text-emerald-400 font-bold">{newTotal.toFixed(0)}€</span> ({newPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {goal.priority === 1 ? 'P1 (3x)' : goal.priority === 2 ? 'P2 (2x)' : 'P3 (1x)'}
                      </span>
                      <span className="font-mono font-bold text-cyan-300 text-sm">
                        +{alloc.amount.toFixed(2)} {currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Acciones */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading || allocations.length === 0 || parsedAmount <= 0}
            onClick={handleExecute}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Coins className="w-4 h-4 stroke-[2.5]" />
            <span>{loading ? 'Inyectando...' : `Ejecutar Reparto (${parsedAmount.toFixed(2)} ${currency})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
