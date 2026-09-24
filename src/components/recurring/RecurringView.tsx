import React, { useState } from 'react';
import { Plus, Repeat, Trash2, Edit2, CheckCircle2, Play, Calendar, DollarSign, X } from 'lucide-react';
import { RecurringRule, Bucket, Expense } from '../../types';

interface RecurringViewProps {
  rules: RecurringRule[];
  buckets: Bucket[];
  currency: string;
  onSaveRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onApplyRuleNow: (rule: RecurringRule) => void;
}

export const RecurringView: React.FC<RecurringViewProps> = ({
  rules,
  buckets,
  currency,
  onSaveRule,
  onDeleteRule,
  onApplyRuleNow,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [bucketId, setBucketId] = useState(buckets[0]?.id || '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [notes, setNotes] = useState('');

  const openAdd = () => {
    setEditingRule(null);
    setTitle('');
    setAmount('');
    setBucketId(buckets[0]?.id || '');
    setFrequency('monthly');
    setDayOfMonth('1');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (r: RecurringRule) => {
    setEditingRule(r);
    setTitle(r.title);
    setAmount(String(r.amount));
    setBucketId(r.bucketId);
    setFrequency(r.frequency);
    setDayOfMonth(String(r.dayOfMonth || 1));
    setNotes(r.notes || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Introduce un importe válido.');
      return;
    }

    const rule: RecurringRule = {
      id: editingRule?.id || `rec_${Date.now()}`,
      title: title.trim() || 'Recurrente sin título',
      amount: parsedAmount,
      bucketId: bucketId || (buckets[0]?.id ?? 'default'),
      frequency,
      dayOfMonth: parseInt(dayOfMonth) || 1,
      startDate: editingRule?.startDate || new Date().toISOString().split('T')[0],
      isActive: editingRule ? editingRule.isActive : true,
      autoCreateExpense: true,
      notes: notes.trim() || undefined,
    };

    onSaveRule(rule);
    setModalOpen(false);
  };

  const frequencyLabels = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-400" />
            <span>Facturas y Gastos Recurrentes</span>
          </h2>
          <p className="text-xs text-slate-400">
            Suscripciones, recibos periódicos y gastos programados
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuevo Recurrente</span>
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-2">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No hay reglas recurrentes</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Configura facturas mensuales (alquiler, fibra, seguros) para tener previsión automática.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const bucket = buckets.find((b) => b.id === rule.bucketId);

            return (
              <div
                key={rule.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 border"
                    style={{
                      backgroundColor: `${bucket?.color || '#3b82f6'}15`,
                      borderColor: `${bucket?.color || '#3b82f6'}40`,
                      color: bucket?.color || '#3b82f6',
                    }}
                  >
                    <Repeat className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-white truncate">{rule.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                        {frequencyLabels[rule.frequency]} (Día {rule.dayOfMonth || 1})
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                      <span style={{ color: bucket?.color }}>{bucket?.name || 'General'}</span>
                      {rule.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate">{rule.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono text-white">
                      {rule.amount.toFixed(2)} {currency}
                    </div>
                  </div>

                  {/* Botón Aplicar Gasto Ahora */}
                  <button
                    onClick={() => onApplyRuleNow(rule)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Registrar gasto de este período ahora"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Aplicar</span>
                  </button>

                  <button
                    onClick={() => openEdit(rule)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar regla recurrente "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Añadir/Editar Regla */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingRule ? 'Editar Recurrente' : 'Nueva Factura / Gasto Recurrente'}
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
                <label className="text-xs font-bold text-slate-400">Concepto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Alquiler oficina, Cuota internet..."
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Importe ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="65.00"
                    className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Frecuencia *</label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full h-11 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Día del Mes de Cargo</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Bolsa Destino</label>
                  <select
                    value={bucketId}
                    onChange={(e) => setBucketId(e.target.value)}
                    className="w-full h-11 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Observaciones</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Número de contrato o detalles..."
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
                  Guardar Regla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
