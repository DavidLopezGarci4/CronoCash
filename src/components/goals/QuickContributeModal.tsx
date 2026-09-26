import React, { useState } from 'react';
import { X, Plus, PiggyBank, Sparkles } from 'lucide-react';
import { SavingsGoal } from '../../types';

interface QuickContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal;
  currency: string;
  onAddContribution: (goalId: string, amount: number, notes?: string) => Promise<void>;
}

export const QuickContributeModal: React.FC<QuickContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  currency,
  onAddContribution,
}) => {
  const [amount, setAmount] = useState<string>('50');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(',', '.')) || 0;
    if (parsed <= 0) return;

    setLoading(true);
    try {
      await onAddContribution(goal.id, parsed, notes.trim() || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const deficit = Math.max(0, goal.targetAmount - goal.currentAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
            >
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Aportar a Meta</h3>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{goal.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span>Importe a ingresar:</span>
              <span className="font-mono text-[11px]">Resta: {deficit.toFixed(2)} {currency}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.5"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
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
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  +{val}€
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Nota o concepto (Opcional):</label>
            <input
              type="text"
              placeholder="Ej: Ahorro quincenal, propina, ingreso extra..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
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
