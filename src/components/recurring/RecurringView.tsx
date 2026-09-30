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
  PowerOff,
  Hand,
  Info,
  CreditCard,
  Scale,
  CheckSquare,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Coins,
  LineChart,
  Gem,
  Bot,
  Gamepad2,
  Package,
  Trophy,
  Crown,
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  BookOpen,
  Wifi,
  Tv,
  Building2,
  Key,
  Pill,
  Eye,
  Fuel,
  Bus,
  Train,
  Scissors,
  Dumbbell,
  FileCheck,
  Tag,
  GripVertical,
} from 'lucide-react';
import { RecurringRule, Bucket, Expense, RecurringCostType, ReminderOffset, RecurringCategoryType, FunctionalCategory, DEFAULT_FUNCTIONAL_CATEGORIES } from '../../types';
import { DBService } from '../../services/db';
import { HapticService } from '../../services/hapticService';
import { useTouchSortable } from '../../hooks/useTouchSortable';
import { FunctionalCategoriesModal, LUCIDE_CATEGORY_ICONS } from './FunctionalCategoriesModal';

interface RecurringViewProps {
  rules: RecurringRule[];
  expenses?: Expense[];
  buckets: Bucket[];
  currency: string;
  onSaveRule: (rule: RecurringRule) => void;
  onDeleteRule: (id: string) => void;
  onApplyRuleNow: (rule: RecurringRule) => void;
  onRequestConfirmRecurring?: (rule: RecurringRule, targetDate?: string) => void;
  onRefresh?: () => void;
}

import { MASTER_ICON_MAP, MASTER_ICON_KEYS } from '../../constants/icons';

// Iconos disponibles para recurrentes (Catálogo Maestro Unificado de 51 iconos 100% Lucide React)
const RECURRING_ICON_MAP: Record<string, React.ElementType> = MASTER_ICON_MAP;

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

export type RecurringSortMode =
  | 'imminent'
  | 'manual'
  | 'category'
  | 'category_alpha'
  | 'alpha_asc'
  | 'alpha_desc'
  | 'amount_desc'
  | 'amount_asc';

const CATEGORY_NAMES: Record<RecurringCategoryType, string> = {
  financial_future: 'Futuro Financiero (Inversiones)',
  bill: 'Recibos y Facturas',
  subscription: 'Suscripciones',
  insurance: 'Seguros y Pólizas',
  education: 'Educación y Formación',
  transport: 'Transporte y Movilidad',
  tax: 'Impuestos y Tasas',
  health: 'Salud y Cuidado',
  maintenance: 'Mantenimiento',
  leisure: 'Ocio y Recreación',
  donation: 'Donaciones y Solidaridad',
  personal: 'Personal y Familia',
};

const CATEGORY_HIERARCHY: Record<RecurringCategoryType, number> = {
  financial_future: 1,
  bill: 2,
  insurance: 3,
  subscription: 4,
  tax: 5,
  transport: 6,
  education: 7,
  health: 8,
  maintenance: 9,
  leisure: 10,
  donation: 11,
  personal: 12,
};

