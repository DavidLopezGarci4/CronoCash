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
  ArrowRightLeft,
  Layers,
  Building,
  FastForward,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import {
  ExtraIncome,
  ExtraIncomeType,
  ExtraIncomeCategory,
  IncomeAllocationMode,
  Bucket,
  MonthlySalaryOverride,
} from '../../types';
import { HapticService } from '../../services/hapticService';
import { usePrivacy } from '../../context/PrivacyContext';
import { resolveTargetSalaryMonth, formatMonthName } from '../../services/csvImporterService';

interface ExtraIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  extraIncomes: ExtraIncome[];
  monthlySalaries?: Record<string, MonthlySalaryOverride>;
  buckets?: Bucket[];
  onSaveIncome: (income: ExtraIncome) => Promise<void>;
  onDeleteIncome: (id: string) => Promise<void>;
  onSaveSalary?: (month: string, salary: MonthlySalaryOverride) => Promise<void>;
  onDeleteSalary?: (month: string) => Promise<void>;
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
  monthlySalaries = {},
  buckets = [],
  onSaveIncome,
  onDeleteIncome,
  onSaveSalary,
  onDeleteSalary,
  currency,
  monthlyBaseIncome,
}) => {
  const { isPrivate, mask } = usePrivacy();
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [entryMode, setEntryMode] = useState<'salary' | 'extra'>('salary');

  // Meses de referencia
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const nextMonthPrefix = (() => {
    const [y, m] = currentMonthPrefix.split('-').map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  })();
  const prevMonthPrefix = (() => {
    const [y, m] = currentMonthPrefix.split('-').map(Number);
    return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  })();

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salaryMonth, setSalaryMonth] = useState<string>(() =>
    resolveTargetSalaryMonth(new Date().toISOString().split('T')[0])
  );
  const [type, setType] = useState<ExtraIncomeType>('punctual');
  const [category, setCategory] = useState<ExtraIncomeCategory>('gift');
  const [dayOfMonth, setDayOfMonth] = useState<number>(() => new Date().getDate());
  const [targetBucketId, setTargetBucketId] = useState<string>('');
  const [allocationMode, setAllocationMode] = useState<IncomeAllocationMode>('bucket_budget');
  const [notes, setNotes] = useState('');
  const [effectiveMonth, setEffectiveMonth] = useState<string>('');
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartEdit = (inc: ExtraIncome) => {
    HapticService.selection();
    setEditingIncomeId(inc.id);
    setEntryMode('extra');
    setTitle(inc.title);
    setAmount(String(inc.amount));
    setDate(inc.date || new Date().toISOString().split('T')[0]);
    setType(inc.type);
    setCategory(inc.category);
    setDayOfMonth(inc.dayOfMonth || (inc.date ? parseInt(inc.date.split('-')[2], 10) : 1));
    setTargetBucketId(inc.targetBucketId || '');
    setAllocationMode(inc.allocationMode || 'bucket_budget');
    setNotes(inc.notes || '');
    setEffectiveMonth(inc.effectiveMonth || (inc.date || '').substring(0, 7));
    setActiveTab('create');
  };

  const handleCancelEdit = () => {
    HapticService.selection();
    setEditingIncomeId(null);
    setTitle('');
    setAmount('');
    setTargetBucketId('');
    setAllocationMode('bucket_budget');
    setEffectiveMonth('');
    setNotes('');
  };

  if (!isOpen) return null;

  // Cálculo de totales para el mes actual
  const punctualThisMonth = extraIncomes
    .filter((i) => i.isActive !== false && i.type === 'punctual' && (i.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, i) => sum + i.amount, 0);

  const recurringThisMonth = extraIncomes
    .filter((i) => i.isActive !== false && i.type === 'recurring')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExtrasThisMonth = punctualThisMonth + recurringThisMonth;
  const totalBudgetMonth = monthlyBaseIncome + totalExtrasThisMonth;

  // Detección si la fecha actual está imputada a mes siguiente
  const isDateInNextMonth = (date || '').startsWith(nextMonthPrefix);
  const suggestedSalaryMonth = resolveTargetSalaryMonth(date);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (entryMode === 'salary') {
      setSalaryMonth(resolveTargetSalaryMonth(newDate));
    } else {
      setEffectiveMonth(newDate.substring(0, 7));
    }
  };

  const handleShiftNextMonth = () => {
    HapticService.selection();
    const parts = (date || new Date().toISOString().split('T')[0]).split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    const newDateStr = `${nextY}-${String(nextM).padStart(2, '0')}-01`;
    setDate(newDateStr);
    if (entryMode === 'salary') {
      setSalaryMonth(resolveTargetSalaryMonth(newDateStr));
    } else {
      setEffectiveMonth(newDateStr.substring(0, 7));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Introduce un importe válido mayor a 0');
      return;
    }

    setSaving(true);
    try {
      if (entryMode === 'salary') {
        if (!onSaveSalary) {
          throw new Error('Función de guardado de nómina no configurada');
        }
        const finalConcept = title.trim() || `Nómina ${formatMonthName(salaryMonth)}`;
        await onSaveSalary(salaryMonth, {
          amount: parsedAmount,
          concept: finalConcept,
          date,
          source: 'manual',
          updatedAt: new Date().toISOString(),
        });
        HapticService.impactMedium();
        setTitle('');
        setAmount('');
        setNotes('');
        setActiveTab('list');
      } else {
        if (!title.trim()) {
          setErrorMsg('Indica un título o concepto para el ingreso extra');
          setSaving(false);
          return;
        }

        const finalEffectiveMonth =
          type === 'punctual' && effectiveMonth && effectiveMonth !== date.substring(0, 7)
            ? effectiveMonth
            : undefined;

        const existingIncome = editingIncomeId ? extraIncomes.find((i) => i.id === editingIncomeId) : null;
        const incomeToSave: ExtraIncome = {
          id: editingIncomeId || `income_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: title.trim(),
          amount: parsedAmount,
          type,
          category,
          date: type === 'punctual' ? date : new Date().toISOString().split('T')[0],
          effectiveMonth: finalEffectiveMonth,
          dayOfMonth: type === 'recurring' ? dayOfMonth : undefined,
          frequency: type === 'recurring' ? 'monthly' : undefined,
          isActive: existingIncome ? existingIncome.isActive : true,
          notes: notes.trim() || undefined,
          createdAt: existingIncome?.createdAt || new Date().toISOString(),
          targetBucketId: targetBucketId || undefined,
          allocationMode: targetBucketId ? allocationMode : 'general',
        };

        await onSaveIncome(incomeToSave);
        HapticService.impactMedium();
        setEditingIncomeId(null);
        setTitle('');
        setAmount('');
        setTargetBucketId('');
        setAllocationMode('bucket_budget');
        setEffectiveMonth('');
        setNotes('');
        setActiveTab('list');
      }
    } catch (err: any) {
      setErrorMsg(`Error al guardar: ${err.message || err}`);
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

  const handleDeleteSalary = async (monthKey: string) => {
    if (confirm(`¿Restablecer el salario de ${formatMonthName(monthKey)} al salario base por defecto?`)) {
      HapticService.impactLight();
      if (onDeleteSalary) {
        await onDeleteSalary(monthKey);
      }
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

  const salaryEntries = Object.entries(monthlySalaries).sort((a, b) => b[0].localeCompare(a[0]));
  const totalHistoryCount = salaryEntries.length + extraIncomes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#0d1424] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-gradient-to-br dark:from-teal-500/20 dark:to-emerald-500/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black text-slate-900 dark:text-white truncate">
                Ingresos & Nóminas Reales
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Nómina blindada del mes o ingresos extras y reembolsos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Impacto en el Mes */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block truncate">
                Salario Mes
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-300">
                {mask(monthlyBaseIncome, currency, 0)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20">
              <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block truncate">
                + Extras Mes
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-teal-700 dark:text-teal-300">
                +{mask(totalExtrasThisMonth, currency)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                = Total Presup.
              </span>
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
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
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
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'list'
                ? 'text-teal-700 dark:text-teal-400 border-teal-600 dark:border-teal-500'
                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <CircleDollarSign className="w-3.5 h-3.5" />
            <span>Historial ({totalHistoryCount})</span>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="min-w-0 flex-1">{errorMsg}</span>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Banner de Edición Activa */}
              {editingIncomeId && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/40 flex items-center justify-between gap-2 text-xs animate-fadeIn">
                  <div className="flex items-center gap-2 min-w-0">
                    <Edit2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="font-bold text-amber-900 dark:text-amber-300 truncate">
                      Modificando o Reasignando Ingreso
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-200 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Selector de Modo: Nómina Real vs Ingreso Extra */}
              <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    HapticService.selection();
                    setEntryMode('salary');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryMode === 'salary'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">🏦 Nómina del Mes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    HapticService.selection();
                    setEntryMode('extra');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryMode === 'extra'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-400 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span className="truncate">🎁 Ingreso Extra</span>
                </button>
              </div>

              {entryMode === 'salary' ? (
                /* MODO NÓMINA REAL DEL MES */
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 text-xs text-teal-900 dark:text-teal-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>Blindaje Salarial del Mes</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Fija el importe neto real percibido para un mes específico. Sustituye el salario base estimado sin duplicarse con ingresos extras.
                    </p>
                  </div>

                  {/* Concepto e Importe */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Concepto / Empresa
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={`Nómina ${formatMonthName(salaryMonth)}`}
                        className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Importe Neto *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="1850"
                          className="w-full h-11 px-3 pr-8 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-teal-500"
                          required
                        />
                        <span className="absolute right-3 text-xs text-slate-400 font-mono">{currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fecha de Cobro */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Fecha de Cobro / Percepción
                      </label>
                      <button
                        type="button"
                        onClick={handleShiftNextMonth}
                        className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        title="Avanzar al día 1 del mes siguiente"
                      >
                        <FastForward className="w-3 h-3" />
                        <span>⏩ Mes +1</span>
                      </button>
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>

                  {/* Mes Presupuestario Objetivo (Imputación Inteligente) */}
                  <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Mes Presupuestario Financiado:
                      </label>
                      <span className="text-xs font-bold font-mono text-teal-700 dark:text-teal-400">
                        {formatMonthName(salaryMonth)} ({salaryMonth})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          HapticService.selection();
                          setSalaryMonth(suggestedSalaryMonth);
                        }}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                          salaryMonth === suggestedSalaryMonth
                            ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-500/40 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                          <span className="truncate">Sugerido: {formatMonthName(suggestedSalaryMonth)}</span>
                        </div>
                        <p className="text-[10px] font-normal opacity-80 mt-0.5 truncate">
                          {parseInt(date.split('-')[2] || '1', 10) >= 20
                            ? 'Día ≥ 20: Financia mes +1'
                            : 'Día < 20: Mes en curso'}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          HapticService.selection();
                          setSalaryMonth(currentMonthPrefix);
                        }}
                        className={`p-2 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer ${
                          salaryMonth === currentMonthPrefix
                            ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-500/40 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="truncate">Mes Actual: {formatMonthName(currentMonthPrefix)}</div>
                        <p className="text-[10px] font-normal opacity-80 mt-0.5 truncate">
                          Presupuesto de {currentMonthPrefix}
                        </p>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">O indicar mes:</span>
                      <input
                        type="month"
                        value={salaryMonth}
                        onChange={(e) => setSalaryMonth(e.target.value)}
                        className="h-8 px-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Botón Guardar Nómina */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-98 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>{saving ? 'Guardando...' : `Blindar Nómina de ${formatMonthName(salaryMonth)}`}</span>
                  </button>
                </div>
              ) : (
                /* MODO INGRESO EXTRA */
                <div className="space-y-4 animate-fadeIn">
                  {/* Concepto e Importe */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Concepto / Procedencia *
                      </label>
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
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Importe *
                      </label>
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Naturaleza del Ingreso
                    </label>
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
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <div className="text-left min-w-0 flex-1">
                          <div className="truncate">Puntual</div>
                          <div className="text-[10px] font-normal opacity-80 truncate">Un solo mes (venta, regalo)</div>
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
                        <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <div className="text-left min-w-0 flex-1">
                          <div className="truncate">Recurrente</div>
                          <div className="text-[10px] font-normal opacity-80 truncate">Cada mes (renta, alquiler)</div>
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
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Fecha del Ingreso Puntual
                        </label>
                        <button
                          type="button"
                          onClick={handleShiftNextMonth}
                          className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          title="Imputar directamente al mes siguiente"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>⏩ Mes +1</span>
                        </button>
                      </div>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        required
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Se computará en el mes {date.substring(0, 7)}.</span>
                        {isDateInNextMonth && (
                          <span className="text-teal-600 dark:text-teal-400 font-bold">
                            ⏩ Imputado a mes siguiente
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Día de Cobro Estimado (1-31)
                      </label>
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
                        <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span className="truncate">Destinar a una Bolsa Específica (Opcional)</span>
                      </label>
                      {targetBucketId && (
                        <button
                          type="button"
                          onClick={() => setTargetBucketId('')}
                          className="text-[10px] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer font-semibold shrink-0"
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
                              <span className="truncate">Inyección Presupuestaria</span>
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
                              <span className="truncate">Reembolso / Devolución</span>
                            </div>
                            <p className="text-[10px] mt-1 opacity-80 leading-snug">
                              Minora directamente los gastos registrados en esta bolsa (Bizums, devoluciones).
                            </p>
                          </button>
                        </div>

                        {/* Imputación Retroactiva Flexible a Meses Anteriores */}
                        {type === 'punctual' && (() => {
                          const incomeCalMonth = (date || '').substring(0, 7);
                          const [incYear, incMonthNum] = incomeCalMonth.split('-').map(Number);
                          const getPastMonth = (offset: number) => {
                            let y = incYear;
                            let m = incMonthNum - offset;
                            while (m < 1) {
                              m += 12;
                              y -= 1;
                            }
                            return `${y}-${String(m).padStart(2, '0')}`;
                          };
                          const incomePrevMonth = getPastMonth(1);
                          const incomePrevMonth2 = getPastMonth(2);
                          const incomePrevMonth3 = getPastMonth(3);
                          const activeEffectiveMonth = effectiveMonth || incomeCalMonth;

                          return (
                            <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 animate-fadeIn">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                                  <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                  <span className="truncate">Mes Contable de Imputación</span>
                                </span>
                                {activeEffectiveMonth < incomeCalMonth && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                                    Desahogo Mes Anterior
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                                {allocationMode === 'bucket_refund'
                                  ? '💡 Al imputar este reembolso a un mes anterior, se minora el gasto neto de esa bolsa en dicho mes, descargando su balance y liberando superávit que se derivará a tu Colchón de Ahorro.'
                                  : 'Puedes imputar este ingreso al mes en curso o retroactivamente a cualquier mes anterior para equilibrar presupuestos.'}
                              </p>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    HapticService.selection();
                                    setEffectiveMonth(incomeCalMonth);
                                  }}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    activeEffectiveMonth === incomeCalMonth
                                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 shadow-xs font-bold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate">Mes del Cobro</div>
                                  <div className="text-[9px] opacity-80 truncate">{formatMonthName(incomeCalMonth)}</div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    HapticService.selection();
                                    setEffectiveMonth(incomePrevMonth);
                                  }}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    activeEffectiveMonth === incomePrevMonth
                                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 shadow-xs font-bold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate">⏪ Mes Pasado</div>
                                  <div className="text-[9px] opacity-80 truncate">{formatMonthName(incomePrevMonth)}</div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    HapticService.selection();
                                    setEffectiveMonth(incomePrevMonth2);
                                  }}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    activeEffectiveMonth === incomePrevMonth2
                                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 shadow-xs font-bold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate">Hace 2 meses</div>
                                  <div className="text-[9px] opacity-80 truncate">{formatMonthName(incomePrevMonth2)}</div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    HapticService.selection();
                                    setEffectiveMonth(incomePrevMonth3);
                                  }}
                                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                    activeEffectiveMonth === incomePrevMonth3
                                      ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 shadow-xs font-bold'
                                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  <div className="text-[10px] font-bold truncate">Hace 3 meses</div>
                                  <div className="text-[9px] opacity-80 truncate">{formatMonthName(incomePrevMonth3)}</div>
                                </button>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">O indicar mes exacto:</span>
                                <input
                                  type="month"
                                  value={activeEffectiveMonth}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setEffectiveMonth(e.target.value);
                                    }
                                  }}
                                  className="h-8 px-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                                />
                              </div>
                            </div>
                          );
                        })()}
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
                    <span>
                      {saving
                        ? 'Guardando...'
                        : editingIncomeId
                        ? 'Actualizar Ingreso'
                        : 'Registrar Ingreso Extra'}
                    </span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            /* PESTAÑA HISTORIAL Y RECURRENTES */
            <div className="space-y-5">
              {/* Sección 1: Nóminas Reales Blindadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Nóminas Reales Blindadas ({salaryEntries.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryMode('salary');
                      setActiveTab('create');
                    }}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
                  >
                    + Blindar mes
                  </button>
                </div>

                {salaryEntries.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-center">
                    No hay nóminas específicas guardadas. Se aplica el salario base configurado ({monthlyBaseIncome} {currency}).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {salaryEntries.map(([monthKey, sal]) => (
                      <div
                        key={monthKey}
                        className="p-3 rounded-2xl border bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/25 shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {formatMonthName(monthKey)} ({monthKey})
                              </h4>
                              <span
                                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                                  sal.source === 'bank_import'
                                    ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30'
                                    : 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                                }`}
                              >
                                {sal.source === 'bank_import' ? 'Extracto Bancario' : 'Manual'}
                              </span>
                              {monthKey === currentMonthPrefix && (
                                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1 rounded">
                                  Mes Actual
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {sal.concept || 'Nómina mensual'} {sal.date ? `· Cobro: ${sal.date}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{mask(sal.amount, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSalary(monthKey)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Restablecer al salario base"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sección 2: Ingresos Extras */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Ingresos Extras Registrados ({extraIncomes.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEntryMode('extra');
                      setActiveTab('create');
                    }}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-bold"
                  >
                    + Añadir extra
                  </button>
                </div>

                {extraIncomes.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 dark:text-slate-400 space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                    <CircleDollarSign className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">No tienes ingresos extras registrados todavía.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extraIncomes.map((inc) => {
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
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 ${
                                inc.type === 'recurring'
                                  ? 'bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/25'
                                  : 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/25'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {inc.title}
                                </h4>
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
                                    <span className="truncate">
                                      {targetBucket.name} ({inc.allocationMode === 'bucket_refund' ? 'Reembolso' : 'Inyección'})
                                    </span>
                                  </span>
                                )}
                                {isCurrent && (
                                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1 rounded">
                                    Activo este mes
                                  </span>
                                )}
                                {inc.effectiveMonth && inc.effectiveMonth !== (inc.date || '').substring(0, 7) && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 truncate shrink-0">
                                    Imputado a {formatMonthName(inc.effectiveMonth)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {inc.type === 'recurring'
                                  ? `Cobro día ${inc.dayOfMonth || 1} de cada mes`
                                  : `Fecha: ${inc.date}`}
                                {inc.notes ? ` · ${inc.notes}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span
                              className={`text-xs sm:text-sm font-mono font-bold ${
                                inc.allocationMode === 'bucket_refund'
                                  ? 'text-cyan-600 dark:text-cyan-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
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
                              onClick={() => handleStartEdit(inc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                              title="Editar o reasignar ingreso extra"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

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
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
