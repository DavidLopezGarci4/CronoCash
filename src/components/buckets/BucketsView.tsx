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
  Download,
  Image as ImageIcon,
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
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Bucket, Expense } from '../../types';
import { DBService } from '../../services/db';
import { CoverOverspendingModal } from './CoverOverspendingModal';

interface BucketsViewProps {
  buckets: Bucket[];
  expenses: Expense[];
  currency: string;
  onSaveBucket: (bucket: Bucket) => void;
  onDeleteBucket: (id: string) => void;
  onRefresh: () => void;
}

// Mapa de iconos dinámicos Lucide
const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Zap,
  ShoppingCart,
  Car,
  Fuel,
  ShieldCheck,
  Smartphone,
  Utensils,
  PiggyBank,
  FileText,
  PieChart,
  Briefcase,
  HeartPulse,
  Coffee,
};

export const BucketsView: React.FC<BucketsViewProps> = ({
  buckets,
  expenses,
  currency,
  onSaveBucket,
  onDeleteBucket,
  onRefresh,
}) => {
  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBucket, setEditingBucket] = useState<Bucket | null>(null);
  const [vasosModalOpen, setVasoModalOpen] = useState(false);
  const [rolloverModalOpen, setRolloverModalOpen] = useState(false);
  const [verticonsModalOpen, setVerticonsModalOpen] = useState(false);
  const [coverOverspendingOpen, setCoverOverspendingOpen] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const handleDownloadImage = async (imagePath: string, fileName: string, title: string) => {
    setDownloadingFile(fileName);
    try {
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error('No se pudo obtener el archivo de imagen.');
      const blob = await response.blob();

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.split(',')[1] || res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const fileResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title,
          text: `Icono CronoCash: ${fileName}`,
          url: fileResult.uri,
          dialogTitle: `Guardar o compartir ${fileName}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err) {
      console.error('Error al descargar o compartir icono:', err);
      alert('No se pudo guardar la imagen en el dispositivo.');
    } finally {
      setDownloadingFile(null);
    }
  };

  // Formulario Bolsa
  const [name, setName] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('PieChart');
  const [isBuffer, setIsBuffer] = useState(false);
  const [notes, setNotes] = useState('');

  // Vasos Comunicantes Form
  const [vasoFrom, setVasoFrom] = useState('');
  const [vasoTo, setVasoTo] = useState('');
  const [vasoAmount, setVasoAmount] = useState('25');

  // Filtro de bolsa seleccionada para ver detalles
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentExpenses = expenses.filter((e) => (e.date || '').startsWith(currentMonthPrefix));

  // Abrir modal de creación
  const openAdd = () => {
    setEditingBucket(null);
    setName('');
    setBudgetLimit('300');
    setColor('#10b981');
    setIcon('ShoppingCart');
    setIsBuffer(false);
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

    const bucket: Bucket = {
      id: editingBucket?.id || `bucket_${Date.now()}`,
      name: name.trim() || 'Nueva Bolsa',
      budgetLimit: limit,
      color,
      icon,
      isBuffer,
      notes: notes.trim() || undefined,
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
      navigator.vibrate?.(35);
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
      navigator.vibrate?.([30, 40, 30]);
      setVasoModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al ejecutar el trasvase.');
    }
  };

  // Ejecutar Rollover de Ahorro
  const handleExecuteRollover = async () => {
    try {
      const result = await DBService.executeMonthlyRollover(currentMonthPrefix);
      navigator.vibrate?.([40, 50, 40]);
      setRolloverModalOpen(false);
      onRefresh();
      alert(
        `🎉 ¡Rollover Completado! Se han derivado ${result.surplusTotal.toFixed(2)} ${currency} de excedente de ${
          result.bucketCount
        } bolsas a "${result.transferredTo}".`
      );
    } catch (err: any) {
      alert(err.message || 'No se pudo completar el rollover.');
    }
  };

  // Paleta de colores
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
  ];

  // Iconos disponibles
  const availableIcons = [
    'Home',
    'Zap',
    'ShoppingCart',
    'Car',
    'Fuel',
    'ShieldCheck',
    'Smartphone',
    'Utensils',
    'PiggyBank',
    'FileText',
    'PieChart',
    'Briefcase',
    'HeartPulse',
    'Coffee',
  ];

  // Cálculo de totales globales
  const totalBudget = buckets.reduce((sum, b) => sum + b.budgetLimit, 0);
  const totalSpent = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const globalPct = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Cálculo del excedente potencial para rollover
  const potentialSurplus = buckets
    .filter((b) => !b.isBuffer)
    .reduce((sum, b) => {
      const spent = currentExpenses
        .filter((e) => e.bucketId === b.id)
        .reduce((s, e) => s + e.amount, 0);
      const rem = b.budgetLimit - spent;
      return rem > 0 ? sum + rem : sum;
    }, 0);

  // Detección de sobregiros para el Asistente Inteligente Cover Overspending
  const overspentBuckets = buckets.filter((b) => {
    const spent = currentExpenses
      .filter((e) => e.bucketId === b.id)
      .reduce((s, e) => s + e.amount, 0);
    return spent > b.budgetLimit;
  });

  const totalOverspending = overspentBuckets.reduce((acc, b) => {
    const spent = currentExpenses
      .filter((e) => e.bucketId === b.id)
      .reduce((s, e) => s + e.amount, 0);
    return acc + (spent - b.budgetLimit);
  }, 0);

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Bolsas de Presupuesto</span>
          </h2>
          <p className="text-xs text-slate-400">
            Envelopes elásticos con vasos comunicantes y protección de ahorro
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setVerticonsModalOpen(true)}
            title="Ver Icono APK y Versión Verticons"
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Icono Verticons</span>
          </button>

          <button
            onClick={handleSmartSeeds}
            title="Cargar 8 Bolsas Maestras (Smart Seeds)"
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Seeds</span>
          </button>

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
            className="px-3 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-300" />
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
        <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500/20 via-slate-900 to-rose-500/10 border border-rose-500/40 flex items-center justify-between gap-3 shadow-xl shadow-rose-950/30 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <span>{overspentBuckets.length} {overspentBuckets.length === 1 ? 'bolsa en sobregiro' : 'bolsas en sobregiro'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-bold border border-rose-500/40">
                  +{totalOverspending.toFixed(2)} {currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
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

      {/* Tarjeta de Resumen Global de Bolsas & Banner de Rollover */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Presupuesto Mensual Activo ({buckets.length} Bolsas)
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {totalSpent.toFixed(2)} / {totalBudget.toFixed(2)} {currency}
          </span>
        </div>

        <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden p-0.5">
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
          <span className="text-slate-400">
            Consumo total: <strong className="text-white">{globalPct}%</strong>
          </span>

          {potentialSurplus > 0 && (
            <button
              onClick={() => setRolloverModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <TrendingUp className="w-3 h-3 text-teal-400" />
              <span>Rollover Ahorro: +{potentialSurplus.toFixed(2)} {currency}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Bolsas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buckets.map((b) => {
          const IconComp = ICON_MAP[b.icon] || PieChart;
          const spent = currentExpenses
            .filter((e) => e.bucketId === b.id)
            .reduce((sum, e) => sum + e.amount, 0);
          const limit = b.budgetLimit || 1;
          const pct = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;
          const remaining = limit - spent;
          const isWarning = pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className={`p-4 rounded-3xl bg-slate-900/90 border transition-all ${
                b.isBuffer
                  ? 'border-teal-500/40 bg-teal-950/10 shadow-lg shadow-teal-950/20'
                  : isOver
                  ? 'border-rose-500/60 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md"
                    style={{ backgroundColor: b.color }}
                  >
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{b.name}</span>
                      {b.isBuffer && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold flex items-center gap-1 border border-teal-500/30">
                          <Shield className="w-3 h-3" /> Colchón Ahorro
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {b.notes || 'Partida presupuestaria'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setVasoTo(b.id);
                      const other = buckets.find((item) => item.id !== b.id);
                      if (other) setVasoFrom(other.id);
                      setVasoModalOpen(true);
                    }}
                    title="Compensar con otra bolsa (Vasos Comunicantes)"
                    className="p-1.5 text-cyan-400 hover:text-cyan-200 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
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

              {/* Números y Barra de Progreso */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Consumido este mes</span>
                  <div className="text-sm font-mono font-bold">
                    <span className={isOver ? 'text-rose-400 font-black' : 'text-white'}>
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
                      backgroundColor: isOver ? '#f43f5e' : isWarning ? '#f59e0b' : b.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{pct}% del techo</span>
                  <span
                    className={`font-semibold ${
                      isOver
                        ? 'text-rose-400 font-bold'
                        : isWarning
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {isOver
                      ? `⚠️ Exceso: ${(spent - limit).toFixed(2)} ${currency}`
                      : `Disponible: ${remaining.toFixed(2)} ${currency}`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: Crear / Editar Bolsa */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>{editingBucket ? 'Editar Bolsa' : 'Nueva Bolsa de Presupuesto'}</span>
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
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">
                  Límite Mensual ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="300"
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Selector de Icono Lucide */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Icono Representativo</label>
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {availableIcons.map((ic) => {
                    const Comp = ICON_MAP[ic] || PieChart;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                          icon === ic
                            ? 'bg-emerald-500 text-slate-950 font-bold scale-105 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Comp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de Color */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Color Distintivo</label>
                <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-2">
                  {palette.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setColor(p)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        color === p ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: p }}
                    />
                  ))}
                </div>
              </div>

              {/* Checkbox Colchón Buffer */}
              <div
                onClick={() => setIsBuffer(!isBuffer)}
                className="p-3 rounded-2xl bg-teal-950/20 border border-teal-500/30 flex items-center space-x-3 cursor-pointer"
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
                  <div className="text-xs font-bold text-teal-200">
                    Es Bolsa de Imprevistos / Colchón de Ahorro
                  </div>
                  <div className="text-[10px] text-teal-300/80">
                    Recibe automáticamente el rollover de ahorro mensual de las demás bolsas
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Descripción / Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Qué gastos cubre esta partida..."
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

      {/* MODAL 2: Vasos Comunicantes (Trasvase Elástico de Límites) */}
      {vasosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-cyan-500/50 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
                <span>Vasos Comunicantes (Compensación)</span>
              </h3>
              <button
                onClick={() => setVasoModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Reequilibra tus bolsas elásticamente: transfiere límite de presupuesto desde una bolsa con
              remanente hacia una que esté en tensión o déficit.
            </p>

            <form onSubmit={handleExecuteVasos} className="mt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">1. Bolsa Origen (Cede Saldo)</label>
                <select
                  value={vasoFrom}
                  onChange={(e) => setVasoFrom(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm"
                >
                  {buckets.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === vasoTo}>
                      {b.name} (Límite: {b.budgetLimit.toFixed(2)} {currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  ↓
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">2. Bolsa Destino (Recibe Fondos)</label>
                <select
                  value={vasoTo}
                  onChange={(e) => setVasoTo(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900 border border-slate-700 rounded-xl text-sm"
                >
                  {buckets.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.id === vasoFrom}>
                      {b.name} (Límite: {b.budgetLimit.toFixed(2)} {currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">
                  Importe a Trasvasar ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={vasoAmount}
                  onChange={(e) => setVasoAmount(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-900 border border-cyan-500/50 rounded-xl text-sm font-mono font-bold text-cyan-300"
                />

                <div className="flex items-center gap-2 pt-1">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setVasoAmount(String(val))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 border border-slate-700"
                    >
                      +{val} {currency}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setVasoModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Confirmar Trasvase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Rollover de Ahorro Mensual */}
      {rolloverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#0f172a] border border-teal-500/50 rounded-3xl w-full max-w-md p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span>Cierre de Mes y Rollover de Ahorro</span>
              </h3>
              <button
                onClick={() => setRolloverModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-center space-y-1">
                <span className="text-xs text-teal-300 uppercase tracking-wider font-bold">
                  Excedente No Gastado Identificado
                </span>
                <div className="text-3xl font-mono font-black text-emerald-400">
                  +{potentialSurplus.toFixed(2)} {currency}
                </div>
                <p className="text-[11px] text-slate-400">
                  Suma de presupuestos sobrantes de las bolsas activas
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Al ejecutar el <strong>Rollover</strong>, este superávit se añade automáticamente a tu{' '}
                <strong>Colchón de Ahorro e Imprevistos</strong>, premiando tu disciplina financiera sin
                perder el rastro del dinero.
              </p>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRolloverModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
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

      {/* MODAL 4: Visor de Icono APK y Versión Verticons */}
      {verticonsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0b111e] border border-cyan-500/40 rounded-3xl w-full max-w-lg p-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span>Iconografía Oficial CronoCash</span>
              </h3>
              <button
                onClick={() => setVerticonsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Comparativa de Iconos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                {/* 1. Icono Launcher APK (Squircle) */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col items-center">
                  <span className="text-xs font-bold text-slate-300">Icono Launcher APK</span>
                  <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/80 bg-slate-950">
                    <img
                      src="/logo.jpg"
                      alt="CronoCash Launcher"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Adaptive Squircle 1:1 integrado en el instalador Android
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage('/logo.jpg', 'crono-cash-launcher.jpg', 'Icono CronoCash Oficial')}
                    disabled={downloadingFile === 'crono-cash-launcher.jpg'}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-200 flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                  >
                    {downloadingFile === 'crono-cash-launcher.jpg' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{downloadingFile === 'crono-cash-launcher.jpg' ? 'Guardando...' : 'Descargar JPG'}</span>
                  </button>
                </div>

                {/* 2. Verticons Card Edition */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 space-y-3 flex flex-col items-center">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Verticons Card Pack</span>
                  </span>
                  <div className="w-20 h-30 rounded-2xl overflow-hidden shadow-2xl border border-cyan-400/50 bg-slate-950/60 p-0.5">
                    <img
                      src="/verticon-icon.png"
                      alt="CronoCash Verticons"
                      className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 text-center">
                    Tarjeta vertical 2:3 al ras con marco de neón esmeralda y fibra de carbono (sin marcos negros)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadImage('/verticon-icon.png', 'crono-cash-verticon.png', 'Tarjeta Verticons Transparente')}
                      disabled={downloadingFile === 'crono-cash-verticon.png'}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 active:scale-95 text-xs font-bold text-cyan-300 flex items-center gap-1 border border-cyan-500/40 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      {downloadingFile === 'crono-cash-verticon.png' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{downloadingFile === 'crono-cash-verticon.png' ? 'Guardando...' : 'PNG Transparente'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadImage('/verticon-icon.jpg', 'crono-cash-verticon.jpg', 'Tarjeta Verticons JPG')}
                      disabled={downloadingFile === 'crono-cash-verticon.jpg'}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-300 flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      {downloadingFile === 'crono-cash-verticon.jpg' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{downloadingFile === 'crono-cash-verticon.jpg' ? 'Guardando...' : 'JPG'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Instrucciones de aplicación en Android */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Cómo aplicar el icono en tu teléfono Android:</span>
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>
                    <strong>Icono Automático:</strong> Al instalar el APK compilado, tu teléfono
                    usará automáticamente el icono de la bóveda esmeralda en el launcher.
                  </li>
                  <li>
                    <strong>Personalización con Verticons:</strong> Descarga la imagen Verticons en
                    tu galería pulsando en "Descargar Verticon".
                  </li>
                  <li>
                    En tu launcher compatible (Nova Launcher, Niagara Launcher, Smart Launcher): mantén
                    pulsado el icono de CronoCash → Editar → Seleccionar imagen de Galería.
                  </li>
                </ol>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setVerticonsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Cerrar
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
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};
