import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert, PieChart, Check, X, Shield } from 'lucide-react';
import { Bucket, Expense } from '../../types';

interface BucketsViewProps {
  buckets: Bucket[];
  expenses: Expense[];
  currency: string;
  onSaveBucket: (bucket: Bucket) => void;
  onDeleteBucket: (id: string) => void;
}

export const BucketsView: React.FC<BucketsViewProps> = ({
  buckets,
  expenses,
  currency,
  onSaveBucket,
  onDeleteBucket,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);

  const [name, setName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [color, setColor] = useState('#10b981');
  const [isBuffer, setIsBuffer] = useState(false);
  const [notes, setNotes] = useState('');

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));

  const openAdd = () => {
    setEditingBucket(null);
    setName('');
    setBudgetLimit('300');
    setColor('#10b981');
    setIsBuffer(false);
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (b: Bucket) => {
    setEditingBucket(b);
    setName(b.name);
    setBudgetLimit(String(b.budgetLimit));
    setColor(b.color);
    setIsBuffer(b.isBuffer);
    setNotes(b.notes || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      alert('Introduce un límite de presupuesto válido.');
      return;
    }

    const bucket: Bucket = {
      id: editingBucket?.id || `bucket_${Date.now()}`,
      name: name.trim() || 'Nueva Bolsa',
      budgetLimit: limit,
      color,
      icon: 'PieChart',
      isBuffer,
      notes: notes.trim() || undefined,
      createdAt: editingBucket?.createdAt || new Date().toISOString(),
    };

    onSaveBucket(bucket);
    setModalOpen(false);
  };

  const palette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ef4444', // red
    '#14b8a6', // teal
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Bolsas de Presupuesto</span>
          </h2>
          <p className="text-xs text-slate-400">
            Control de partidas y colchón amortiguador de imprevistos
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Crear Bolsa</span>
        </button>
      </div>

      {/* Grid de Bolsas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buckets.map((b) => {
          const spent = currentExpenses
            .filter((e) => e.bucketId === b.id)
            .reduce((sum, e) => sum + e.amount, 0);
          const limit = b.budgetLimit || 1;
          const pct = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;
          const remaining = limit - spent;

          return (
            <div
              key={b.id}
              className={`p-4 rounded-3xl bg-slate-900/90 border transition-all ${
                b.isBuffer
                  ? 'border-purple-500/40 bg-purple-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.isBuffer && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold flex items-center gap-1 border border-purple-500/30">
                          <Shield className="w-3 h-3" /> Colchón Buffer
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{b.notes || 'Partida presupuestaria'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar bolsa "${b.name}"?`)) {
                        onDeleteBucket(b.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Números y Progreso */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Consumido este mes</span>
                  <div className="text-sm font-mono font-bold">
                    <span className={isOver ? 'text-rose-400' : 'text-white'}>
                      {spent.toFixed(2)} {currency}
                    </span>
                    <span className="text-slate-500 text-xs"> / {limit.toFixed(2)} {currency}</span>
                  </div>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? '#f43f5e' : b.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{pct}% ocupado</span>
                  <span className={`font-semibold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isOver
                      ? `Excedido en ${(spent - limit).toFixed(2)} ${currency}`
                      : `Disponible: ${remaining.toFixed(2)} ${currency}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear/Editar Bolsa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBucket ? 'Editar Bolsa' : 'Nueva Bolsa de Presupuesto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Nombre de la Bolsa *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Transporte, Ocio, Suministros..."
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Límite Mensual ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="300"
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Color Distintivo</label>
                <div className="flex items-center space-x-2 pt-1">
                  {palette.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setColor(p)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === p ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: p }}
                    />
                  ))}
                </div>
              </div>

              <div
                onClick={() => setIsBuffer(!isBuffer)}
                className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center space-x-3 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isBuffer ? 'bg-purple-500 border-purple-500 text-slate-950' : 'border-purple-400/50'
                  }`}
                >
                  {isBuffer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">Es Bolsa de Imprevistos (Colchón)</div>
                  <div className="text-[10px] text-purple-300/80">
                    Actúa como salvaguarda frente a contingencias o desviaciones de gastos
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Descripción / Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Qué incluye esta partida..."
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Guardar Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
