import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  PieChart,
  Check,
  X,
  Shield,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  Coins,
  Home,
  Zap,
  ShoppingCart,
  Car,
  ShieldCheck,
  Smartphone,
  Utensils,
  PiggyBank,
  FileText,
  Briefcase,
  HeartPulse,
  Coffee,
  Fuel,
  Info,
  AlertTriangle,
  Target,
  LineChart,
  Landmark,
  Gem,
  Bot,
  Gamepad2,
  Package,
  Trophy,
  Crown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  GripVertical,
  Wallet,
  Scale,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePrivacy } from '../../context/PrivacyContext';
import { Bucket, Expense, RecurringRule, Settings } from '../../types';
import { DBService } from '../../services/db';
import { HapticService } from '../../services/hapticService';
import { useTouchSortable } from '../../hooks/useTouchSortable';
import { CoverOverspendingModal } from './CoverOverspendingModal';
import { BucketMovementsModal } from './BucketMovementsModal';
import { BudgetCapacityService } from '../../services/budgetCapacityService';
import { IncomeAllocationService } from '../../services/incomeAllocationService';

interface BucketsViewProps {
  buckets: Bucket[];
  expenses: Expense[];
  currency: string;
  settings?: Settings;
  recurringRules?: RecurringRule[];
  onSaveBucket: (bucket: Bucket) => void;
  onDeleteBucket: (id: string) => void;
  onDeleteExpense?: (id: string) => void;
  onReconcileExpenses?: (bankExpenseId: string, recurringExpenseId: string) => void;
  onRefresh: () => void;
  onOpenSmartRules?: () => void;
  onOpenGoals?: () => void;
}

import { MASTER_ICON_MAP, MASTER_ICON_KEYS } from '../../constants/icons';

// Mapa de iconos dinámicos Lucide (56 disponibles)
const ICON_MAP: Record<string, React.ElementType> = MASTER_ICON_MAP;

export type BucketSortMode =
  | 'manual'
  | 'alpha_asc'
  | 'alpha_desc'
  | 'limit_desc'
  | 'limit_asc'
  | 'spent_desc';