export const RecurringView: React.FC<RecurringViewProps> = ({
  rules,
  expenses = [],
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
  const [statusFilter, setStatusFilter] = useState<'active' | 'ceased' | 'all'>('active');
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  // Categorías Funcionales Dinámicas
  const [categories, setCategories] = useState<FunctionalCategory[]>(() => {
    return DBService.getFunctionalCategories();
  });

  const handleRefreshCategories = () => {
    const updated = DBService.getFunctionalCategories();
    setCategories(updated);
    if (onRefresh) onRefresh();
  };

  const getCategoryById = (id?: string): FunctionalCategory => {
    if (!id) {
      return categories[0] || DEFAULT_FUNCTIONAL_CATEGORIES[0];
    }
    const found = categories.find((c) => c.id === id);
    if (found) return found;
    // Fallback defensivo ante IDs desconocidos
    return {
      id,
      name: id === 'bill' ? 'Recibo' : id === 'subscription' ? 'Suscripción' : id,
      icon: 'Tag',
      color: '#3b82f6',
      isSystem: false,
    };
  };

  // Ordenación de Cargos Recurrentes
  const [sortMode, setSortMode] = useState<RecurringSortMode>(() => {
    return (localStorage.getItem('cronocash_recurring_sort_mode') as RecurringSortMode) || 'imminent';
  });

  const handleSortChange = (newMode: RecurringSortMode) => {
    setSortMode(newMode);
    localStorage.setItem('cronocash_recurring_sort_mode', newMode);
    HapticService.selection();
  };

  // Formulario
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [costType, setCostType] = useState<RecurringCostType>('fixed');
  const [categoryType, setCategoryType] = useState<string>('bill');
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
  const [intervalNum, setIntervalNum] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [autoCreateExpense, setAutoCreateExpense] = useState(true);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        setDayOfMonth(String(day));
      }
      if (!isNaN(month) && month >= 1 && month <= 12) {
        setMonthOfYear(String(month));
      }
    }
  };

  // Cálculo de fecha del próximo cobro y días restantes
  const getNextBillingDetails = (rule: RecurringRule) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const targetDay = Math.min(Math.max(1, rule.dayOfMonth || 1), 28);
    const interval = rule.interval && rule.interval > 1 ? rule.interval : 1;

    let nextDate = new Date(currentYear, currentMonth, targetDay);

    if (rule.frequency === 'monthly') {
      if (interval > 1 && rule.startDate) {
        const startObj = new Date(rule.startDate);
        const startM = startObj.getMonth();
        const startY = startObj.getFullYear();
        for (let offset = 0; offset <= 36; offset++) {
          const checkYear = currentYear + Math.floor((currentMonth + offset) / 12);
          const checkMonth = (currentMonth + offset) % 12;
          const totalMonths = (checkYear - startY) * 12 + (checkMonth - startM);
          if (totalMonths >= 0 && totalMonths % interval === 0) {
            const candidate = new Date(checkYear, checkMonth, targetDay);
            if (candidate.getTime() > today.getTime()) {
              nextDate = candidate;
              break;
            }
          }
        }
      } else {
        if (today.getDate() > targetDay) {
          nextDate = new Date(currentYear, currentMonth + 1, targetDay);
        }
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
      const targetDayOfWeek = rule.dayOfWeek ?? (rule.startDate ? new Date(rule.startDate).getDay() : 1);
      const dayDiff = (targetDayOfWeek - today.getDay() + 7) % 7;
      let candidate = new Date(today);
      candidate.setDate(today.getDate() + (dayDiff === 0 && today.getHours() > 18 ? 7 : dayDiff));
      if (interval > 1 && rule.startDate) {
        const startObj = new Date(rule.startDate);
        for (let i = 0; i < 52; i++) {
          const weeks = Math.round((candidate.getTime() - startObj.getTime()) / (7 * 24 * 3600 * 1000));
          if (weeks >= 0 && weeks % interval === 0 && candidate.getTime() > today.getTime()) {
            nextDate = candidate;
            break;
          }
          candidate = new Date(candidate.getTime() + 7 * 24 * 3600 * 1000);
        }
      } else {
        nextDate = candidate;
      }
    }

    // Si la fecha de inicio del compromiso es futura, el próximo cobro no puede ser anterior a startDate
    if (rule.startDate) {
      const startObj = new Date(rule.startDate.split('T')[0] + 'T00:00:00');
      if (nextDate.getTime() < startObj.getTime()) {
        if (rule.frequency === 'monthly') {
          const sYear = startObj.getFullYear();
          const sMonth = startObj.getMonth();
          let cand = new Date(sYear, sMonth, targetDay);
          if (cand.getTime() < startObj.getTime()) {
            cand = new Date(sYear, sMonth + 1, targetDay);
          }
          nextDate = cand;
        } else {
          nextDate = startObj;
        }
      }
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

    return {
      nextDate,
      nextDateStr,
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
    setIntervalNum(1);
    setStartDate(new Date().toISOString().split('T')[0]);
    setDayOfMonth('1');
    setMonthOfYear('1');
    setIcon('Repeat');
    setIsVampire(false);
    setNotes('');
    setReminderOffsets(['3_days', 'same_day']);
    setReminderTime('09:00');
    setAutoAdaptNextDates(true);
    setAutoCreateExpense(true);
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
    setIntervalNum(r.interval && r.interval > 1 ? r.interval : 1);
    setStartDate(r.startDate ? r.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDayOfMonth(String(r.dayOfMonth || 1));
    setMonthOfYear(String(r.monthOfYear || (r.startDate ? new Date(r.startDate).getMonth() + 1 : 1)));
    setIcon(r.icon || 'Repeat');
    setIsVampire(!!r.isVampire);
    setNotes(r.notes || '');
    setReminderOffsets(r.reminderOffsets && r.reminderOffsets.length > 0 ? r.reminderOffsets : ['3_days', 'same_day']);
    setReminderTime(r.reminderTime || '09:00');
    setAutoAdaptNextDates(r.autoAdaptNextDates ?? true);
    setAutoCreateExpense(r.autoCreateExpense ?? true);
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
      interval: (frequency === 'weekly' || frequency === 'monthly') && intervalNum > 1 ? intervalNum : 1,
      dayOfMonth: parseInt(dayOfMonth) || 1,
      monthOfYear: frequency === 'yearly' ? (parseInt(monthOfYear) || 1) : undefined,
      startDate: startDate || (editingRule?.startDate ? editingRule.startDate.split('T')[0] : new Date().toISOString().split('T')[0]),
      isActive: editingRule ? editingRule.isActive : true,
      autoCreateExpense: costType !== 'none' ? autoCreateExpense : false,
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

  // Conteos por estado
  const activeRulesCount = rules.filter((r) => r.isActive !== false).length;
  const ceasedRulesCount = rules.filter((r) => r.isActive === false).length;

  // Filtrado según pestaña de estado (Activas, Cesadas, Todas)
  const filteredByStatus = rules.filter((r) => {
    if (statusFilter === 'active') return r.isActive !== false;
    if (statusFilter === 'ceased') return r.isActive === false;
    return true;
  });

  const displayedRules = (filterVampireOnly
    ? filteredByStatus.filter((r) => r.isVampire)
    : filteredByStatus
  ).sort((a, b) => {
    // Si una regla está inactiva y la otra activa, las inactivas se agrupan al final
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }

    if (sortMode === 'manual') {
      return (a.order ?? 0) - (b.order ?? 0);
    }

    if (sortMode === 'category') {
      const catA = getCategoryById(a.categoryType);
      const catB = getCategoryById(b.categoryType);
      const orderDiff = (catA.order ?? 99) - (catB.order ?? 99);
      if (orderDiff !== 0) return orderDiff;
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    }

    if (sortMode === 'category_alpha') {
      const nameA = getCategoryById(a.categoryType).name;
      const nameB = getCategoryById(b.categoryType).name;
      const catComp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      if (catComp !== 0) return catComp;
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    }

    if (sortMode === 'alpha_asc') {
      return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
    }

    if (sortMode === 'alpha_desc') {
      return b.title.localeCompare(a.title, 'es', { sensitivity: 'base' });
    }

    if (sortMode === 'amount_desc') {
      return b.amount - a.amount;
    }

    if (sortMode === 'amount_asc') {
      return a.amount - b.amount;
    }

    // sortMode === 'imminent' (por defecto)
    if (a.isActive && b.isActive) {
      const aDetails = getNextBillingDetails(a);
      const bDetails = getNextBillingDetails(b);
      return aDetails.daysLeft - bDetails.daysLeft;
    }
    return (b.endDate || b.startDate || '').localeCompare(a.endDate || a.startDate || '');
  });

  const handleMoveRule = async (ruleId: string, direction: 'up' | 'down') => {
    const index = displayedRules.findIndex((r) => r.id === ruleId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= displayedRules.length) return;

    const reordered = [...displayedRules];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const withOrders = reordered.map((r, i) => ({
      ...r,
      order: i + 1,
    }));
    await DBService.updateRecurringRulesOrder(withOrders);
    await HapticService.impactLight();
    onRefresh?.();
  };

  const handleReorderRules = async (newRules: RecurringRule[]) => {
    const withOrders = newRules.map((r, i) => ({
      ...r,
      order: i + 1,
    }));
    await DBService.updateRecurringRulesOrder(withOrders);
    onRefresh?.();
  };

  const { dragIndex, overIndex, getHandleProps, getItemProps } = useTouchSortable({
    items: displayedRules,
    onReorder: handleReorderRules,
    enabled: sortMode === 'manual' && !modalOpen && !categoriesModalOpen,
  });

  // Regla más inminente entre las activas
  const activeSorted = rules
    .filter((r) => r.isActive !== false)
    .sort((a, b) => getNextBillingDetails(a).daysLeft - getNextBillingDetails(b).daysLeft);
  const nextImminentRule = activeSorted[0];
  const nextImminentDetails = nextImminentRule ? getNextBillingDetails(nextImminentRule) : null;

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Facturas, Tareas y Recurrentes</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Avisos escalonados, costes estimados y desplazamiento adaptativo de ciclos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {vampireRules.length > 0 && (
            <button
              onClick={() => setVampireModalOpen(true)}
              className="px-2.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Auditoría de Gastos Vampiro"
            >
              <Flame className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Gastos Vampiro ({vampireRules.length})</span>
            </button>
          )}

          <button
            onClick={handleSmartSeeds}
            title="Cargar Facturas Maestras"
            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Smart Seeds</span>
          </button>

          <button
            type="button"
            onClick={() => setCategoriesModalOpen(true)}
            title="Gestionar Categorías Funcionales (Crear, Editar, Eliminar y Reordenar)"
            className="px-2.5 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Tag className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Categorías</span>
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
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Comprometido / Mes</span>
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {totalMonthlyCommitment.toFixed(2)} {currency}
            </div>
            <span className="text-[11px] text-slate-500">
              Proyección anual: ~{totalYearlyCommitment.toFixed(0)} {currency}
            </span>
          </div>
        </div>

        {/* Tarjeta 2: Cobro Más Cercano */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Próximo Hito</span>
          </span>
          {nextImminentRule && nextImminentDetails ? (
            <div className="mt-2">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center justify-between">
                <span>{nextImminentRule.title}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {nextImminentRule.costType === 'none'
                    ? 'Sin coste'
                    : nextImminentRule.costType === 'estimated'
                    ? `~${nextImminentRule.amount.toFixed(2)} ${currency}`
                    : `${nextImminentRule.amount.toFixed(2)} ${currency}`}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                {nextImminentDetails.daysLeft === 0 ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
                    <span className="text-rose-600 dark:text-rose-400 font-bold">¡Toca HOY!</span>
                  </>
                ) : nextImminentDetails.daysLeft === 1 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Toca MAÑANA</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300 shrink-0" />
                    <span>Toca en {nextImminentDetails.daysLeft} días ({nextImminentDetails.formattedDate})</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">Sin vencimientos activos</div>
          )}
        </div>

        {/* Tarjeta 3: Detección Vampiro */}
        <div className="p-4 rounded-3xl bg-purple-50/60 dark:bg-gradient-to-br dark:from-purple-950/30 dark:to-slate-900 border border-purple-200 dark:border-purple-500/30 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Coste Vampiro / Mes</span>
          </span>
          <div className="mt-2">
            <div className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">
              {vampireMonthlyTotal.toFixed(2)} {currency}
            </div>
            <button
              onClick={() => setVampireModalOpen(true)}
              className="text-[11px] text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 underline font-semibold mt-0.5 cursor-pointer"
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
          {/* Selector de Pestañas: Activas / Cesadas / Todas */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Activas ({activeRulesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ceased')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ceased'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cesadas / Históricas ({ceasedRulesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas ({rules.length})
              </button>
            </div>

            {/* Selector de Ordenación de Recurrentes */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-950/70 p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs shadow-xs">
              <span className="text-slate-500 dark:text-slate-400 pl-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span className="hidden sm:inline font-medium">Ordenar:</span>
              </span>
              <select
                value={sortMode}
                onChange={(e) => handleSortChange(e.target.value as RecurringSortMode)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-1 rounded-xl outline-none cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Criterio de ordenación"
              >
                <option value="imminent" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Próximo cobro (Inminente)</option>
                <option value="manual" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Orden manual</option>
                <option value="category" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Por categoría (Jerárquico)</option>
                <option value="category_alpha" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Por categoría (A-Z)</option>
                <option value="alpha_asc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Título (A-Z)</option>
                <option value="alpha_desc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Título (Z-A)</option>
                <option value="amount_desc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Mayor importe</option>
                <option value="amount_asc" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">Menor importe</option>
              </select>
            </div>
            {ceasedRulesCount > 0 && statusFilter === 'ceased' && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Compromisos finalizados. Los gastos pasados siguen intactos en el historial.
              </span>
            )}
          </div>

          {displayedRules.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl text-xs text-slate-500">
              {statusFilter === 'ceased'
                ? 'No tienes ningún compromiso recurrente cesado.'
                : 'No hay recurrentes en esta categoría.'}
            </div>
          ) : (
            displayedRules.map((rule, idx) => {
            const bucket = buckets.find((b) => b.id === rule.bucketId);
            const { daysLeft, formattedDate, nextDateStr } = getNextBillingDetails(rule);
            const IconComp = RECURRING_ICON_MAP[rule.icon || ''] || Repeat;

            const isPureTask = rule.costType === 'none' || (!rule.amount && rule.costType !== 'estimated');
            const isEstimated = rule.costType === 'estimated';
            const todayStr = new Date().toISOString().split('T')[0];
            const isCompletedForTargetDate =
              (rule.completedDates || []).includes(nextDateStr) ||
              (rule.completedDates || []).includes(todayStr) ||
              rule.lastGeneratedDate === nextDateStr ||
              expenses.some(
                (e) =>
                  (e.recurringRuleId === rule.id ||
                    (e.title.toLowerCase() === rule.title.toLowerCase() && e.bucketId === rule.bucketId)) &&
                  (e.date === nextDateStr || e.date === todayStr)
              );

            const isUnpaidManual =
              !isPureTask &&
              rule.autoCreateExpense === false &&
              !isCompletedForTargetDate &&
              daysLeft <= 0;

            // Semáforo de cuenta atrás
            let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            let badgeText = `En ${daysLeft} días (${formattedDate})`;

            if (isCompletedForTargetDate) {
              badgeColor = 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40';
              badgeText = `Completada (${formattedDate})`;
            } else if (isUnpaidManual) {
              badgeColor = 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 animate-pulse';
              badgeText = `No pagado (${formattedDate})`;
            } else if (daysLeft === 0) {
              badgeColor = 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 animate-pulse';
              badgeText = `¡Toca HOY! (${formattedDate})`;
            } else if (daysLeft === 1) {
              badgeColor = 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40';
              badgeText = `¡Mañana! (${formattedDate})`;
            } else if (daysLeft <= 3) {
              badgeColor = 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30';
              badgeText = `En ${daysLeft} días (${formattedDate})`;
            }

            const catObj = getCategoryById(rule.categoryType);
            const CategoryIcon = LUCIDE_CATEGORY_ICONS[catObj.icon] || CreditCard;
            const categoryLabel = catObj.name;

            return (
              <div
                key={rule.id}
                {...getItemProps(idx)}
                className={`rounded-3xl border flex items-stretch transition-all duration-300 ease-out overflow-hidden ${
                  dragIndex === idx
                    ? 'ring-2 ring-blue-500 scale-[1.03] -translate-y-1 shadow-2xl shadow-blue-500/25 z-30 bg-slate-100 dark:bg-slate-800/95 border-blue-500 opacity-95'
                    : overIndex === idx && dragIndex !== null
                    ? 'scale-[0.97] translate-y-1 opacity-40 bg-slate-200 dark:bg-slate-950/90 border-dashed border-2 border-blue-500/50 shadow-inner ring-1 ring-blue-500/20 z-10'
                    : !rule.isActive
                    ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-75 scale-100 translate-y-0'
                    : isCompletedForTargetDate
                    ? 'bg-white dark:bg-slate-900/90 border-emerald-200 dark:border-emerald-500/30 shadow-sm scale-100 translate-y-0 opacity-100'
                    : isUnpaidManual
                    ? 'border-rose-300 dark:border-rose-500/50 shadow-sm bg-rose-50/50 dark:bg-rose-950/10 scale-100 translate-y-0 opacity-100'
                    : daysLeft <= 1
                    ? 'bg-white dark:bg-slate-900/90 border-amber-300 dark:border-amber-500/40 shadow-sm scale-100 translate-y-0 opacity-100'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm scale-100 translate-y-0 opacity-100'
                }`}
              >
                {/* Pestaña lateral de arrastre táctil (visible en modo manual) */}
                {sortMode === 'manual' && (
                  <div
                    {...getHandleProps(idx)}
                    className="w-7 sm:w-8 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 hover:bg-blue-50 dark:hover:bg-blue-600/20 active:bg-blue-100 dark:active:bg-blue-600/40 border-r border-slate-200 dark:border-slate-800/80 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 active:text-blue-700 dark:active:text-blue-300 transition-colors shrink-0 select-none group"
                    title="Mantén pulsado y arrastra para reordenar este recurrente"
                    aria-label="Arrastrar para mover recurrente"
                  >
                    <GripVertical className="w-4 h-4 transition-transform group-active:scale-110" />
                  </div>
                )}

                <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
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
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{rule.title}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center gap-1"
                        style={{
                          backgroundColor: `${catObj.color || '#3b82f6'}15`,
                          borderColor: `${catObj.color || '#3b82f6'}40`,
                          color: catObj.color || '#93c5fd',
                        }}
                      >
                        <CategoryIcon className="w-3 h-3" />
                        <span>{categoryLabel}</span>
                      </span>
                      {!rule.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <PowerOff className="w-3 h-3 text-slate-400" />
                          <span>Cesada</span>
                        </span>
                      )}
                      {rule.isActive && !isPureTask && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          {rule.autoCreateExpense !== false ? (
                            <>
                              <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              <span>Auto</span>
                            </>
                          ) : (
                            <>
                              <Hand className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                              <span>Manual</span>
                            </>
                          )}
                        </span>
                      )}
                      {isEstimated && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                          Estimado
                        </span>
                      )}
                      {isPureTask && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30">
                          Tarea
                        </span>
                      )}
                      {rule.isVampire && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/30 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Vampiro
                        </span>
                      )}
                      {rule.isActive && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${badgeColor}`}>
                          {isCompletedForTargetDate && <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 shrink-0" />}
                          {isUnpaidManual && <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />}
                          {daysLeft === 0 && !isCompletedForTargetDate && !isUnpaidManual && <Clock className="w-3 h-3 text-rose-500 dark:text-rose-400 shrink-0" />}
                          <span>{badgeText}</span>
                        </span>
                      )}
                      {rule.startDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700/80">
                          Inicio: {rule.startDate.slice(0, 10).split('-').reverse().join('/')}
                        </span>
                      )}
                      {rule.endDate && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700/80">
                          Cesada: {rule.endDate.slice(0, 10).split('-').reverse().join('/')}
                        </span>
                      )}
                      {rule.isActive && rule.startDate && rule.startDate.slice(0, 10) > new Date().toISOString().slice(0, 10) && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
                          Programada
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2 mt-1">
                      <span className="font-semibold" style={{ color: isPureTask ? '#c084fc' : bucket?.color }}>
                        {isPureTask ? 'Recordatorio' : bucket?.name || 'General'}
                      </span>
                      <span>•</span>
                      <span>
                        {rule.interval && rule.interval > 1
                          ? `Cada ${rule.interval} ${rule.frequency === 'weekly' ? 'semanas' : 'meses'}`
                          : frequencyLabels[rule.frequency]} (
                        {rule.frequency === 'yearly' && rule.monthOfYear
                          ? `${rule.dayOfMonth || 1} de ${MONTH_NAMES[(rule.monthOfYear || 1) - 1]}`
                          : `Día ${rule.dayOfMonth || 1}`}
                        )
                      </span>
                      {rule.reminderOffsets && rule.reminderOffsets.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                            <Bell className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>{rule.reminderOffsets.length} alertas ({rule.reminderTime || '09:00'})</span>
                          </span>
                        </>
                      )}
                      {rule.notes &&
                        !rule.notes.toLowerCase().startsWith(rule.title.toLowerCase().slice(0, 5)) &&
                        !rule.title.toLowerCase().startsWith(rule.notes.toLowerCase().slice(0, 5)) && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px] text-slate-400 dark:text-slate-500">{rule.notes}</span>
                          </>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80">
                  {sortMode === 'manual' && (
                    <div className="flex items-center gap-0.5 mr-1 bg-slate-100 dark:bg-slate-950/60 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleMoveRule(rule.id, 'up')}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-lg transition-all ${
                          idx === 0
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 cursor-pointer active:scale-95'
                        }`}
                        title="Subir de posición"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveRule(rule.id, 'down')}
                        disabled={idx === displayedRules.length - 1}
                        className={`p-1.5 rounded-lg transition-all ${
                          idx === displayedRules.length - 1
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 cursor-pointer active:scale-95'
                        }`}
                        title="Bajar de posición"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="text-left sm:text-right mr-2">
                    <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {isPureTask ? (
                        <span className="text-purple-600 dark:text-purple-300 text-xs font-semibold">Sin coste</span>
                      ) : isEstimated ? (
                        <span className="text-amber-600 dark:text-amber-300">~{rule.amount.toFixed(2)} {currency}</span>
                      ) : (
                        `${rule.amount.toFixed(2)} ${currency}`
                      )}
                    </div>
                  </div>

                  {/* Botón Confirmar / Registrar / Completada / Reactivar */}
                  {!rule.isActive ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`¿Reactivar la recurrencia "${rule.title}"? Se reanudarán los cobros periódicos a partir de hoy.`)) {
                          await HapticService.impactMedium();
                          const todayStr = new Date().toISOString().split('T')[0];
                          onSaveRule({
                            ...rule,
                            isActive: true,
                            startDate: todayStr,
                            endDate: undefined,
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      title="Reactivar recurrencia"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Reactivar</span>
                    </button>
                  ) : isCompletedForTargetDate ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isPureTask ? 'Completada' : 'Registrado'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        if (onRequestConfirmRecurring) {
                          onRequestConfirmRecurring(rule, nextDateStr);
                        } else {
                          onApplyRuleNow(rule);
                          await HapticService.notificationSuccess();
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                        isUnpaidManual
                          ? 'bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40'
                          : 'bg-emerald-50 dark:bg-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40'
                      }`}
                      title={isPureTask ? 'Completar tarea y avanzar ciclo' : 'Confirmar o ajustar importe del gasto'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {isPureTask ? 'Completar Tarea' : isUnpaidManual ? 'Pagar Ahora' : isEstimated ? 'Confirmar / Ajustar' : 'Registrar Pago'}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => openEdit(rule)}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {rule.isActive !== false && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`¿Cesar la recurrencia "${rule.title}"?\n\nNo se generarán cobros futuros ni restará saldo en el calendario, pero todos los gastos pasados registrados en tu historial permanecerán intactos.`)) {
                          await HapticService.impactMedium();
                          const todayStr = new Date().toISOString().split('T')[0];
                          onSaveRule({
                            ...rule,
                            isActive: false,
                            endDate: todayStr,
                          });
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Cesar recurrencia (preservando historial)"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar definitivamente "${rule.title}"?`)) {
                        onDeleteRule(rule.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
          }))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR RECURRENTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Repeat className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>{editingRule ? 'Editar Acto Recurrente' : 'Nuevo Acto Recurrente'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Selector de Tipo de Coste */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Tipo de Compromiso / Coste *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCostType('fixed')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      costType === 'fixed'
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>Gasto Fijo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostType('estimated')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      costType === 'estimated'
                        ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>Estimado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostType('none')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      costType === 'none'
                        ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Tarea / Salud</span>
                  </button>
                </div>
              </div>

              {/* Categoría Funcional */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Categoría Funcional *</label>
                  <button
                    type="button"
                    onClick={() => setCategoriesModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Crear, editar o eliminar categorías"
                  >
                    <Tag className="w-3 h-3" />
                    <span>Gestionar Categorías</span>
                  </button>
                </div>
                <select
                  value={categoryType}
                  onChange={(e: any) => setCategoryType(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Concepto */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Concepto / Nombre del Acto *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Cambio lentillas, Vacuna perro, Seguro coche..."
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Importe y Frecuencia */}
              <div className="grid grid-cols-2 gap-3">
                {costType !== 'none' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">
                      {costType === 'estimated' ? 'Coste Estimado' : 'Importe Fijo'} ({currency}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="45.00"
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                    />
                    {editingRule && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>Modificar este importe solo afectará a los cobros futuros. El historial y gastos pasados se conservan intactos.</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Coste Económico</label>
                    <div className="h-11 px-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center text-purple-700 dark:text-purple-300 font-semibold">
                      Sin coste directo (0.00 {currency})
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Frecuencia *</label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full h-11 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              {/* Modalidad de Contabilización: Automático vs Manual */}
              {costType !== 'none' && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Modalidad de Cobro</span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      {autoCreateExpense ? (
                        <>
                          <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          <span>Cobro Automático</span>
                        </>
                      ) : (
                        <>
                          <Hand className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          <span>Procesamiento Manual</span>
                        </>
                      )}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAutoCreateExpense(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        autoCreateExpense
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>Automático</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Se contabiliza al llegar la fecha sin requerir acción manual. Puedes revertirlo o ajustarlo.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoCreateExpense(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        !autoCreateExpense
                          ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-slate-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Hand className="w-3.5 h-3.5 shrink-0" />
                        <span>Manual</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Tú confirmas el cobro. Si pasa la fecha sin cobrar, se alertará como "No pagado".
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Selector de intervalo dinámico para Semanal o Mensual */}
              {(frequency === 'weekly' || frequency === 'monthly') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cadencia de Repetición
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {frequency === 'weekly'
                        ? intervalNum === 1
                          ? 'Repetición cada semana'
                          : `Repetición cada ${intervalNum} semanas (quincenal, etc.)`
                        : intervalNum === 1
                          ? 'Repetición cada mes'
                          : `Repetición cada ${intervalNum} meses (bimestral, etc.)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cada</span>
                    <input
                      type="number"
                      min="1"
                      max={frequency === 'weekly' ? 52 : 24}
                      value={intervalNum}
                      onChange={(e) => setIntervalNum(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-10 px-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-center text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {frequency === 'weekly'
                        ? (intervalNum === 1 ? 'semana' : 'semanas')
                        : (intervalNum === 1 ? 'mes' : 'meses')}
                    </span>
                  </div>
                </div>
              )}

              {/* Fecha de Inicio / Origen del Compromiso */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>Fecha de Inicio / Origen del Compromiso *</span>
                  </label>
                  {startDate && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      {startDate > new Date().toISOString().slice(0, 10) ? (
                        <>
                          <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                          <span>Inicio Futuro</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                          <span>En Vigor</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Día real en que comenzó o comenzará este compromiso. Los ciclos periódicos e intervalos se computan anclados a esta fecha.
                </p>
              </div>

              {/* Si es anual: Selector de Mes */}
              {frequency === 'yearly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Mes del Año *</label>
                    <select
                      value={monthOfYear}
                      onChange={(e) => setMonthOfYear(e.target.value)}
                      className="w-full h-11 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i + 1} value={i + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Día del Mes (1-31) *</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Si no es anual: Día del mes y Bolsa */}
              {frequency !== 'yearly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Día de Cobro/Hito (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Bolsa Asignada</label>
                    <select
                      value={bucketId}
                      onChange={(e) => setBucketId(e.target.value)}
                      className="w-full h-11 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-hidden"
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
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Avisar con Antelación (Escalonado):</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Hora:</span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-white"
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
                            ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-400 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {off.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                  Se programarán notificaciones de alta prioridad para cada plazo marcado.
                </span>
              </div>

              {/* Toggle de Adaptabilidad de Ciclos Futuros */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdaptNextDates}
                  onChange={(e) => setAutoAdaptNextDates(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 bg-white dark:bg-slate-900 cursor-pointer"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  <b>Adaptabilidad dinámica</b>: Si realizas esta tarea o pago un día antes o después, reprogramar automáticamente los meses siguientes a esa nueva fecha.
                </span>
              </label>

              {/* Selector de Icono Lucide */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400">
                  Icono Identificativo ({MASTER_ICON_KEYS.length} disponibles)
                </label>
                <div className="flex items-center gap-2 pt-1 flex-wrap max-h-40 overflow-y-auto pr-1">
                  {MASTER_ICON_KEYS.map((ic) => {
                    const Comp = RECURRING_ICON_MAP[ic] || Repeat;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          icon === ic
                            ? 'bg-emerald-500 text-slate-950 font-bold scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={ic}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox Gasto Vampiro si no es tarea pura */}
              {costType !== 'none' && (
                <div
                  onClick={() => setIsVampire(!isVampire)}
                  className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/30 flex items-center space-x-3 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                      isVampire
                        ? 'bg-purple-600 dark:bg-purple-500 border-purple-600 dark:border-purple-500 text-white dark:text-slate-950'
                        : 'border-purple-300 dark:border-purple-400/50'
                    }`}
                  >
                    {isVampire && <Flame className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                      Marcar como Gasto Vampiro / Suscripción Prescindible
                    </div>
                    <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                      Se incluirá en el panel de auditoría para liberar ahorro mensual
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-400">Observaciones / Referencia</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Contrato renovación, graduación lentillas..."
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-500/40 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Auditoría de Gastos Vampiro</h3>
                  <p className="text-[11px] text-purple-600 dark:text-purple-300">
                    Suscripciones y micro-servicios que drenan tu capacidad de ahorro
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVampireModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-purple-800 dark:text-purple-200 uppercase font-bold">Fuga Mensual Detectada</span>
                <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {vampireMonthlyTotal.toFixed(2)} {currency}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-purple-800 dark:text-purple-200 uppercase font-bold">Ahorro Anual Potencial</span>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {(vampireMonthlyTotal * 12).toFixed(2)} {currency}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Servicios Auditados ({vampireRules.length}):</span>
              {vampireRules.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{frequencyLabels[r.frequency]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-300">
                      {r.amount.toFixed(2)} {currency}
                    </span>
                    <button
                      onClick={() => {
                        setVampireModalOpen(false);
                        openEdit(r);
                      }}
                      className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 cursor-pointer"
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

      {/* Modal de Gestión Dinámica de Categorías Funcionales (CRUD Completo) */}
      <FunctionalCategoriesModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        rules={rules}
        onCategoriesChanged={handleRefreshCategories}
      />
    </div>
  );
};
