import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  PiggyBank,
  Car,
  Home,
  Palmtree,
  ShieldAlert,
  Zap,
  HeartPulse,
  Smartphone,
  Calendar,
  Check,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { SavingsGoal, Bucket } from '../../types';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: SavingsGoal) => Promise<void>;
  buckets: Bucket[];
  currency: string;
  initialGoal?: SavingsGoal | null;
}

const AVAILABLE_ICONS = [
  { name: 'Target', label: 'Meta', icon: Target },
  { name: 'PiggyBank', label: 'Hucha', icon: PiggyBank },
  { name: 'Car', label: 'Coche', icon: Car },
  { name: 'Home', label: 'Hogar', icon: Home },
  { name: 'Palmtree', label: 'Vacaciones', icon: Palmtree },
  { name: 'ShieldAlert', label: 'Averías', icon: ShieldAlert },
  { name: 'Zap', label: 'Energía', icon: Zap },
  { name: 'HeartPulse', label: 'Salud', icon: HeartPulse },
  { name: 'Smartphone', label: 'Tecnología', icon: Smartphone },
];

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#ef4444', // red
];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  buckets,
  currency,
  initialGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<'essential' | 'maintenance' | 'lifestyle' | 'emergency'>('maintenance');
  const [priority, setPriority] = useState<number>(1);
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Target');
  const [bucketId, setBucketId] = useState<string>('');
  const [autoDeductFromSafeToSpend, setAutoDeductFromSafeToSpend] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title || '');
      setTargetAmount(initialGoal.targetAmount ? String(initialGoal.targetAmount) : '');
      setCurrentAmount(initialGoal.currentAmount !== undefined ? String(initialGoal.currentAmount) : '0');
      setTargetDate(initialGoal.targetDate || '');
      setCategory(initialGoal.category || 'maintenance');
      setPriority(initialGoal.priority || 1);
      setColor(initialGoal.color || '#3b82f6');
      setIcon(initialGoal.icon || 'Target');
      setBucketId(initialGoal.bucketId || '');
      setAutoDeductFromSafeToSpend(initialGoal.autoDeductFromSafeToSpend !== false);
      setNotes(initialGoal.notes || '');
    } else {
      // Defaults para nueva meta (6 meses por defecto)
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(defaultDate.toISOString().split('T')[0]);
      setCategory('maintenance');
      setPriority(1);
      setColor('#3b82f6');
      setIcon('Target');
      setBucketId('');
      setAutoDeductFromSafeToSpend(true);
      setNotes('');
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTarget = parseFloat(targetAmount.replace(',', '.')) || 0;
    const parsedCurrent = parseFloat(currentAmount.replace(',', '.')) || 0;

    if (parsedTarget <= 0) return;

    setLoading(true);
    try {
      const nowIso = new Date().toISOString();
      const goalToSave: SavingsGoal = {
        id: initialGoal ? initialGoal.id : `goal_${Date.now()}`,
        title: title.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || nowIso.split('T')[0],
        category,
        priority: Number(priority),
        color,
        icon,
        bucketId: bucketId || undefined,
        autoDeductFromSafeToSpend,
        isCompleted: parsedCurrent >= parsedTarget,
        notes: notes.trim() || undefined,
        contributions: initialGoal?.contributions || (parsedCurrent > 0 ? [
          {
            id: `contrib_init_${Date.now()}`,
            amount: parsedCurrent,
            date: nowIso.split('T')[0],
            source: 'manual',
            notes: 'Saldo inicial de apertura',
          }
        ] : []),
        createdAt: initialGoal?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await onSave(goalToSave);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border"
              style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}
            >
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {initialGoal ? 'Editar Meta de Ahorro' : 'Nueva Meta (Sinking Fund)'}
              </h3>
              <p className="text-xs text-slate-400">
                Planifica compras futuras y gastos previsibles con ritmo de crucero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Título de la Meta */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Nombre de la Meta</label>
            <input
              type="text"
              required
              placeholder="Ej: Seguro Anual Coche, Vacaciones, IBI..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Importe Objetivo y Saldo Actual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Importe Objetivo ({currency})</label>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="480.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Saldo Acumulado ({currency})</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Fecha Límite y Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Fecha Objetivo</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Prioridad de Reparto</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>Alta (Peso 3x - Innegociable)</option>
                <option value={2}>Media (Peso 2x - Estándar)</option>
                <option value={3}>Baja (Peso 1x - Opcional)</option>
              </select>
            </div>
          </div>

          {/* Categoría y Bolsa Vinculada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="essential">Esencial / Impuesto</option>
                <option value="maintenance">Mantenimiento / Vehículo</option>
                <option value="lifestyle">Estilo de Vida / Vacaciones</option>
                <option value="emergency">Fondo Emergencia</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1.5">Bolsa Vinculada (Opcional)</label>
              <select
                value={bucketId}
                onChange={(e) => setBucketId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">(Sin bolsa vinculada)</option>
                {buckets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Switch Auto-Deducción Safe-to-Spend */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Proteger Cuota en Safe-to-Spend</span>
              </span>
              <p className="text-[11px] text-slate-400 leading-tight">
                Resta automáticamente la cuota mensual de crucero del cálculo diario seguro para que nunca te lo gastes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoDeductFromSafeToSpend(!autoDeductFromSafeToSpend)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoDeductFromSafeToSpend ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoDeductFromSafeToSpend ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Selector de Icono */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Icono Representativo</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`p-2.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Color Temático</label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    color === c ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Notas y Detalles (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre renovación, número de póliza o presupuesto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {loading ? 'Guardando...' : initialGoal ? 'Guardar Cambios' : 'Crear Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
