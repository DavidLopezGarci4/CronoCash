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
  Bell,
  Check,
  CheckCircle2,
  Stethoscope,
  Wrench,
  Gift,
  Landmark,
} from 'lucide-react';
import { RecurringRule, Bucket, Expense, RecurringCostType, ReminderOffset, RecurringCategoryType } from '../../types';
import { DBService } from '../../services/db';
import { HapticService } from '../../services/hapticService';

interface RecurringViewProps {
  rules: RecurringRule[];
  buckets: Bucket[];
  currency: string;
  onSaveRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onApplyRuleNow: (rule: RecurringRule) => void;
  onRequestConfirmRecurring?: (rule: RecurringRule) => void;
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
  Bell,
  Sparkles,
};

const AVAILABLE_OFFSETS: Array<{ id: ReminderOffset; label: string }> = [
  { id: 'same_day', label: 'Mismo día' },
  { id: '1_day', label: '1 día antes' },
  { id: '3_days', label: '3 días antes' },
  { id: '1_week', label: '1 sem antes' },
  { id: '2_weeks', label: '2 sem antes' },
  { id: '1_month', label: '1 mes antes' },
  { id: '1_quarter', label: '1 trim antes (90d)' },
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const RecurringView: React.FC<RecurringViewProps> = ({
  rules,
  buckets,
  currency,
  onSaveRule,
  onDeleteRule,
  onApplyRuleNow,
  onRequestConfirmRecurring,
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
  const [costType, setCostType] = useState<RecurringCostType>('fixed');
  const [categoryType, setCategoryType] = useState<RecurringCategoryType>('bill');
  const [bucketId, setBucketId] = useState(buckets[0]?.id || '');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [monthOfYear, setMonthOfYear] = useState('1');
  const [icon, setIcon] = useState('Repeat');
  const [isVampire, setIsVampire] = useState(false);
  const [notes, setNotes] = useState('');
  const [reminderOffsets, setReminderOffsets] = useState<ReminderOffset[]>(['3_days', 'same_day']);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [autoAdaptNextDates, setAutoAdaptNextDates] = useState(true);

  // Cálculo de fecha del próximo cobro y días restantes
  const getNextBillingDetails = (rule: RecurringRule) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const targetDay = Math.min(Math.max(1, rule.dayOfMonth || 1), 28);

    let nextDate = new Date(currentYear, currentMonth, targetDay);

    if (rule.frequency === 'monthly') {
      if (today.getDate() > targetDay) {
        nextDate = new Date(currentYear, currentMonth + 1, targetDay);
      }
    } else if (rule.frequency === 'yearly') {
      const targetMonth = rule.monthOfYear
        ? rule.monthOfYear - 1
        : (rule.startDate ? new Date(rule.startDate).getMonth() : currentMonth);
      nextDate = new Date(currentYear, targetMonth, targetDay);
      if (today.getTime() > nextDate.getTime()) {
        nextDate = new Date(currentYear + 1, targetMonth, targetDay);
      }
    } else if (rule.frequency === 'quarterly') {
      const startM = rule.startDate ? new Date(rule.startDate).getMonth() : 0;
      for (let offset = 0; offset <= 12; offset++) {
        const checkM = currentMonth + offset;
        if (Math.abs(checkM - startM) % 3 === 0) {
          const candidate = new Date(currentYear, checkM, targetDay);
          if (candidate.getTime() > today.getTime()) {
            nextDate = candidate;
            break;
          }
        }
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
    setCostType('fixed');
    setCategoryType('bill');
    setBucketId(buckets[0]?.id || '');
    setFrequency('monthly');
    setDayOfMonth('1');
    setMonthOfYear('1');
    setIcon('Repeat');
    setIsVampire(false);
    setNotes('');
    setReminderOffsets(['3_days', 'same_day']);
    setReminderTime('09:00');
    setAutoAdaptNextDates(true);
    setModalOpen(true);
  };

  const openEdit = (r: RecurringRule) => {
    setEditingRule(r);
    setTitle(r.title);
    setAmount(r.amount > 0 ? String(r.amount) : '');
    setCostType(r.costType || (r.amount > 0 ? 'fixed' : 'none'));
    setCategoryType(r.categoryType || 'bill');
    setBucketId(r.bucketId);
    setFrequency(r.frequency);
    setDayOfMonth(String(r.dayOfMonth || 1));
    setMonthOfYear(String(r.monthOfYear || (r.startDate ? new Date(r.startDate).getMonth() + 1 : 1)));
    setIcon(r.icon || 'Repeat');
    setIsVampire(!!r.isVampire);
    setNotes(r.notes || '');
    setReminderOffsets(r.reminderOffsets && r.reminderOffsets.length > 0 ? r.reminderOffsets : ['3_days', 'same_day']);
    setReminderTime(r.reminderTime || '09:00');
    setAutoAdaptNextDates(r.autoAdaptNextDates ?? true);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedAmount = 0;
    if (costType !== 'none') {
      parsedAmount = parseFloat(amount.replace(',', '.'));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        alert('Introduce un importe válido superior a 0.');
        return;
      }
    }

    const rule: RecurringRule = {
      id: editingRule?.id || `rec_${Date.now()}`,
      title: title.trim() || 'Acto recurrente sin título',
      amount: parsedAmount,
      costType,
      categoryType,
      bucketId: bucketId || (buckets[0]?.id ?? 'default'),
      frequency,
      dayOfMonth: parseInt(dayOfMonth) || 1,
      monthOfYear: frequency === 'yearly' ? (parseInt(monthOfYear) || 1) : undefined,
      startDate: editingRule?.startDate || new Date().toISOString().split('T')[0],
      isActive: editingRule ? editingRule.isActive : true,
      autoCreateExpense: costType !== 'none',
      icon,
      isVampire: costType !== 'none' ? isVampire : false,
      notes: notes.trim() || undefined,
      reminderOffsets,
      reminderTime,
      autoAdaptNextDates,
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
      await HapticService.impactMedium();
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

  // Métricas Consolidadas (solo las que tienen coste dinerario)
  const totalMonthlyCommitment = rules
    .filter((r) => r.isActive && r.costType !== 'none' && r.amount > 0)
    .reduce((sum, r) => sum + normalizeToMonthly(r.amount, r.frequency), 0);

  const totalYearlyCommitment = totalMonthlyCommitment * 12;

  // Gastos vampiro detectados
  const vampireRules = rules.filter(
    (r) => r.isVampire || r.title.toLowerCase().includes('streaming') || r.title.toLowerCase().includes('spotify') || r.title.toLowerCase().includes('netflix')
  );
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
            <span>Facturas, Tareas y Recurrentes</span>
          </h2>
          <p className="text-xs text-slate-400">
            Avisos escalonados, costes estimados y desplazamiento adaptativo de ciclos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {vampireRules.length > 0 && (
            <button
              onClick={() => setVampireModalOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
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
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Acto / Recurrente</span>
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
            <span>Próximo Hito</span>
          </span>
          {nextImminentRule && nextImminentDetails ? (
            <div className="mt-2">
              <div className="text-sm font-bold text-white truncate flex items-center justify-between">
                <span>{nextImminentRule.title}</span>
                <span className="font-mono text-emerald-400">
                  {nextImminentRule.costType === 'none'
                    ? 'Sin coste'
                    : nextImminentRule.costType === 'estimated'
                    ? `~${nextImminentRule.amount.toFixed(2)} ${currency}`
                    : `${nextImminentRule.amount.toFixed(2)} ${currency}`}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-amber-400 mt-0.5">
                {nextImminentDetails.daysLeft === 0
                  ? '🔴 ¡Toca HOY!'
                  : nextImminentDetails.daysLeft === 1
                  ? '🟠 Toca MAÑANA'
                  : `🟡 Toca en ${nextImminentDetails.daysLeft} días (${nextImminentDetails.formattedDate})`}
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
          <h3 className="text-sm font-bold text-slate-300">No hay actos o tareas recurrentes</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Configura compromisos (lentillas, vacunas, cumpleaños, seguros, luz, internet) con avisos escalonados a tu medida.
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

            const isPureTask = rule.costType === 'none' || (!rule.amount && rule.costType !== 'estimated');
            const isEstimated = rule.costType === 'estimated';
            const todayStr = new Date().toISOString().split('T')[0];
            const isCompletedToday =
              (rule.completedDates || []).includes(todayStr) || rule.lastGeneratedDate === todayStr;

            // Semáforo de cuenta atrás
            let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
            let badgeText = `En ${daysLeft} días (${formattedDate})`;

            if (isCompletedToday) {
              badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              badgeText = `✓ Completada hoy (${formattedDate})`;
            } else if (daysLeft === 0) {
              badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
              badgeText = `¡Toca HOY! (${formattedDate})`;
            } else if (daysLeft === 1) {
              badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              badgeText = `¡Mañana! (${formattedDate})`;
            } else if (daysLeft <= 3) {
              badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              badgeText = `En ${daysLeft} días (${formattedDate})`;
            }

            let categoryBadge = '💳 Recibo';
            if (rule.categoryType === 'health') categoryBadge = '🩺 Salud';
            else if (rule.categoryType === 'maintenance') categoryBadge = '🔧 Mantenimiento';
            else if (rule.categoryType === 'tax') categoryBadge = '🏛️ Impuesto';
            else if (rule.categoryType === 'personal') categoryBadge = '🎂 Personal';
            else if (rule.categoryType === 'subscription') categoryBadge = '🔁 Suscripción';

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-3xl bg-slate-900/90 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompletedToday
                    ? 'border-emerald-500/30 shadow-md shadow-emerald-950/20'
                    : daysLeft <= 1
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {categoryBadge}
                      </span>
                      {isEstimated && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          Estimado
                        </span>
                      )}
                      {isPureTask && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          Tarea
                        </span>
                      )}
                      {rule.isVampire && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" /> Vampiro
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center space-x-2 mt-1">
                      <span className="font-semibold" style={{ color: isPureTask ? '#c084fc' : bucket?.color }}>
                        {isPureTask ? 'Recordatorio' : bucket?.name || 'General'}
                      </span>
                      <span>•</span>
                      <span>
                        {frequencyLabels[rule.frequency]} (
                        {rule.frequency === 'yearly' && rule.monthOfYear
                          ? `${rule.dayOfMonth || 1} de ${MONTH_NAMES[(rule.monthOfYear || 1) - 1]}`
                          : `Día ${rule.dayOfMonth || 1}`}
                        )
                      </span>
                      {rule.reminderOffsets && rule.reminderOffsets.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400 font-medium">
                            🔔 {rule.reminderOffsets.length} alertas ({rule.reminderTime || '09:00'})
                          </span>
                        </>
                      )}
                      {rule.notes &&
                        !rule.notes.toLowerCase().startsWith(rule.title.toLowerCase().slice(0, 5)) &&
                        !rule.title.toLowerCase().startsWith(rule.notes.toLowerCase().slice(0, 5)) && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px] text-slate-500">{rule.notes}</span>
                          </>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right mr-2">
                    <div className="text-base font-black font-mono text-white">
                      {isPureTask ? (
                        <span className="text-purple-300 text-xs font-semibold">Sin coste</span>
                      ) : isEstimated ? (
                        <span className="text-amber-300">~{rule.amount.toFixed(2)} {currency}</span>
                      ) : (
                        `${rule.amount.toFixed(2)} ${currency}`
                      )}
                    </div>
                  </div>

                  {/* Botón Confirmar / Registrar / Completada */}
                  {isCompletedToday ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Completada</span>
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (onRequestConfirmRecurring) {
                          onRequestConfirmRecurring(rule);
                        } else {
                          onApplyRuleNow(rule);
                          await HapticService.notificationSuccess();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      title={isPureTask ? 'Completar tarea y avanzar ciclo' : 'Confirmar o ajustar importe del gasto'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {isPureTask ? 'Completar Tarea' : isEstimated ? 'Confirmar / Ajustar' : 'Registrar Pago'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(rule)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 cursor-pointer"
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

      {/* MODAL CREAR / EDITAR RECURRENTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-400" />
                <span>{editingRule ? 'Editar Acto Recurrente' : 'Nuevo Acto Recurrente'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Selector de Tipo de Coste */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Tipo de Compromiso / Coste *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCostType('fixed')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      costType === 'fixed'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    💳 Gasto Fijo
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostType('estimated')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      costType === 'estimated'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚖️ Estimado
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostType('none')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                      costType === 'none'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    📝 Tarea / Salud
                  </button>
                </div>
              </div>

              {/* Categoría Funcional */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Categoría Funcional *</label>
                <select
                  value={categoryType}
                  onChange={(e: any) => setCategoryType(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="bill">💳 Recibo / Factura (Luz, Agua, Alquiler)</option>
                  <option value="subscription">🔁 Suscripción (Streaming, Gimnasio)</option>
                  <option value="health">🩺 Salud (Lentillas, Medicación, Dentista)</option>
                  <option value="maintenance">🔧 Mantenimiento / Mascota (Veterinario, ITV)</option>
                  <option value="personal">🎂 Personal (Cumpleaños, Aniversarios)</option>
                  <option value="tax">🏛️ Impuesto / Tributo (IBI, Modelos AEAT)</option>
                </select>
              </div>

              {/* Concepto */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Concepto / Nombre del Acto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Cambio lentillas, Vacuna perro, Seguro coche..."
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Importe y Frecuencia */}
              <div className="grid grid-cols-2 gap-3">
                {costType !== 'none' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">
                      {costType === 'estimated' ? 'Coste Estimado' : 'Importe Fijo'} ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="45.00"
                      className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Coste Económico</label>
                    <div className="h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center text-purple-300 font-semibold">
                      Sin coste directo (0.00 {currency})
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400">Frecuencia *</label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full h-11 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              {/* Si es anual: Selector de Mes */}
              {frequency === 'yearly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Mes del Año *</label>
                    <select
                      value={monthOfYear}
                      onChange={(e) => setMonthOfYear(e.target.value)}
                      className="w-full h-11 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Día del Mes (1-31) *</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Si no es anual: Día del mes y Bolsa */}
              {frequency !== 'yearly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Día de Cobro/Hito (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400">Bolsa Asignada</label>
                    <select
                      value={bucketId}
                      onChange={(e) => setBucketId(e.target.value)}
                      className="w-full h-11 px-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-medium text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {buckets.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Avisos Escalonados con Antelación */}
              <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Avisar con Antelación (Escalonado):</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Hora:</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AVAILABLE_OFFSETS.map((off) => {
                    const isSelected = reminderOffsets.includes(off.id);
                    return (
                      <button
                        key={off.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (reminderOffsets.length > 1) {
                              setReminderOffsets(reminderOffsets.filter((o) => o !== off.id));
                            }
                          } else {
                            setReminderOffsets([...reminderOffsets, off.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-blue-500 text-white border-blue-400 shadow-xs'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {off.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Se programarán notificaciones de alta prioridad para cada plazo marcado.
                </span>
              </div>

              {/* Toggle de Adaptabilidad de Ciclos Futuros */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdaptNextDates}
                  onChange={(e) => setAutoAdaptNextDates(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-300">
                  <b>Adaptabilidad dinámica</b>: Si realizas esta tarea o pago un día antes o después, reprogramar automáticamente los meses siguientes a esa nueva fecha.
                </span>
              </label>

              {/* Selector de Icono */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Icono Identificativo</label>
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {['Home', 'Zap', 'Droplets', 'Smartphone', 'Car', 'Utensils', 'Music', 'Shield', 'Repeat', 'Bell', 'Sparkles'].map(
                    (ic) => {
                      const Comp = RECURRING_ICON_MAP[ic] || Repeat;
                      return (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
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

              {/* Checkbox Gasto Vampiro si no es tarea pura */}
              {costType !== 'none' && (
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
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Observaciones / Referencia</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Contrato renovación, graduación lentillas..."
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {editingRule ? 'Guardar Cambios' : 'Crear Recurrente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AUDITORÍA DE GASTOS VAMPIRO */}
      {vampireModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Auditoría de Gastos Vampiro</h3>
                  <p className="text-[11px] text-purple-300">
                    Suscripciones y micro-servicios que drenan tu capacidad de ahorro
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVampireModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-200 uppercase font-bold">Fuga Mensual Detectada</span>
                <div className="text-2xl font-black font-mono text-purple-400">
                  {vampireMonthlyTotal.toFixed(2)} {currency}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-200 uppercase font-bold">Ahorro Anual Potencial</span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {(vampireMonthlyTotal * 12).toFixed(2)} {currency}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Servicios Auditados ({vampireRules.length}):</span>
              {vampireRules.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white">{r.title}</span>
                    <span className="text-[10px] text-slate-400 block">{frequencyLabels[r.frequency]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {r.amount.toFixed(2)} {currency}
                    </span>
                    <button
                      onClick={() => {
                        setVampireModalOpen(false);
                        openEdit(r);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded-lg text-slate-300 cursor-pointer"
                    >
                      Modificar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setVampireModalOpen(false)}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-purple-600/30"
            >
              Entendido, volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
