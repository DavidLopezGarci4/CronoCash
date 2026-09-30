import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  PlusCircle,
  Calendar,
  Repeat,
  Gift,
  Tag,
  Home,
  Briefcase,
  Sparkles,
  CircleDollarSign,
  Trash2,
  Check,
  Info,
  DollarSign,
  ArrowRightLeft,
  Layers,
} from 'lucide-react';
import { ExtraIncome, ExtraIncomeType, ExtraIncomeCategory, IncomeAllocationMode, Bucket } from '../../types';
import { HapticService } from '../../services/hapticService';
import { usePrivacy } from '../../context/PrivacyContext';

interface ExtraIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraIncomes: ExtraIncome[];
  buckets?: Bucket[];
  onSaveIncome: (income: ExtraIncome) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  currency: string;
  monthlyBaseIncome: number;
}

const CATEGORIES: { id: ExtraIncomeCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'gift', label: 'Regalo / Efectivo', icon: Gift },
  { id: 'sale', label: 'Venta (Segunda mano)', icon: Tag },
  { id: 'rental', label: 'Alquiler recibido', icon: Home },
  { id: 'freelance', label: 'Trabajo Extra / Freelance', icon: Briefcase },
  { id: 'bonus', label: 'Bonus / Gratificación', icon: Sparkles },
  { id: 'investment', label: 'Dividendos / Rentas', icon: TrendingUp },
  { id: 'other', label: 'Otro Ingreso', icon: CircleDollarSign },
];

