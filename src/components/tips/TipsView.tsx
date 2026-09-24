import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  FileCheck,
  ShieldAlert,
  Coins,
  PiggyBank,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Check,
  DollarSign,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { FinancialTip } from '../../types';
import { DBService } from '../../services/db';

interface TipsViewProps {
  tips: FinancialTip[];
  onToggleApplied?: (tipId: string) => void;
  currency?: string;
}

type TipCategory =
  | 'todas'
  | 'ahorro'
  | 'dinero_rapido'
  | 'dinero_pasivo'
  | 'anti_estafas'
  | 'fiscal'
  | 'presupuesto';

export const TipsView: React.FC<TipsViewProps> = ({
  tips,
  onToggleApplied,
  currency = '€',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TipCategory>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTipIds, setExpandedTipIds] = useState<Record<string, boolean>>({});

  // Categorías con etiquetas y badges
  const categories: { id: TipCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'todas', label: 'Todas', icon: Sparkles },
    { id: 'ahorro', label: 'Ahorro & Recibos', icon: TrendingUp },
    { id: 'dinero_rapido', label: 'Dinero Rápido', icon: Zap },
    { id: 'dinero_pasivo', label: 'Ingresos Pasivos', icon: PiggyBank },
    { id: 'anti_estafas', label: 'Escudo Anti-Estafas', icon: ShieldAlert },
    { id: 'fiscal', label: 'Fiscal & Facturas', icon: FileCheck },
    { id: 'presupuesto', label: 'Presupuesto', icon: Award },
  ];

  // Alternar expansión de pasos de acción
  const toggleExpanded = (tipId: string) => {
    setExpandedTipIds((prev) => ({
      ...prev,
      [tipId]: !prev[tipId],
    }));
  };

  // Manejar el toggle de aplicado
  const handleToggle = async (tipId: string) => {
    if (onToggleApplied) {
      onToggleApplied(tipId);
    } else {
      await DBService.toggleTipApplied(tipId);
    }
  };

  // Filtrado reactivo de estrategias
  const filteredTips = useMemo(() => {
    return tips.filter((tip) => {
      // Filtro de categoría
      if (selectedCategory !== 'todas' && tip.category !== selectedCategory) {
        return false;
      }

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = tip.title.toLowerCase().includes(query);
        const matchesContent = tip.content.toLowerCase().includes(query);
        const matchesBasis = tip.officialSourceOrLegalBasis?.toLowerCase().includes(query);
        const matchesSteps = tip.actionSteps?.some((s) => s.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesBasis || matchesSteps;
      }

      return true;
    });
  }, [tips, selectedCategory, searchQuery]);

  // Métricas de progreso
  const totalTips = tips.length;
  const appliedCount = tips.filter((t) => t.isApplied).length;
  const appliedPercentage = totalTips > 0 ? Math.round((appliedCount / totalTips) * 100) : 0;

  // Icono según categoría
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'ahorro':
        return TrendingUp;
      case 'dinero_rapido':
        return Zap;
      case 'dinero_pasivo':
        return PiggyBank;
      case 'anti_estafas':
        return ShieldAlert;
      case 'fiscal':
        return FileCheck;
      case 'presupuesto':
        return Award;
      default:
        return Lightbulb;
    }
  };

  // Estilos de impacto
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'crucial':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'alto':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'medio':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Cabecera y Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <span>Estrategias Financieras & Ahorro Inteligente</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métodos legales probados para optimizar gastos, generar ingresos y proteger tu capital
          </p>
        </div>

        {/* Badge de Progreso */}
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-300">
            {appliedCount} de {totalTips} aplicadas
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            {appliedPercentage}%
          </span>
        </div>
      </div>

      {/* Banner Resumen y Escudo Activo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ahorro Estimado Anual</span>
          </div>
          <div className="text-lg font-mono font-black text-white">800€ - 2.500€</div>
          <p className="text-[11px] text-slate-400">Renegociación de luz, telecos y corte de comisiones.</p>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-blue-950/40 to-slate-900/60 border border-blue-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Ingresos Pasivos Legales</span>
          </div>
          <div className="text-lg font-mono font-black text-white">3% - 4% TAE</div>
          <p className="text-[11px] text-slate-400">Cuentas remuneradas con FGD y fondos monetarios.</p>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-rose-950/40 to-slate-900/60 border border-rose-500/30 rounded-2xl space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Escudo Anti-Estafas</span>
          </div>
          <div className="text-lg font-mono font-black text-white">100% Protegido</div>
          <p className="text-[11px] text-slate-400">Comprobación en CNMV y prevención de esquemas Ponzi.</p>
        </div>
      </div>

      {/* Buscador de Estrategias */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por palabra clave (ej. luz, Wallapop, CNMV, seguros, FGD)..."
          className="w-full h-11 pl-10 pr-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-emerald-500/60 focus:outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtros por Categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Listado de Estrategias */}
      <div className="space-y-4">
        {filteredTips.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-3xl space-y-2">
            <Lightbulb className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">No se encontraron estrategias</div>
            <p className="text-xs text-slate-500">Prueba ajustando los términos de búsqueda o cambiando de categoría.</p>
          </div>
        ) : (
          filteredTips.map((tip) => {
            const Icon = getCategoryIcon(tip.category);
            const isExpanded = Boolean(expandedTipIds[tip.id]);

            return (
              <div
                key={tip.id}
                className={`p-5 rounded-3xl border transition-all shadow-sm space-y-4 relative ${
                  tip.isApplied
                    ? 'bg-emerald-950/15 border-emerald-500/30'
                    : tip.category === 'anti_estafas'
                    ? 'bg-slate-900/90 border-rose-500/20 hover:border-rose-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Cabecera del Tip */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2.5 rounded-2xl border shrink-0 ${
                        tip.category === 'anti_estafas'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : tip.category === 'dinero_rapido'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {tip.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${getImpactBadge(
                            tip.impact
                          )}`}
                        >
                          {tip.impact === 'crucial' ? 'Crucial' : `Impacto ${tip.impact}`}
                        </span>
                        {tip.difficulty && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {tip.difficulty}
                          </span>
                        )}
                        {tip.timeNeeded && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{tip.timeNeeded}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug">
                        {tip.title}
                      </h3>
                    </div>
                  </div>

                  {/* Botón Aplicado */}
                  <button
                    onClick={() => handleToggle(tip.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      tip.isApplied
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${tip.isApplied ? 'stroke-[3]' : 'opacity-60'}`} />
                    <span className="hidden sm:inline">
                      {tip.isApplied ? 'Aplicado' : 'Marcar Aplicado'}
                    </span>
                  </button>
                </div>

                {/* Explicación y Contenido */}
                <p className="text-xs text-slate-300 leading-relaxed">{tip.content}</p>

                {/* Impacto Económico Destacado */}
                {tip.estimatedSavingsOrEarning && (
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-bold text-slate-300">Retorno o Ahorro Estimado:</span>
                    </div>
                    <span className="text-xs font-mono font-black text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                      {tip.estimatedSavingsOrEarning}
                    </span>
                  </div>
                )}

                {/* Pasos de Acción (Desplegables) */}
                {tip.actionSteps && tip.actionSteps.length > 0 && (
                  <div className="border-t border-slate-800/70 pt-3">
                    <button
                      onClick={() => toggleExpanded(tip.id)}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-between w-full cursor-pointer py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pasos de Acción Recomendados ({tip.actionSteps.length})</span>
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 animate-in fade-in duration-150">
                        {tip.actionSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Base Legal o Fuente Oficial */}
                {tip.officialSourceOrLegalBasis && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                    <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-400">Respaldo Oficial:</span>
                    <span className="truncate">{tip.officialSourceOrLegalBasis}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
