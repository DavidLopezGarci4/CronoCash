import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Calculator,
  Calendar,
  AlertCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { SafeToSpendMetrics, SafeToSpendService } from '../../services/safeToSpendService';

interface SafeToSpendWidgetProps {
  metrics: SafeToSpendMetrics;
  currency: string;
  onOpenRecurringTab?: () => void;
  onOpenBucketsTab?: () => void;
}

export const SafeToSpendWidget: React.FC<SafeToSpendWidgetProps> = ({
  metrics,
  currency,
  onOpenRecurringTab,
  onOpenBucketsTab,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simulatedAmount, setSimulatedAmount] = useState<string>('30');

  const simValue = parseFloat(simulatedAmount.replace(',', '.')) || 0;
  const simulation = SafeToSpendService.simulateImpulse(metrics, simValue);

  // Colores y badges según estado de salud
  const statusConfig = {
    optimal: {
      border: 'border-emerald-500/30',
      bgGlow: 'from-emerald-500/10 via-slate-900/60 to-slate-950',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badgeLabel: 'Ritmo Saludable',
      iconColor: 'text-emerald-400',
      textAccent: 'text-emerald-400',
    },
    warning: {
      border: 'border-amber-500/30',
      bgGlow: 'from-amber-500/10 via-slate-900/60 to-slate-950',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeLabel: 'Margen Moderado',
      iconColor: 'text-amber-400',
      textAccent: 'text-amber-400',
    },
    critical: {
      border: 'border-rose-500/30',
      bgGlow: 'from-rose-500/10 via-slate-900/60 to-slate-950',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      badgeLabel: 'Margen Ajustado',
      iconColor: 'text-rose-400',
      textAccent: 'text-rose-400',
    },
  }[metrics.status];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${statusConfig.bgGlow} border ${statusConfig.border} p-5 shadow-xl transition-all duration-300`}
    >
      {/* Luz ambiental de fondo */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del Widget */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            <Sparkles className={`w-4 h-4 ${statusConfig.iconColor}`} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Gasto Diario Seguro</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Safe-to-Spend
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {metrics.daysRemaining} {metrics.daysRemaining === 1 ? 'día restante' : 'días restantes'} este mes
            </p>
          </div>
        </div>

        {/* Badge de Estado */}
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusConfig.badgeBg}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          <span>{statusConfig.badgeLabel}</span>
        </span>
      </div>

      {/* Cifra Principal */}
      <div className="my-3 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-4xl font-black font-mono tracking-tight ${statusConfig.textAccent}`}>
              {metrics.dailySafeToSpend.toFixed(2)}
            </span>
            <span className="text-lg font-bold text-slate-400 font-mono">{currency}</span>
            <span className="text-xs text-slate-400 font-medium ml-1">/ día</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Importe que puedes gastar hoy sin comprometer tus facturas pendientes ni tocar el colchón protegido.
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => setSimulatorOpen(!simulatorOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              simulatorOpen
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulador</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Ver desglose del cálculo"
          >
            {detailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Barra de Ritmo de Consumo (Pace Bar) */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Ritmo del mes: día {metrics.currentDay} de {metrics.totalDaysInMonth} ({metrics.expectedPacePercentage}%)</span>
          </span>
          <span className="font-mono text-slate-300 font-semibold">
            Consumo: {metrics.burnRatePercentage}%
          </span>
        </div>
        <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          {/* Línea objetivo del calendario */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10 opacity-75"
            style={{ left: `${Math.min(100, metrics.expectedPacePercentage)}%` }}
            title="Día del mes actual"
          />
          {/* Barra de gasto real consumido */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              metrics.status === 'optimal'
                ? 'bg-emerald-400'
                : metrics.status === 'warning'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, metrics.burnRatePercentage)}%` }}
          />
        </div>
      </div>

      {/* SIMULADOR DE IMPACTO DE GASTO IMPREVISTO */}
      {simulatorOpen && (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulador de Gasto Impulsivo</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">¿Qué pasa si compro algo hoy?</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                step="5"
                min="0"
                value={simulatedAmount}
                onChange={(e) => setSimulatedAmount(e.target.value)}
                placeholder="Importe a simular"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-mono">{currency}</span>
            </div>

            {/* Píldoras de simulación rápida */}
            <div className="flex gap-1">
              {['20', '50', '100'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSimulatedAmount(p)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    simulatedAmount === p
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  +{p}€
                </button>
              ))}
            </div>
          </div>

          {/* Resultado de la simulación */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Nueva cuota restante:</span>
              <span className="font-mono font-bold text-cyan-300 text-sm">
                {simulation.simulatedDailySafe.toFixed(2)} {currency}/día
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Reducción diaria:</span>
              <span className="font-mono font-bold text-rose-400 text-xs">
                -{simulation.dailyReduction.toFixed(2)} {currency}/día
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DESGLOSE MATEMÁTICO TRANSPARENTE */}
      {detailsOpen && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs animate-fadeIn">
          <div className="flex items-center justify-between text-slate-400 font-bold mb-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Desglose Matemático del Cálculo:</span>
            </span>
          </div>

          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">1. Ingreso mensual registrado:</span>
              <span className="text-emerald-400 font-bold">+{metrics.monthlyIncome.toFixed(2)} {currency}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">2. Consumo acumulado del mes:</span>
              <span className="text-rose-400 font-bold">-{metrics.totalSpentMonth.toFixed(2)} {currency}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">3. Facturas pendientes ({metrics.pendingBillsCount}):</span>
                {onOpenRecurringTab && (
                  <button
                    type="button"
                    onClick={onOpenRecurringTab}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    (ver)
                  </button>
                )}
              </div>
              <span className="text-amber-400 font-bold">-{metrics.pendingRecurringTotal.toFixed(2)} {currency}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <div className="flex items-center gap-1">
                <span className="text-slate-400">4. Colchón de ahorro protegido:</span>
                {onOpenBucketsTab && (
                  <button
                    type="button"
                    onClick={onOpenBucketsTab}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    (bolsas)
                  </button>
                )}
              </div>
              <span className="text-blue-400 font-bold">-{metrics.bufferReserved.toFixed(2)} {currency}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-slate-200 font-bold">
              <span>= Liquidez disponible real:</span>
              <span className="text-white text-xs">{metrics.netAvailable.toFixed(2)} {currency}</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 pt-1">
              <span>÷ Dividido entre {metrics.daysRemaining} días restantes:</span>
              <span className="text-emerald-400 font-bold text-xs">{metrics.dailySafeToSpend.toFixed(2)} {currency} / día</span>
            </div>
          </div>

          {/* Lista de facturas pendientes detectadas */}
          {metrics.pendingBills.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block px-1">
                Facturas reservadas en el cálculo:
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {metrics.pendingBills.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px]"
                  >
                    <span className="text-slate-300 truncate max-w-[200px]">
                      {b.title} {b.isVampire && <span className="text-rose-400 text-[9px] font-bold">(vampiro)</span>}
                    </span>
                    <span className="font-mono text-slate-400">
                      {b.amount.toFixed(2)} {currency} <span className="text-[9px] text-slate-400">(día {b.dueDay})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