export const ExtraIncomeModal: React.FC<ExtraIncomeModalProps> = ({
  isOpen,
  onClose,
  extraIncomes,
  buckets = [],
  onSaveIncome,
  onDeleteIncome,
  currency,
  monthlyBaseIncome,
}) => {
  const { isPrivate, mask } = usePrivacy();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<ExtraIncomeType>('punctual');
  const [category, setCategory] = useState<ExtraIncomeCategory>('gift');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(() => new Date().getDate());
  const [targetBucketId, setTargetBucketId] = useState<string>('');
  const [allocationMode, setAllocationMode] = useState<IncomeAllocationMode>('bucket_budget');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Cálculo de totales para el mes actual
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const punctualThisMonth = extraIncomes
    .filter((i) => i.isActive !== false && i.type === 'punctual' && (i.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + i.amount, 0);

  const recurringThisMonth = extraIncomes
    .filter((i) => i.isActive !== false && i.type === 'recurring')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExtrasThisMonth = punctualThisMonth + recurringThisMonth;
  const totalBudgetMonth = monthlyBaseIncome + totalExtrasThisMonth;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim()) {
      setErrorMsg('Indica un título o concepto para el ingreso');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Introduce un importe válido mayor a 0');
      return;
    }

    setSaving(true);
    try {
      const newIncome: ExtraIncome = {
        id: `income_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title.trim(),
        amount: parsedAmount,
        type,
        category,
        date: type === 'punctual' ? date : new Date().toISOString().split('T')[0],
        dayOfMonth: type === 'recurring' ? dayOfMonth : undefined,
        frequency: type === 'recurring' ? 'monthly' : undefined,
        isActive: true,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
        targetBucketId: targetBucketId || undefined,
        allocationMode: targetBucketId ? allocationMode : 'general',
      };

      await onSaveIncome(newIncome);
      HapticService.impactMedium();
      setTitle('');
      setAmount('');
      setTargetBucketId('');
      setAllocationMode('bucket_budget');
      setNotes('');
      setActiveTab('list');
    } catch (err: any) {
      setErrorMsg(`Error al guardar ingreso: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Deseas eliminar este ingreso extra?')) {
      HapticService.impactLight();
      await onDeleteIncome(id);
    }
  };

  const handleToggleActive = async (income: ExtraIncome) => {
    HapticService.selection();
    await onSaveIncome({
      ...income,
      isActive: !income.isActive,
    });
  };

  const getCategoryIcon = (cat: ExtraIncomeCategory) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : CircleDollarSign;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-gradient-to-br dark:from-teal-500/20 dark:to-emerald-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Ingresos Extras & Entradas</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puntuales (regalos, ventas) o recurrentes (alquileres, dividendos)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Impacto en el Mes */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Salario Base</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-300">
                {mask(monthlyBaseIncome, currency, 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20">
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block">+ Extras Mes</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-teal-700 dark:text-teal-300">
                +{mask(totalExtrasThisMonth, currency)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">= Total Disponible</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {mask(totalBudgetMonth, currency, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Pestañas: Crear vs Lista */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'text-teal-700 dark:text-teal-400 border-teal-600 dark:border-teal-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Añadir Ingreso</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'text-teal-700 dark:text-teal-400 border-teal-600 dark:border-teal-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Historial y Recurrentes ({extraIncomes.length})</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Concepto e Importe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Concepto / Procedencia *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Regalo cumpleaños, Venta bicicleta, Alquiler garaje"
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Importe *</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="150"
                      className="w-full h-11 px-3 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-teal-500"
                      required
                    />
                    <span className="absolute right-3 text-xs text-slate-400 font-mono">{currency}</span>
                  </div>
                </div>
              </div>

              {/* Selector de Tipo (Puntual vs Recurrente) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Naturaleza del Ingreso</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      HapticService.selection();
                      setType('punctual');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'punctual'
                        ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-500/40 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <div className="text-left">
                      <div>Puntual</div>
                      <div className="text-[10px] font-normal opacity-80">Un solo mes (venta, regalo)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      HapticService.selection();
                      setType('recurring');
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      type === 'recurring'
                        ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div className="text-left">
                      <div>Recurrente</div>
                      <div className="text-[10px] font-normal opacity-80">Cada mes (alquiler, renta)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Categoría</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          HapticService.selection();
                          setCategory(cat.id);
                        }}
                        className={`p-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fecha / Periodicidad */}
              {type === 'punctual' ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Fecha del Ingreso Puntual</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                  <p className="text-[10px] text-slate-500">
                    Se computará en el mes correspondiente a esta fecha ({date.substring(0, 7)}).
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Día de Cobro Estimado (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Este ingreso se sumará de manera automática a tu disponibilidad presupuestaria cada mes.
                  </p>
                </div>
              )}

              {/* Asignación Directa a Bolsa (Opcional) */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Destinar a una Bolsa Específica (Opcional)</span>
                  </label>
                  {targetBucketId && (
                    <button
                      type="button"
                      onClick={() => setTargetBucketId('')}
                      className="text-[10px] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer font-semibold"
                    >
                      Desvincular
                    </button>
                  )}
                </div>

                <select
                  value={targetBucketId}
                  onChange={(e) => {
                    HapticService.selection();
                    setTargetBucketId(e.target.value);
                  }}
                  className="w-full h-11 px-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="">Ninguna — Liquidez General / Salario (Sin bolsa)</option>
                  {(buckets || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Límite: {b.budgetLimit} {currency})
                    </option>
                  ))}
                </select>

                {targetBucketId && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Efecto financiero en la bolsa seleccionada:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          HapticService.selection();
                          setAllocationMode('bucket_budget');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          allocationMode === 'bucket_budget'
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Inyección Presupuestaria</span>
                        </div>
                        <p className="text-[10px] mt-1 opacity-80 leading-snug">
                          Amplía el límite de gasto de esta bolsa sin diluirse en el gasto diario.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          HapticService.selection();
                          setAllocationMode('bucket_refund');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          allocationMode === 'bucket_refund'
                            ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 shadow-xs ring-1 ring-cyan-500/30'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span>Reembolso / Devolución</span>
                        </div>
                        <p className="text-[10px] mt-1 opacity-80 leading-snug">
                          Minora directamente los gastos registrados en esta bolsa (Bizums, devoluciones).
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas opcionales */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notas Opcionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre el comprador, cuenta bancaria o motivo..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              {/* Botón Guardar */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-98 disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{saving ? 'Guardando...' : 'Registrar Ingreso Extra'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              {extraIncomes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 space-y-2">
                  <CircleDollarSign className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">No tienes ingresos extras registrados todavía.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-bold"
                  >
                    + Registrar el primero ahora
                  </button>
                </div>
              ) : (
                extraIncomes.map((inc) => {
                  const Icon = getCategoryIcon(inc.category);
                  const isCurrent = inc.type === 'recurring' || (inc.date || '').startsWith(currentMonthPrefix);
                  const targetBucket = (buckets || []).find((b) => b.id === inc.targetBucketId);
                  return (
                    <div
                      key={inc.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        inc.isActive === false
                          ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/50 opacity-60'
                          : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            inc.type === 'recurring'
                              ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/25'
                              : 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/25'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{inc.title}</h4>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                                inc.type === 'recurring'
                                  ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                  : 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                              }`}
                            >
                              {inc.type === 'recurring' ? 'Recurrente' : 'Puntual'}
                            </span>
                            {targetBucket && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                  inc.allocationMode === 'bucket_refund'
                                    ? 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30'
                                    : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30'
                                }`}
                              >
                                {inc.allocationMode === 'bucket_refund' ? (
                                  <ArrowRightLeft className="w-2.5 h-2.5 shrink-0" />
                                ) : (
                                  <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                                )}
                                <span>{targetBucket.name} ({inc.allocationMode === 'bucket_refund' ? 'Reembolso' : 'Inyección'})</span>
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1 rounded">
                                Activo este mes
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {inc.type === 'recurring' ? `Cobro día ${inc.dayOfMonth || 1} de cada mes` : `Fecha: ${inc.date}`}
                            {inc.notes ? ` · ${inc.notes}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className={`text-xs sm:text-sm font-mono font-bold ${
                          inc.allocationMode === 'bucket_refund'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          +{mask(inc.amount, currency)}
                        </span>

                        {inc.type === 'recurring' && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(inc)}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors ${
                              inc.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                            title={inc.isActive !== false ? 'Pausar ingreso recurrente' : 'Activar ingreso recurrente'}
                          >
                            {inc.isActive !== false ? 'Activo' : 'Pausado'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(inc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Eliminar ingreso extra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