export const BucketsView: React.FC<BucketsViewProps> = ({
  buckets,
  expenses,
  currency,
  settings,
  recurringRules = [],
  onSaveBucket,
  onDeleteBucket,
  onDeleteExpense,
  onReconcileExpenses,
  onRefresh,
  onOpenSmartRules,
  onOpenGoals,
}) => {
  const { isPrivate } = usePrivacy();
  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [vasosModalOpen, setVasoModalOpen] = useState(false);
  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);
  const [coverOverspendingOpen, setCoverOverspendingOpen] = useState(false);
  const [movementsBucket, setMovementsBucket] = useState<Bucket | null>(null);

  // Ordenación de Bolsas
  const [sortMode, setSortMode] = useState<BucketSortMode>(() => {
    return (localStorage.getItem('cronocash_buckets_sort_mode') as BucketSortMode) || 'manual';
  });

  const handleSortChange = (newMode: BucketSortMode) => {
    setSortMode(newMode);
    localStorage.setItem('cronocash_buckets_sort_mode', newMode);
    HapticService.selection();
  };

  // Navegación mensual y modo de visualización
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'annual'>('month');

  // Formulario Bolsa
  const [name, setName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('PieChart');
  const [isBuffer, setIsBuffer] = useState(false);
  const [rolloverSurplus, setRolloverSurplus] = useState(false);
  const [accumulatedSurplus, setAccumulatedSurplus] = useState('0');
  const [notes, setNotes] = useState('');

  // Vasos Comunicantes Form
  const [vasoFrom, setVasoFrom] = useState('');
  const [vasoTo, setVasoTo] = useState('');
  const [vasoAmount, setVasoAmount] = useState('25');

  // Filtro de bolsa seleccionada para ver detalles
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);

  const selectedMonthPrefix = format(selectedDate, 'yyyy-MM');
  const selectedYear = selectedDate.getFullYear();
  const selectedYearPrefix = String(selectedYear);
  const isCurrentMonth = selectedMonthPrefix === new Date().toISOString().substring(0, 7);

  // Métricas de Capacidad Presupuestaria (Ingresos vs Límites de Bolsas)
  const currentMonthDate = new Date();
  const currentMonthKey = format(currentMonthDate, 'yyyy-MM');
  const nextMonthDate = addMonths(new Date(), 1);
  const nextMonthKey = format(nextMonthDate, 'yyyy-MM');
  const isSelectedNextMonth = selectedMonthPrefix === nextMonthKey;

  const effectiveSettings = settings || DBService.getSettings();
  const capacityMetrics = BudgetCapacityService.calculateCapacity(
    buckets,
    effectiveSettings,
    selectedMonthPrefix,
    format(selectedDate, 'MMMM yyyy', { locale: es })
  );

  const currentExpenses = expenses.filter((e) => (e.date || '').startsWith(selectedMonthPrefix));
  const yearExpenses = expenses.filter((e) => (e.date || '').startsWith(selectedYearPrefix));
  const activeExpenses = viewMode === 'annual' ? yearExpenses : currentExpenses;

  const handlePrevMonth = () => {
    setSelectedDate((prev) => subMonths(prev, 1));
    HapticService.selection();
  };
  const handleNextMonth = () => {
    setSelectedDate((prev) => addMonths(prev, 1));
    HapticService.selection();
  };
  const handleCurrentMonth = () => {
    setSelectedDate(new Date());
    HapticService.selection();
  };

  // Abrir modal de creación
  const openAdd = () => {
    setEditingBucket(null);
    setName('');
    setBudgetLimit('300');
    setColor('#10b981');
    setIcon('ShoppingCart');
    setIsBuffer(false);
    setRolloverSurplus(false);
    setAccumulatedSurplus('0');
    setNotes('');
    setModalOpen(true);
  };

  // Abrir modal de edición
  const openEdit = (b: Bucket) => {
    setEditingBucket(b);
    setName(b.name);
    setBudgetLimit(String(b.budgetLimit));
    setColor(b.color);
    setIcon(b.icon || 'PieChart');
    setIsBuffer(b.isBuffer);
    setRolloverSurplus(b.rolloverSurplus || false);
    setAccumulatedSurplus(String(b.accumulatedSurplus || 0));
    setNotes(b.notes || '');
    setModalOpen(true);
  };

  // Guardar bolsa
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      alert('Introduce un límite de presupuesto válido.');
      return;
    }

    const parsedAccumulated = parseFloat(accumulatedSurplus.replace(',', '.'));

    const bucket: Bucket = {
      id: editingBucket?.id || `bucket_${Date.now()}`,
      name: name.trim() || 'Nueva Bolsa',
      budgetLimit: limit,
      color,
      icon,
      isBuffer,
      rolloverSurplus,
      accumulatedSurplus: rolloverSurplus ? (isNaN(parsedAccumulated) ? 0 : parsedAccumulated) : undefined,
      notes: notes.trim() || undefined,
      order: editingBucket?.order,
      createdAt: editingBucket?.createdAt || new Date().toISOString(),
    };

    onSaveBucket(bucket);
    setModalOpen(false);
  };

  // Aplicar Smart Seeds (8 bolsas maestras)
  const handleSmartSeeds = async () => {
    const confirmSeed = window.confirm(
      '¿Cargar las 8 Bolsas Maestras preconfiguradas (Vivienda, Suministros, Supermercado, Movilidad, Seguros, Telecomunicaciones, Ocio y Colchón de Ahorro)?'
    );
    if (!confirmSeed) return;

    try {
      await DBService.applyMasterSeeds('append');
      await HapticService.impactMedium();
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error al aplicar la plantilla de bolsas.');
    }
  };

  // Ejecutar Vasos Comunicantes
  const handleExecuteVasos = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(vasoAmount.replace(',', '.'));
    if (isNaN(amt) || amt <= 0) {
      alert('Por favor introduce un importe válido a trasvasar.');
      return;
    }
    if (!vasoFrom || !vasoTo || vasoFrom === vasoTo) {
      alert('Debes seleccionar dos bolsas distintas para el trasvase.');
      return;
    }

    try {
      await DBService.transferBucketBalance(vasoFrom, vasoTo, amt);
      await HapticService.notificationSuccess();
      setVasoModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar el trasvase.');
    }
  };

  // Ejecutar Rollover de Ahorro
  const handleExecuteRollover = async () => {
    try {
      const result = await DBService.executeMonthlyRollover(selectedMonthPrefix);
      await HapticService.notificationSuccess();
      setRolloverModalOpen(false);
      onRefresh();
      alert(
        `¡Rollover Completado! Se han derivado ${result.surplusTotal.toFixed(2)} ${currency} de excedente de ${
          result.bucketCount
        } bolsas a "${result.transferredTo}".`
      );
    } catch (err: any) {
      alert(err.message || 'No se pudo completar el rollover.');
    }
  };

  // Paleta de colores (9 base + 7 distintivos prémium)
  const palette = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ef4444', // red
    '#14b8a6', // teal
    '#f97316', // orange
    // 7 nuevos colores distintivos
    '#6366f1', // indigo
    '#a855f7', // violet
    '#84cc16', // lime
    '#eab308', // gold
    '#d946ef', // fuchsia
    '#14532d', // forest
    '#0284c7', // sky
  ];

  // Iconos disponibles (Catálogo Maestro Unificado de 56 iconos)
  const availableIcons = MASTER_ICON_KEYS;

  // Totales mensuales con inyecciones y reembolsos
  const totalInjectedMonthly = viewMode === 'month' ? IncomeAllocationService.getAllBudgetInjectionsForMonth(selectedMonthPrefix, effectiveSettings) : 0;
  const totalRefundsMonthly = viewMode === 'month' ? IncomeAllocationService.getAllRefundsForMonth(selectedMonthPrefix, effectiveSettings) : 0;

  const totalBudgetMonthly = buckets.reduce(
    (sum, b) => sum + b.budgetLimit + (b.rolloverSurplus ? (b.accumulatedSurplus || 0) : 0),
    0
  ) + totalInjectedMonthly;
  const totalSpentMonthlyGross = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSpentMonthly = Math.max(0, totalSpentMonthlyGross - totalRefundsMonthly);
  const monthlyPct = totalBudgetMonthly > 0 ? Math.min(Math.round((totalSpentMonthly / totalBudgetMonthly) * 100), 100) : 0;

  // Totales anuales (Proyección Anual)
  const totalBudgetAnnual = buckets.reduce((sum, b) => sum + b.budgetLimit * 12, 0);
  const totalSpentAnnual = yearExpenses.reduce((sum, e) => sum + e.amount, 0);
  const annualPct = totalBudgetAnnual > 0 ? Math.min(Math.round((totalSpentAnnual / totalBudgetAnnual) * 100), 100) : 0;
  const annualRemaining = totalBudgetAnnual - totalSpentAnnual;

  // Totales activos según viewMode
  const totalBudget = viewMode === 'annual' ? totalBudgetAnnual : totalBudgetMonthly;
  const totalSpent = viewMode === 'annual' ? totalSpentAnnual : totalSpentMonthly;
  const globalPct = viewMode === 'annual' ? annualPct : monthlyPct;

  // Cálculo del excedente potencial para rollover (excluyendo colchón y bolsas con sinking fund propio)
  const potentialSurplus = buckets
    .filter((b) => !b.isBuffer && !b.rolloverSurplus)
    .reduce((sum, b) => {
      const bInjected = IncomeAllocationService.getBucketInjectedBudget(b.id, selectedMonthPrefix, effectiveSettings);
      const bRefunds = IncomeAllocationService.getBucketRefunds(b.id, selectedMonthPrefix, effectiveSettings);
      const spent = Math.max(
        0,
        currentExpenses
          .filter((e) => e.bucketId === b.id)
          .reduce((s, e) => s + e.amount, 0) - bRefunds
      );
      const effectiveLimit = b.budgetLimit + bInjected;
      const rem = effectiveLimit - spent;
      return rem > 0 ? sum + rem : sum;
    }, 0);

  // Detección de sobregiros para el Asistente Inteligente Cover Overspending
  const overspentBuckets = buckets.filter((b) => {
    const bInjected = IncomeAllocationService.getBucketInjectedBudget(b.id, selectedMonthPrefix, effectiveSettings);
    const bRefunds = IncomeAllocationService.getBucketRefunds(b.id, selectedMonthPrefix, effectiveSettings);
    const effectiveLimit = b.budgetLimit + (b.rolloverSurplus ? (b.accumulatedSurplus || 0) : 0) + bInjected;
    const spent = Math.max(
      0,
      currentExpenses
        .filter((e) => e.bucketId === b.id)
        .reduce((s, e) => s + e.amount, 0) - bRefunds
    );
    return spent > effectiveLimit;
  });

  const totalOverspending = overspentBuckets.reduce((acc, b) => {
    const bInjected = IncomeAllocationService.getBucketInjectedBudget(b.id, selectedMonthPrefix, effectiveSettings);
    const bRefunds = IncomeAllocationService.getBucketRefunds(b.id, selectedMonthPrefix, effectiveSettings);
    const effectiveLimit = b.budgetLimit + (b.rolloverSurplus ? (b.accumulatedSurplus || 0) : 0) + bInjected;
    const spent = Math.max(
      0,
      currentExpenses
        .filter((e) => e.bucketId === b.id)
        .reduce((s, e) => s + e.amount, 0) - bRefunds
    );
    return acc + (spent - effectiveLimit);
  }, 0);

  // Ordenación calculada de las bolsas según el criterio elegido
  const sortedBuckets = [...buckets].sort((a, b) => {
    if (sortMode === 'alpha_asc') {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    }
    if (sortMode === 'alpha_desc') {
      return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
    }
    if (sortMode === 'limit_desc') {
      return b.budgetLimit - a.budgetLimit;
    }
    if (sortMode === 'limit_asc') {
      return a.budgetLimit - b.budgetLimit;
    }
    if (sortMode === 'spent_desc') {
      const bRefundsA = viewMode === 'month' ? IncomeAllocationService.getBucketRefunds(a.id, selectedMonthPrefix, effectiveSettings) : 0;
      const bRefundsB = viewMode === 'month' ? IncomeAllocationService.getBucketRefunds(b.id, selectedMonthPrefix, effectiveSettings) : 0;
      const spentA = Math.max(
        0,
        activeExpenses
          .filter((e) => e.bucketId === a.id)
          .reduce((sum, e) => sum + e.amount, 0) - bRefundsA
      );
      const spentB = Math.max(
        0,
        activeExpenses
          .filter((e) => e.bucketId === b.id)
          .reduce((sum, e) => sum + e.amount, 0) - bRefundsB
      );
      return spentB - spentA;
    }
    // 'manual' (respeta b.order, si no existe toma posición previa)
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const handleMoveBucket = async (bucketId: string, direction: 'up' | 'down') => {
    const index = sortedBuckets.findIndex((b) => b.id === bucketId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedBuckets.length) return;

    const reordered = [...sortedBuckets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const withOrders = reordered.map((b, i) => ({
      ...b,
      order: i + 1,
    }));
    await DBService.updateBucketsOrder(withOrders);
    await HapticService.impactLight();
    onRefresh();
  };

  const handleReorderBuckets = async (newBuckets: Bucket[]) => {
    const withOrders = newBuckets.map((b, i) => ({
      ...b,
      order: i + 1,
    }));
    await DBService.updateBucketsOrder(withOrders);
    onRefresh();
  };

  const { dragIndex, overIndex, getHandleProps, getItemProps } = useTouchSortable({
    items: sortedBuckets,
    onReorder: handleReorderBuckets,
    enabled: sortMode === 'manual' && !modalOpen && !vasosModalOpen && !rolloverModalOpen,
  });

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Bolsas de Presupuesto</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envelopes elásticos con vasos comunicantes y protección de ahorro
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSmartSeeds}
            title="Cargar 8 Bolsas Maestras (Smart Seeds)"
            className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Smart Seeds</span>
          </button>

          {onOpenSmartRules && (
            <button
              type="button"
              onClick={onOpenSmartRules}
              className="px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Gestionar reglas automáticas de asignación de extractos bancarios"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>Reglas Inteligentes</span>
            </button>
          )}

          {onOpenGoals && (
            <button
              type="button"
              onClick={onOpenGoals}
              className="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Metas de Ahorro y Sinking Funds"
            >
              <Target className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>Metas & Sinking Funds</span>
            </button>
          )}

          <button
            onClick={() => {
              if (buckets.length < 2) {
                alert('Necesitas al menos 2 bolsas para realizar trasvases.');
                return;
              }
              setVasoFrom(buckets[0]?.id || '');
              setVasoTo(buckets[1]?.id || '');
              setVasoModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-600/30 dark:hover:bg-cyan-600/50 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-300" />
            <span>Vasos Comunicantes</span>
          </button>

          <button
            onClick={openAdd}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Bolsa</span>
          </button>
        </div>
      </div>

      {/* Banner Asistente Cover Overspending si hay déficit */}
      {overspentBuckets.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-50 dark:from-rose-500/20 via-white dark:via-slate-900 to-rose-50/60 dark:to-rose-500/10 border border-rose-300 dark:border-rose-500/40 flex items-center justify-between gap-3 shadow-xl shadow-rose-950/5 dark:shadow-rose-950/30 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40 shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <span>{overspentBuckets.length} {overspentBuckets.length === 1 ? 'bolsa en sobregiro' : 'bolsas en sobregiro'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-500/40">
                  +{isPrivate ? '••••' : totalOverspending.toFixed(2)} {currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Reequilibra tus vasos comunicantes automáticamente con 1 solo toque guiado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCoverOverspendingOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Equilibrar</span>
          </button>
        </div>
      )}

      {/* Selector de Mes Navegable y Conmutador de Proyección Anual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
        {/* Controles de Navegación Mensual */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-slate-900 dark:text-white px-2 capitalize flex items-center gap-1.5 min-w-[130px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{format(selectedDate, 'MMMM yyyy', { locale: es })}</span>
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isCurrentMonth && (
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-all cursor-pointer ml-1"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Toggle [ Mes | Proyección Anual ] */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setViewMode('month');
              HapticService.selection();
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('annual');
              HapticService.selection();
            }}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'annual'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Proyección Anual</span>
          </button>
        </div>
      </div>

      {/* Tarjeta de Capacidad y Asignación de Presupuesto (Ingresos Estimados vs Bolsas) */}
      <div
        className={`p-4 rounded-3xl border shadow-xl transition-all duration-300 space-y-3.5 ${
          capacityMetrics.status === 'exceeded'
            ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 shadow-rose-950/5 dark:shadow-rose-950/20'
            : capacityMetrics.status === 'balanced'
            ? 'bg-teal-50/90 dark:bg-teal-950/20 border-teal-300 dark:border-teal-500/40 shadow-teal-950/5 dark:shadow-teal-950/20'
            : 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 shadow-emerald-950/5 dark:shadow-emerald-950/20'
        }`}
      >
        {/* Cabecera del Widget de Capacidad */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-2xl border ${
                capacityMetrics.status === 'exceeded'
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                  : capacityMetrics.status === 'balanced'
                  ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30'
                  : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
              }`}
            >
              {capacityMetrics.status === 'exceeded' ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : capacityMetrics.status === 'balanced' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Balance de Presupuesto Real
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full capitalize font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 inline-flex items-center justify-center text-center">
                  {capacityMetrics.monthName}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Capacidad de asignación sobre ingresos estimados
              </p>
            </div>
          </div>

          {/* Selector Rápido Mes en curso / Mes siguiente */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(currentMonthDate);
                HapticService.selection();
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                selectedMonthPrefix === currentMonthKey
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mes en curso
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate(nextMonthDate);
                HapticService.selection();
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                isSelectedNextMonth
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mes siguiente
            </button>
          </div>
        </div>

        {/* Resumen Métrico de Capacidad: Ingresos vs Bolsas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. Ingresos Estimados */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Ingresos Estimados
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white">
                {isPrivate ? '••••' : capacityMetrics.totalIncome.toFixed(2)} {currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Salario: {isPrivate ? '••••' : capacityMetrics.baseSalary.toFixed(0)}€ • Extras: {isPrivate ? '••••' : (capacityMetrics.punctualExtraIncome + capacityMetrics.recurringExtraIncome).toFixed(0)}€
            </p>
          </div>

          {/* 2. Total Asignado a Bolsas */}
          <div className="p-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Límite Total en Bolsas
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white">
                {isPrivate ? '••••' : capacityMetrics.totalBucketsBudget.toFixed(2)} {currency}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                ({buckets.length} sobres)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Compromiso mensual presupuestado
            </p>
          </div>

          {/* 3. Margen Libre o Excedente */}
          <div
            className={`p-2.5 rounded-2xl border shadow-xs ${
              capacityMetrics.status === 'exceeded'
                ? 'bg-rose-100/70 dark:bg-rose-900/30 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                : capacityMetrics.status === 'balanced'
                ? 'bg-teal-100/70 dark:bg-teal-900/30 border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-200'
                : 'bg-emerald-100/70 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
              {capacityMetrics.status === 'exceeded'
                ? 'Sobre-presupuestado'
                : capacityMetrics.status === 'balanced'
                ? 'Balance a Cero'
                : 'Margen Libre / Sin Asignar'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-mono font-black">
                {capacityMetrics.status === 'exceeded' ? '+' : ''}
                {isPrivate ? '••••' : Math.abs(capacityMetrics.difference).toFixed(2)} {currency}
              </span>
              <span className="text-[10px] font-bold opacity-80">
                ({capacityMetrics.percentageAllocated}% asignado)
              </span>
            </div>
            <p className="text-[10px] opacity-80 truncate mt-0.5">
              {capacityMetrics.status === 'exceeded'
                ? 'Excede los ingresos'
                : capacityMetrics.status === 'balanced'
                ? '100% de ingresos asignados'
                : 'Disponible para bolsas/ahorro'}
            </p>
          </div>
        </div>

        {/* Barra Visual de Asignación Presupuestaria */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              {capacityMetrics.status === 'exceeded' && (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              )}
              <span>
                {capacityMetrics.status === 'exceeded'
                  ? 'Las bolsas superan los ingresos disponibles:'
                  : 'Asignación de ingresos a bolsas:'}
              </span>
            </span>
            <span
              className={`font-mono ${
                capacityMetrics.status === 'exceeded'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {capacityMetrics.percentageAllocated}% de los ingresos
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                capacityMetrics.status === 'exceeded'
                  ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                  : capacityMetrics.status === 'balanced'
                  ? 'bg-teal-500 shadow-md shadow-teal-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(capacityMetrics.percentageAllocated, 100)}%` }}
            />
          </div>

          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 italic">
            {capacityMetrics.status === 'exceeded' ? (
              <>
                <strong className="text-rose-700 dark:text-rose-300 not-italic">Atención:</strong> Tus bolsas superan tus ingresos estimados en{' '}
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{isPrivate ? '••••' : Math.abs(capacityMetrics.difference).toFixed(2)} {currency}</span>. Para que tu presupuesto no se desborde, reduce los límites de tus bolsas o aumenta tus ingresos.
              </>
            ) : capacityMetrics.status === 'balanced' ? (
              <>
                <strong className="text-teal-700 dark:text-teal-300 not-italic">Equilibrio perfecto:</strong> Cada euro de tus ingresos estimados (
                <span className="font-mono font-bold">{isPrivate ? '••••' : capacityMetrics.totalIncome.toFixed(2)} {currency}</span>) tiene una bolsa asignada sin incurrir en déficit.
              </>
            ) : (
              <>
                <strong className="text-emerald-700 dark:text-emerald-300 not-italic">Presupuesto holgado:</strong> Te quedan{' '}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{isPrivate ? '••••' : capacityMetrics.difference.toFixed(2)} {currency}</span> libres para asignar a bolsas o transferir a tus Metas y Colchón de Ahorro.
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tarjeta de Resumen Global de Bolsas & Banner de Rollover */}
      <div className="p-4 rounded-3xl bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {viewMode === 'annual'
                ? `Proyección Anual Ejercicio ${selectedYear} (${buckets.length} Bolsas)`
                : `Presupuesto Mensual Activo (${buckets.length} Bolsas)`}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {isPrivate ? '••••' : totalSpent.toFixed(2)} / {isPrivate ? '••••' : totalBudget.toFixed(2)} {currency}
          </span>
        </div>

        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-transparent rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              globalPct > 100
                ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                : globalPct > 80
                ? 'bg-amber-400'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${Math.min(globalPct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500 dark:text-slate-400">
            {viewMode === 'annual' ? 'Consumo anual acumulado: ' : 'Consumo total: '}
            <strong className="text-slate-900 dark:text-white">{globalPct}%</strong>
            {viewMode === 'annual' && (
              <span className="ml-2 text-slate-500 dark:text-slate-400">
                (Margen restante: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{isPrivate ? '••••' : annualRemaining.toFixed(2)} {currency}</span>)
              </span>
            )}
          </span>

          {viewMode === 'month' && isCurrentMonth && potentialSurplus > 0 && (
            <button
              onClick={() => setRolloverModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <TrendingUp className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Rollover Ahorro: +{isPrivate ? '••••' : potentialSurplus.toFixed(2)} {currency}</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Ordenación de Bolsas */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-bold">Ordenar por:</span>
        </div>
        <select
          value={sortMode}
          onChange={(e) => handleSortChange(e.target.value as BucketSortMode)}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
        >
          <option value="manual">Manual (Personalizado)</option>
          <option value="alpha_asc">Nombre (A - Z)</option>
          <option value="alpha_desc">Nombre (Z - A)</option>
          <option value="limit_desc">Techo (Mayor a menor)</option>
          <option value="limit_asc">Techo (Menor a mayor)</option>
          <option value="spent_desc">Mayor consumo mensual</option>
        </select>
      </div>

      {/* Grid de Bolsas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedBuckets.map((b, index) => {
          const IconComp = ICON_MAP[b.icon] || PieChart;
          const accumulated = b.rolloverSurplus ? (b.accumulatedSurplus || 0) : 0;
          const injected = viewMode === 'month' ? IncomeAllocationService.getBucketInjectedBudget(b.id, selectedMonthPrefix, effectiveSettings) : 0;
          const refunds = viewMode === 'month' ? IncomeAllocationService.getBucketRefunds(b.id, selectedMonthPrefix, effectiveSettings) : 0;
          const limit = viewMode === 'annual' ? (b.budgetLimit * 12) : (b.budgetLimit + accumulated + injected);
          const grossSpent = activeExpenses
            .filter((e) => e.bucketId === b.id)
            .reduce((sum, e) => sum + e.amount, 0);
          const spent = Math.max(0, grossSpent - refunds);
          const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
          const isOver = spent > limit;
          const remaining = limit - spent;
          const isWarning = pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              {...getItemProps(index)}
              className={`rounded-3xl border flex items-stretch transition-all duration-300 ease-out overflow-hidden ${
                dragIndex === index
                  ? 'ring-2 ring-emerald-500 scale-[1.03] -translate-y-1 shadow-2xl shadow-emerald-500/25 z-30 bg-slate-100 dark:bg-slate-800/95 border-emerald-500 opacity-95'
                  : overIndex === index && dragIndex !== null
                  ? 'scale-[0.97] translate-y-1 opacity-40 bg-slate-200 dark:bg-slate-950/90 border-dashed border-2 border-emerald-500/50 shadow-inner ring-1 ring-emerald-500/20 z-10'
                  : b.isBuffer
                  ? 'border-teal-300 dark:border-teal-500/40 bg-teal-50/70 dark:bg-teal-950/10 shadow-sm scale-100 translate-y-0 opacity-100'
                  : isOver
                  ? 'border-rose-300 dark:border-rose-500/60 bg-rose-50/70 dark:bg-rose-950/10 shadow-sm scale-100 translate-y-0 opacity-100'
                  : isWarning
                  ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50/70 dark:bg-amber-950/10 shadow-sm scale-100 translate-y-0 opacity-100'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900/90 shadow-sm scale-100 translate-y-0 opacity-100'
              }`}
            >
              {/* Pestaña lateral de arrastre táctil (visible en modo manual) */}
              {sortMode === 'manual' && (
                <div
                  {...getHandleProps(index)}
                  className="w-7 sm:w-8 flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 hover:bg-emerald-50 dark:hover:bg-emerald-600/20 active:bg-emerald-100 dark:active:bg-emerald-600/40 border-r border-slate-200 dark:border-slate-800/80 cursor-grab active:cursor-grabbing text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 active:text-emerald-700 dark:active:text-emerald-300 transition-colors shrink-0 select-none group"
                  title="Mantén pulsado y arrastra para reordenar esta bolsa"
                  aria-label="Arrastrar para mover bolsa"
                >
                  <GripVertical className="w-4 h-4 transition-transform group-active:scale-110" />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                <div className="flex items-start justify-between">
                <div
                  className="flex items-center space-x-3 cursor-pointer group min-w-0 flex-1"
                  onClick={() => setMovementsBucket(b)}
                  title="Ver desglose de movimientos (gastos y reembolsos)"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md shrink-0 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: b.color }}
                  >
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      <span className="truncate">{b.name}</span>
                      {b.rolloverSurplus && viewMode === 'month' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-500/40 flex items-center gap-1">
                          <PiggyBank className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>Hucha +{isPrivate ? '••••' : accumulated.toFixed(2)} {currency}</span>
                        </span>
                      )}
                      {injected > 0 && viewMode === 'month' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/40 flex items-center gap-1" title="Ingresos asignados para ampliar esta bolsa este mes">
                          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Extra +{isPrivate ? '••••' : injected.toFixed(2)} {currency}</span>
                        </span>
                      )}
                      {refunds > 0 && viewMode === 'month' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-500/40 flex items-center gap-1" title="Gastos minorados por reembolsos o devoluciones recibidas">
                          <ArrowRightLeft className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>Reembolso -{isPrivate ? '••••' : refunds.toFixed(2)} {currency}</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {b.notes || 'Partida presupuestaria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {sortMode === 'manual' && (
                    <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700/60 mr-1">
                      <button
                        onClick={() => handleMoveBucket(b.id, 'up')}
                        disabled={index === 0}
                        title="Subir posición de la bolsa"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveBucket(b.id, 'down')}
                        disabled={index === sortedBuckets.length - 1}
                        title="Bajar posición de la bolsa"
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 disabled:opacity-20 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setMovementsBucket(b)}
                    title="Ver movimientos de esta bolsa (Gastos y Reembolsos)"
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ReceiptText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setVasoTo(b.id);
                      const other = buckets.find((item) => item.id !== b.id);
                      if (other) setVasoFrom(other.id);
                      setVasoModalOpen(true);
                    }}
                    title="Compensar con otra bolsa (Vasos Comunicantes)"
                    className="p-1.5 text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-200 rounded-lg hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(b)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar bolsa "${b.name}"?`)) {
                        onDeleteBucket(b.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Números y Barra de Progreso */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {viewMode === 'annual' ? 'Consumido en el año' : refunds > 0 ? 'Consumido neto' : 'Consumido este mes'}
                  </span>
                  <div className="text-sm font-mono font-bold whitespace-nowrap shrink-0">
                    <span className={isOver ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-white'}>
                      {isPrivate ? '••••' : spent.toFixed(2)}&nbsp;{currency}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs"> / {isPrivate ? '••••' : limit.toFixed(2)}&nbsp;{currency}</span>
                  </div>
                </div>
                {refunds > 0 && viewMode === 'month' && (
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-300 font-mono flex items-center justify-between">
                    <span>Compensación por reembolso</span>
                    <span>-{isPrivate ? '••••' : refunds.toFixed(2)} {currency} (Bruto: {isPrivate ? '••••' : grossSpent.toFixed(2)}€)</span>
                  </div>
                )}

                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-transparent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? '#f43f5e' : isWarning ? '#f59e0b' : b.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">{pct}% del techo {viewMode === 'annual' ? 'anual' : 'mensual'}</span>
                  <span
                    className={`font-semibold ${
                      isOver
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : isWarning
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isOver ? (
                      <span className="flex items-center gap-1 whitespace-nowrap">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Exceso: {isPrivate ? '••••' : (spent - limit).toFixed(2)}&nbsp;{currency}</span>
                      </span>
                    ) : (
                      <span className="whitespace-nowrap">
                        {viewMode === 'annual' ? 'Margen anual: ' : 'Disponible: '}
                        {isPrivate ? '••••' : remaining.toFixed(2)}&nbsp;{currency}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {/* MODAL 1: Crear / Editar Bolsa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-3xl w-full max-w-md max-h-[92vh] text-slate-900 dark:text-white shadow-2xl flex flex-col overflow-hidden">
            {/* Cabecera fija que NUNCA desaparece ni se bloquea al hacer scroll */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xs">
              <div className="flex items-center space-x-3">
                {(() => {
                  const CurrentHeaderIcon = ICON_MAP[icon] || PieChart;
                  return (
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs shrink-0 transition-all"
                      style={{
                        backgroundColor: `${color}20`,
                        borderColor: `${color}50`,
                        color: color,
                      }}
                    >
                      <CurrentHeaderIcon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingBucket ? 'Editar Bolsa de Presupuesto' : 'Nueva Bolsa de Presupuesto'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Límite mensual, icono y color con fondo adaptativo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 overscroll-contain">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Nombre de la Bolsa *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Transporte, Ocio, Suministros..."
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Límite Mensual ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="300"
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />

                {/* Simulador de Capacidad en Tiempo Real */}
                {(() => {
                  const parsedInputLimit = parseFloat(budgetLimit.replace(',', '.')) || 0;
                  const otherBucketsTotal = buckets
                    .filter((item) => item.id !== editingBucket?.id)
                    .reduce((sum, item) => sum + item.budgetLimit, 0);
                  const simulatedBucketsTotal = otherBucketsTotal + parsedInputLimit;
                  const simulatedDiff = capacityMetrics.totalIncome - simulatedBucketsTotal;
                  const simulatedPct =
                    capacityMetrics.totalIncome > 0
                      ? Math.round((simulatedBucketsTotal / capacityMetrics.totalIncome) * 100)
                      : 0;
                  const isSimulatedExceeded = simulatedDiff < -0.005;
                  const isSimulatedBalanced = Math.abs(simulatedDiff) <= 0.005;

                  return (
                    <div
                      className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                        isSimulatedExceeded
                          ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                          : isSimulatedBalanced
                          ? 'bg-teal-50/90 dark:bg-teal-950/20 border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-200'
                          : 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          {isSimulatedExceeded ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                          ) : isSimulatedBalanced ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                          ) : (
                            <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          <span>Impacto en Presupuesto ({capacityMetrics.monthName}):</span>
                        </span>
                        <span className="font-mono">
                          {simulatedPct}% asignado
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Total en bolsas pasará a{' '}
                        <strong className="font-mono font-bold">
                          {isPrivate ? '••••' : simulatedBucketsTotal.toFixed(2)} {currency}
                        </strong>{' '}
                        de{' '}
                        <span className="font-mono">
                          {isPrivate ? '••••' : capacityMetrics.totalIncome.toFixed(2)} {currency}
                        </span>{' '}
                        de ingresos.{' '}
                        {isSimulatedExceeded ? (
                          <span className="font-bold text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>Superarás tus ingresos en {isPrivate ? '••••' : Math.abs(simulatedDiff).toFixed(2)} {currency}.</span>
                          </span>
                        ) : isSimulatedBalanced ? (
                          <span className="font-bold text-teal-700 dark:text-teal-300 inline-flex items-center gap-1">
                            <Target className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                            <span>Presupuesto perfectamente equilibrado a cero.</span>
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span>Quedarán {isPrivate ? '••••' : simulatedDiff.toFixed(2)} {currency} libres sin asignar.</span>
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Selector de Icono Lucide */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Icono Representativo ({availableIcons.length} disponibles)
                  </label>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Activo:</span>
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center border text-xs shadow-xs"
                      style={{
                        backgroundColor: `${color}20`,
                        borderColor: `${color}50`,
                        color: color,
                      }}
                    >
                      {(() => {
                        const SelectedComp = ICON_MAP[icon] || PieChart;
                        return <SelectedComp className="w-3.5 h-3.5" />;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 pt-1 max-h-36 overflow-y-auto pr-1 p-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  {availableIcons.map((ic) => {
                    const Comp = ICON_MAP[ic] || PieChart;
                    const isSelected = icon === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'scale-110 font-bold shadow-md'
                            : 'bg-white dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: `${color}25`,
                                borderColor: `${color}80`,
                                borderWidth: '1.5px',
                                color: color,
                              }
                            : undefined
                        }
                        title={ic}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Color */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Color Distintivo</label>
                <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
                  {palette.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setColor(p)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        color === p ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: p }}
                    />
                  ))}
                </div>
              </div>

              {/* Checkbox Colchón Buffer */}
              <div
                onClick={() => setIsBuffer(!isBuffer)}
                className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/30 flex items-center space-x-3 cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                    isBuffer
                      ? 'bg-teal-500 border-teal-500 text-slate-950'
                      : 'border-teal-400/50'
                  }`}
                >
                  {isBuffer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-800 dark:text-teal-200">
                    Es Bolsa de Imprevistos / Colchón de Ahorro
                  </div>
                  <div className="text-[10px] text-teal-700/80 dark:text-teal-300/80">
                    Recibe automáticamente el rollover de ahorro mensual de las demás bolsas
                  </div>
                </div>
              </div>

              {/* Opción Sinking Fund / Trasvase de Remanente al Siguiente Mes */}
              <div className="space-y-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30">
                <div
                  onClick={() => setRolloverSurplus(!rolloverSurplus)}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      rolloverSurplus
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-indigo-400/50'
                    }`}
                  >
                    {rolloverSurplus && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-1.5">
                      <PiggyBank className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Trasvasar remanente al siguiente mes (Sinking Fund)</span>
                    </div>
                    <div className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80">
                      Ideal para seguros o gastos periódicos. El saldo no consumido se acumula en esta bolsa mes a mes.
                    </div>
                  </div>
                </div>

                {rolloverSurplus && (
                  <div className="pt-2 pl-8 border-t border-indigo-200 dark:border-indigo-500/20">
                    <label className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 block mb-1">
                      Remanente acumulado actual ({currency})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={accumulatedSurplus}
                      onChange={(e) => setAccumulatedSurplus(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/40 rounded-xl text-xs font-mono font-bold text-indigo-700 dark:text-indigo-300 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Descripción / Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Qué gastos cubre esta partida..."
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Guardar Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Vasos Comunicantes (Trasvase Elástico de Límites) */}
      {vasosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-cyan-300 dark:border-cyan-500/50 rounded-3xl w-full max-w-md max-h-[92vh] text-slate-900 dark:text-white shadow-2xl flex flex-col overflow-hidden">
            {/* Cabecera fija que NUNCA desaparece */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Vasos Comunicantes (Compensación)</span>
              </h3>
              <button
                type="button"
                onClick={() => setVasoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 overscroll-contain">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Reequilibra tus bolsas elásticamente: transfiere límite de presupuesto desde una bolsa con
                remanente hacia una que esté en tensión o déficit.
              </p>

              <form onSubmit={handleExecuteVasos} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">1. Bolsa Origen (Cede Saldo)</label>
                  <select
                    value={vasoFrom}
                    onChange={(e) => setVasoFrom(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.id === vasoTo}>
                        {b.name} (Límite: {b.budgetLimit.toFixed(2)} {currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center -my-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
                    ↓
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">2. Bolsa Destino (Recibe Fondos)</label>
                  <select
                    value={vasoTo}
                    onChange={(e) => setVasoTo(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  >
                    {buckets.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.id === vasoFrom}>
                        {b.name} (Límite: {b.budgetLimit.toFixed(2)} {currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Importe a Trasvasar ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={vasoAmount}
                    onChange={(e) => setVasoAmount(e.target.value)}
                    className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-cyan-300 dark:border-cyan-500/50 rounded-xl text-sm font-mono font-bold text-cyan-600 dark:text-cyan-300"
                  />

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {[10, 25, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setVasoAmount(String(val))}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        +{val} {currency}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVasoModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-cyan-500/20 active:scale-95"
                  >
                    Confirmar Trasvase
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rollover de Ahorro Mensual */}
      {rolloverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0f172a] border border-teal-300 dark:border-teal-500/50 rounded-3xl w-full max-w-md p-5 text-slate-900 dark:text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span>Cierre de Mes y Rollover de Ahorro</span>
              </h3>
              <button
                onClick={() => setRolloverModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/30 text-center space-y-1">
                <span className="text-xs text-teal-700 dark:text-teal-300 uppercase tracking-wider font-bold">
                  Excedente No Gastado Identificado
                </span>
                <div className="text-3xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  +{potentialSurplus.toFixed(2)} {currency}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Suma de presupuestos sobrantes de las bolsas activas
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Al ejecutar el <strong>Rollover</strong>, este superávit se añade automáticamente a tu{' '}
                <strong>Colchón de Ahorro e Imprevistos</strong>, premiando tu disciplina financiera sin
                perder el rastro del dinero.
              </p>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRolloverModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteRollover}
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Añadir al Ahorro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* MODAL 5: Asistente Cover Overspending */}
      {coverOverspendingOpen && (
        <CoverOverspendingModal
          isOpen={coverOverspendingOpen}
          onClose={() => setCoverOverspendingOpen(false)}
          buckets={buckets}
          expenses={expenses}
          currency={currency}
          settings={effectiveSettings}
          selectedMonthPrefix={selectedMonthPrefix}
          onRefresh={onRefresh}
        />
      )}

      {/* MODAL 6: Desglose Integral de Movimientos por Bolsa */}
      {movementsBucket && (
        <BucketMovementsModal
          isOpen={!!movementsBucket}
          onClose={() => setMovementsBucket(null)}
          bucket={movementsBucket}
          monthPrefix={selectedMonthPrefix}
          monthLabel={format(selectedDate, 'MMMM yyyy', { locale: es })}
          expenses={expenses}
          settings={effectiveSettings}
          currency={currency}
          recurringRules={recurringRules}
          onDeleteExpense={onDeleteExpense}
          onReconcileExpenses={onReconcileExpenses}
        />
      )}
    </div>
  );
};
