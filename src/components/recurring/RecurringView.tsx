import React, { useState } from 'react';
import {
  Plus,
  Repeat,
  Trash2,
  Edit2,
  Play,
  Calendar,
  X,
  Sparkles,
  Flame,
  AlertTriangle,
  Clock,
  TrendingDown,
  Shield,
  Zap,
  Home,
  Smartphone,
  Car,
  Utensils,
  Music,
  Droplets,
  DollarSign,
  Filter,
} from 'lucide-react';
import { RecurringRule, Bucket, Expense } from '../../types';
import { DBService } from '../../services/db';

interface RecurringViewProps {
  rules: RecurringRule[];
  buckets: Bucket[];
  currency: string;
  onSaveRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onApplyRuleNow: (rule: RecurringRule) => void;
  onRefresh?: () => void;
}

// Iconos disponibles para recurrentes
const RECURRING_ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Zap,
  Droplets,
  Smartphone,
  Car,
  Utensils,
  Music,
  Shield,
  Repeat,
};

export const RecurringView: React.FC<RecurringViewProps> = ({
  rules,
  buckets,
  currency,
  onSaveRule,
  onDeleteRule,
  onApplyRuleNow,
  onRefresh,
}) => {
  // Modales y Vistas
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [vampireModalOpen, setVampireModalOpen] = useState(false);
  const [filterVampireOnly, setFilterVampireOnly] = useState(false);

  // Formulario
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [bucketId, setBucketId] = useState(buckets[0]?.id || '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [icon, setIcon] = useState('Repeat');
  const [isVampire, setIsVampire] = useState(false);
  const [notes, setNotes] = useState('');

  // Cálculo de fecha del próximo cobro y días restantes
  const getNextBillingDetails = (rule: RecurringRule) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const targetDay = Math.min(Math.max(1, rule.dayOfMonth || 1), 28); // Días seguros para meses cortos

    let nextDate = new Date(currentYear, currentMonth, targetDay);

    // Si ya pasó en este mes para frecuencia mensual
    if (rule.frequency === 'monthly') {
      if (today.getDate() > targetDay) {
        nextDate = new Date(currentYear, currentMonth + 1, targetDay);
      }
    } else if (rule.frequency === 'yearly') {
      if (today > nextDate) {
        nextDate = new Date(currentYear + 1, currentMonth, targetDay);
      }
    } else if (rule.frequency === 'quarterly') {
      if (today > nextDate) {
        nextDate = new Date(currentYear, currentMonth + 3, targetDay);
      }
    } else if (rule.frequency === 'weekly') {
      const dayDiff = ((rule.dayOfWeek || 1) - today.getDay() + 7) % 7;
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (dayDiff === 0 && today.getHours() > 18 ? 7 : dayDiff));
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      nextDate,
      daysLeft: Math.max(0, daysLeft),
      formattedDate: nextDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      }),
    };
  };

  const openAdd = () => {
    setEditingRule(null);
    setTitle('');
    setAmount('');
    setBucketId(buckets[0]?.id || '');
    setFrequency('monthly');
    setDayOfMonth('1');
    setIcon('Repeat');
    setIsVampire(false);
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
    setIcon(r.icon || 'Repeat');
    setIsVampire(!!r.isVampire);
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
      icon,
      isVampire,
      notes: notes.trim() || undefined,
    };

    onSaveRule(rule);
    setModalOpen(false);
  };

  // Cargar Smart Seeds de Recurrentes
  const handleSmartSeeds = async () => {
    const confirmSeed = window.confirm(
      '¿Cargar la plantilla de Facturas Recurrentes Clave (Hipoteca, Luz, Agua, Fibra, Seguro Coche, Gimnasio y Streaming)?'
    );
    if (!confirmSeed) return;

    try {
      await DBService.applyRecurringSeeds('append');
      navigator.vibrate?.(35);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al aplicar la plantilla de recurrentes.');
    }
  };

  const frequencyLabels = {
    weekly: 'Semanal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    yearly: 'Anual',
  };

  // Normalización a gasto mensual
  const normalizeToMonthly = (amount: number, freq: string) => {
    switch (freq) {
      case 'weekly':
        return amount * 4.33;
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      default:
        return amount;
    }
  };

  // Métricas Consolidadas
  const totalMonthlyCommitment = rules
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum + normalizeToMonthly(r.amount, r.frequency), 0);

  const totalYearlyCommitment = totalMonthlyCommitment * 12;

  // Gastos vampiro detectados
  const vampireRules = rules.filter((r) => r.isVampire || r.title.toLowerCase().includes('streaming') || r.title.toLowerCase().includes('spotify') || r.title.toLowerCase().includes('netflix'));
  const vampireMonthlyTotal = vampireRules.reduce((sum, r) => sum + normalizeToMonthly(r.amount, r.frequency), 0);

  // Ordenar reglas por proximidad del próximo cobro
  const sortedRules = [...rules].sort((a, b) => {
    const aDetails = getNextBillingDetails(a);
    const bDetails = getNextBillingDetails(b);
    return aDetails.daysLeft - bDetails.daysLeft;
  });

  const displayedRules = filterVampireOnly
    ? sortedRules.filter((r) => r.isVampire)
    : sortedRules;

  const nextImminentRule = sortedRules[0];
  const nextImminentDetails = nextImminentRule ? getNextBillingDetails(nextImminentRule) : null;

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-400" />
            <span>Facturas y Recurrentes</span>
          </h2>
          <p className="text-xs text-slate-400">
            Previsión de vencimientos, cuenta atrás y detección de gastos vampiro
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {vampireRules.length > 0 && (
            <button
              onClick={() => setVampireModalOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Auditoría de Gastos Vampiro"
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Gastos Vampiro ({vampireRules.length})</span>
            </button>
          )}

          <button
            onClick={handleSmartSeeds}
            title="Cargar Facturas Maestras"
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Seeds</span>
          </button>

          <button
            onClick={openAdd}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Recurrente</span>
          </button>
        </div>
      </div>

      {/* Dashboard Superior de Compromisos y Cobro Inminente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tarjeta 1: Compromiso Mensual */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Comprometido / Mes</span>
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-white">
              {totalMonthlyCommitment.toFixed(2)} {currency}
            </div>
            <span className="text-[11px] text-slate-500">
              Proyección anual: ~{totalYearlyCommitment.toFixed(0)} {currency}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Cobro Más Cercano */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Cobro Inminente</span>
          </span>
          {nextImminentRule && nextImminentDetails ? (
            <div className="mt-2">
              <div className="text-sm font-bold text-white truncate flex items-center justify-between">
                <span>{nextImminentRule.title}</span>
                <span className="font-mono text-emerald-400">
                  {nextImminentRule.amount.toFixed(2)} {currency}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-amber-400 mt-0.5">
                {nextImminentDetails.daysLeft === 0
                  ? '🔴 ¡Vence HOY!'
                  : nextImminentDetails.daysLeft === 1
                  ? '🟠 Vence MAÑANA'
                  : `🟡 Vence en ${nextImminentDetails.daysLeft} días (${nextImminentDetails.formattedDate})`}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">Sin vencimientos activos</div>
          )}
        </div>

        {/* Tarjeta 3: Detección Vampiro */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-950/30 to-slate-900 border border-purple-500/30 flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Coste Vampiro / Mes</span>
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-purple-300">
              {vampireMonthlyTotal.toFixed(2)} {currency}
            </div>
            <button
              onClick={() => setVampireModalOpen(true)}
              className="text-[11px] text-purple-400 hover:text-purple-200 underline font-semibold mt-0.5 cursor-pointer"
            >
              Auditar {vampireRules.length} servicios para ahorrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Recurrentes */}
      {rules.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-3">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No hay facturas o recibos recurrentes</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Configura tus pagos periódicos (hipoteca, luz, internet, seguros) para que la app calcule tu liquidez futura.
          </p>
          <button
            onClick={handleSmartSeeds}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Cargar Plantilla de Ejemplo</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedRules.map((rule) => {
            const bucket = buckets.find((b) => b.id === rule.bucketId);
            const { daysLeft, formattedDate } = getNextBillingDetails(rule);
            const IconComp = RECURRING_ICON_MAP[rule.icon || ''] || Repeat;

            // Semáforo de cuenta atrás
            let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
            let badgeText = `En ${daysLeft} días (${formattedDate})`;

            if (daysLeft === 0) {
              badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
              badgeText = `¡Vence HOY! (${formattedDate})`;
            } else if (daysLeft === 1) {
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              badgeText = `¡Mañana! (${formattedDate})`;
            } else if (daysLeft <= 3) {
              badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              badgeText = `En ${daysLeft} días (${formattedDate})`;
            }

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-3xl bg-slate-900/90 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  daysLeft <= 1
                    ? 'border-amber-500/40 shadow-md shadow-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 border shadow-xs"
                    style={{
                      backgroundColor: `${bucket?.color || '#3b82f6'}20`,
                      borderColor: `${bucket?.color || '#3b82f6'}50`,
                      color: bucket?.color || '#3b82f6',
                    }}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm font-bold text-white truncate">{rule.title}</span>
                      {rule.isVampire && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-purple-400" /> Vampiro
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
                      <span className="font-semibold" style={{ color: bucket?.color }}>
                        {bucket?.name || 'General'}
                      </span>
                      <span>•</span>
                      <span>{frequencyLabels[rule.frequency]} (Día {rule.dayOfMonth || 1})</span>
                      {rule.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] text-slate-500">{rule.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right mr-2">
                    <div className="text-base font-black font-mono text-white">
                      {rule.amount.toFixed(2)} {currency}
                    </div>
                  </div>

                  {/* Botón Aplicar Pago Inmediato */}
                  <button
                    onClick={() => {
                      onApplyRuleNow(rule);
                      navigator.vibrate?.([20, 30]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    title="Registrar pago de esta factura ahora en tus gastos"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Registrar Pago</span>
                  </button>

                  <button
                    onClick={() => openEdit(rule)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar factura recurrente "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800"
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

      {/* MODAL 1: Añadir / Editar Regla Recurrente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Repeat className="w-4 h-4 text-emerald-400" />
                <span>{editingRule ? 'Editar Recurrente' : 'Nueva Factura / Gasto Recurrente'}</span>
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
                <label className="text-xs font-bold text-slate-400">Concepto del Recibo / Factura *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Hipoteca, Luz Iberdrola, Fibra Digi..."
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Importe Estimado ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="65.00"
                    className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
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
                  <label className="text-xs font-bold text-slate-400">Día de Cargo del Mes</label>
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
                  <label className="text-xs font-bold text-slate-400">Bolsa Asignada</label>
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

              {/* Selector de Icono */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Icono Identificativo</label>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {['Home', 'Zap', 'Droplets', 'Smartphone', 'Car', 'Utensils', 'Music', 'Shield', 'Repeat'].map(
                    (ic) => {
                      const Comp = RECURRING_ICON_MAP[ic] || Repeat;
                      return (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                            icon === ic
                              ? 'bg-emerald-500 text-slate-950 font-bold scale-105'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Comp className="w-4 h-4" />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Checkbox Gasto Vampiro */}
              <div
                onClick={() => setIsVampire(!isVampire)}
                className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center space-x-3 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isVampire
                      ? 'bg-purple-500 border-purple-500 text-slate-950'
                      : 'border-purple-400/50'
                  }`}
                >
                  {isVampire && <Flame className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">
                    Marcar como Gasto Vampiro / Suscripción Prescindible
                  </div>
                  <div className="text-[10px] text-purple-300/80">
                    Se incluirá en el panel de auditoría para liberar ahorro mensual
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Observaciones / Referencia</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Número de póliza, cuenta o notas..."
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

      {/* MODAL 2: Auditoría de Gastos Vampiro */}
      {vampireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-purple-500/50 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-purple-400" />
                <span>Auditoría de Gastos Vampiro y Suscripciones</span>
              </h3>
              <button
                onClick={() => setVampireModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 text-center space-y-1">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                  Impacto Anual Acumulado en Suscripciones
                </span>
                <div className="text-3xl font-mono font-black text-purple-200">
                  {(vampireMonthlyTotal * 12).toFixed(2)} {currency} / año
                </div>
                <p className="text-[11px] text-slate-400">
                  Representa {vampireMonthlyTotal.toFixed(2)} {currency} cada mes que podrías redirigir a tu Colchón de Ahorro
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Suscripciones y Servicios Detectados:</span>
                {vampireRules.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{v.title}</div>
                      <div className="text-[10px] text-purple-400">
                        {v.amount.toFixed(2)} {currency} ({frequencyLabels[v.frequency]}) • Ahorro con plan anual estimado: ~{(v.amount * 2).toFixed(0)} {currency}/año
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`¿Desactivar y eliminar la suscripción "${v.title}"?`)) {
                          onDeleteRule(v.id);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Consejo del Gentleman para Gastos Vampiro:</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Migrar plataformas mensuales (Netflix, Spotify, Amazon Prime, Gimnasio) a <strong>pagos anuales</strong> suele regalar 2 meses de servicio (ahorro directo del 16,6%). Si además cancelas un servicio que no usas al menos 3 veces por semana, liberarás más de 300 € netos al año.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setVampireModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
