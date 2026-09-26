import React, { useState, useMemo } from 'react';
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
  Plus,
  Coins,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Award,
  ArrowRight,
} from 'lucide-react';
import { SavingsGoal, Bucket } from '../../types';
import { SinkingFundsService } from '../../services/sinkingFundsService';
import { GoalFormModal } from './GoalFormModal';
import { SweepSurplusModal } from './SweepSurplusModal';
import { QuickContributeModal } from './QuickContributeModal';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  buckets: Bucket[];
  currency: string;
  surplusAvailable: number;
  onSaveGoal: (goal: SavingsGoal) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  onAddContribution: (
    goalId: string,
    amount: number,
    source: 'manual' | 'rollover' | 'safe_to_spend_surplus',
    notes?: string
  ) => Promise<void>;
  onRefresh: () => void;
}

const GOAL_ICON_MAP: Record<string, React.ElementType> = {
  Target,
  PiggyBank,
  Car,
  Home,
  Palmtree,
  ShieldAlert,
  Zap,
  HeartPulse,
  Smartphone,
};

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  onClose,
  goals,
  buckets,
  currency,
  surplusAvailable,
  onSaveGoal,
  onDeleteGoal,
  onAddContribution,
  onRefresh,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [sweepOpen, setSweepOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Totales de la cabecera
  const totalSaved = useMemo(
    () => goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0),
    [goals]
  );

  const totalCommittedCruising = useMemo(
    () => SinkingFundsService.calculateTotalCommittedMonthly(goals),
    [goals]
  );

  const completedCount = useMemo(
    () => goals.filter((g) => g.isCompleted || g.currentAmount >= g.targetAmount).length,
    [goals]
  );

  if (!isOpen) return null;

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar la meta de ahorro "${title}"?`)) {
      await onDeleteGoal(id);
      onRefresh();
    }
  };

  const handleSweepExecution = async (allocations: { goalId: string; amount: number }[]) => {
    for (const alloc of allocations) {
      if (alloc.amount > 0) {
        await onAddContribution(
          alloc.goalId,
          alloc.amount,
          'safe_to_spend_surplus',
          'Inyección automática por barrido de superávit mensual'
        );
      }
    }
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 shadow-inner">
              <Target className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Metas & Sinking Funds</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  v1.11.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ahorro autónomo con ritmo de crucero y blindaje Safe-to-Spend
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen KPI */}
        <div className="grid grid-cols-3 gap-2.5 my-4 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Total Ahorrado
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
              {totalSaved.toFixed(2)} {currency}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{goals.length} metas activas</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              <span>Crucero Mensual</span>
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-purple-300 mt-0.5">
              {totalCommittedCruising.toFixed(2)} {currency}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Protegido en Safe-to-Spend</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-cyan-400" />
              <span>Metas Cumplidas</span>
            </span>
            <div className="text-base sm:text-lg font-black font-mono text-cyan-300 mt-0.5">
              {completedCount} / {goals.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Objetivos completados</span>
          </div>
        </div>

        {/* Barra de Acciones: Botón Nueva Meta y Botón Sweep & Fund */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-slate-800/60 flex-shrink-0">
          <div className="text-xs font-bold text-slate-300">
            Listado de Fondos Específicos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSweepOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Repartir superávit Safe-to-Spend entre metas de forma proporcional"
            >
              <Coins className="w-3.5 h-3.5 text-cyan-400" />
              <span>Repartir Excedente (Sweep)</span>
            </button>

            <button
              onClick={handleCreateNew}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nueva Meta</span>
            </button>
          </div>
        </div>

        {/* Lista Scrollable de Tarjetas de Metas */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {goals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-400">
              <Target className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">No hay metas de ahorro configuradas</p>
              <p className="text-xs text-slate-500 mt-1">
                Crea tu primera meta (seguro del coche, IBI, vacaciones) y mantén tu ritmo de crucero financiero.
              </p>
            </div>
          ) : (
            goals.map((goal) => {
              const pace = SinkingFundsService.calculateCruisePace(goal);
              const percentage = Math.min(
                100,
                Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100)
              );
              const IconComponent = GOAL_ICON_MAP[goal.icon] || Target;
              const isExpanded = expandedGoalId === goal.id;

              // Configuración de Badge de Estado
              const statusConfig = {
                completed: {
                  label: 'Completada',
                  bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                  icon: CheckCircle2,
                },
                on_track: {
                  label: 'En ritmo',
                  bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
                  icon: TrendingUp,
                },
                behind: {
                  label: 'Requiere atención',
                  bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
                  icon: Clock,
                },
                critical: {
                  label: 'Crítica / Vencida',
                  bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                  icon: AlertTriangle,
                },
              }[pace.status];

              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={goal.id}
                  className={`rounded-2xl bg-slate-950/70 border transition-all ${
                    goal.isCompleted
                      ? 'border-emerald-500/30'
                      : pace.status === 'critical'
                      ? 'border-rose-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  } p-4`}
                >
                  {/* Fila Principal de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="p-3 rounded-2xl flex-shrink-0 flex items-center justify-center border shadow-xs"
                        style={{
                          backgroundColor: `${goal.color}15`,
                          borderColor: `${goal.color}35`,
                          color: goal.color,
                        }}
                      >
                        <IconComponent className="w-5 h-5 stroke-[2.5]" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-white truncate">{goal.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.bg}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusConfig.label}</span>
                          </span>
                          {goal.autoDeductFromSafeToSpend && !goal.isCompleted && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
                              title="Cuota protegida automáticamente en Safe-to-Spend"
                            >
                              🛡️ Protegida
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span>
                            Meta: <strong className="font-mono text-slate-200">{goal.targetAmount.toFixed(2)} {currency}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Fecha objetivo: <strong className="font-mono text-slate-300">{goal.targetDate}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {pace.monthsRemaining > 0
                              ? `Faltan ${pace.monthsRemaining} ${pace.monthsRemaining === 1 ? 'mes' : 'meses'}`
                              : 'Vence este mes'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botón táctil "+ Aportar" y Menú de Acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setContributingGoal(goal)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Aportar</span>
                      </button>

                      <button
                        onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                        className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Ver detalles e historial de aportaciones"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Barra de Progreso Visual */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="font-mono">
                        <span className="font-black text-white text-sm">
                          {goal.currentAmount.toFixed(2)}
                        </span>
                        <span className="text-slate-400 text-xs"> / {goal.targetAmount.toFixed(2)} {currency}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold" style={{ color: goal.color }}>
                          {percentage}%
                        </span>
                        {!goal.isCompleted && pace.monthlyContribution > 0 && (
                          <span className="text-purple-300 font-bold text-[11px] bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                            Crucero: ~{pace.monthlyContribution.toFixed(2)} {currency}/mes
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.isCompleted ? '#10b981' : goal.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Panel Desplegable: Historial de Aportaciones, Notas y Botones Editar/Borrar */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn text-xs">
                      {goal.notes && (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-300 text-[11px]">
                          <span className="font-bold text-slate-400 block mb-0.5">Notas:</span>
                          {goal.notes}
                        </div>
                      )}

                      {/* Historial de aportaciones */}
                      <div>
                        <span className="font-bold text-slate-400 block text-[11px] uppercase tracking-wider mb-1.5">
                          Historial de Aportaciones ({goal.contributions?.length || 0}):
                        </span>

                        {(!goal.contributions || goal.contributions.length === 0) ? (
                          <p className="text-slate-500 text-[11px] italic">Sin aportaciones registradas aún.</p>
                        ) : (
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {goal.contributions.slice().reverse().map((c) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800/70 text-[11px]"
                              >
                                <div className="truncate">
                                  <span className="text-slate-300 font-medium block truncate">
                                    {c.notes || (c.source === 'safe_to_spend_surplus' ? 'Superávit Safe-to-Spend' : 'Aportación puntual')}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {c.date} • {c.source}
                                  </span>
                                </div>
                                <span className="font-mono font-bold text-emerald-400">
                                  +{c.amount.toFixed(2)} {currency}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Botones de gestión Editar / Eliminar */}
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                        <button
                          onClick={() => handleDelete(goal.id, goal.title)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>

                        <button
                          onClick={() => handleEdit(goal)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Meta</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Crear / Editar Meta */}
      {formOpen && (
        <GoalFormModal
          isOpen={formOpen}
          onClose={() => setFormOpen(false)}
          onSave={async (goal) => {
            await onSaveGoal(goal);
            onRefresh();
          }}
          buckets={buckets}
          currency={currency}
          initialGoal={editingGoal}
        />
      )}

      {/* Modal de Reparto de Excedente (Sweep & Fund) */}
      {sweepOpen && (
        <SweepSurplusModal
          isOpen={sweepOpen}
          onClose={() => setSweepOpen(false)}
          surplusAvailable={surplusAvailable}
          goals={goals}
          currency={currency}
          onApplySweep={handleSweepExecution}
        />
      )}

      {/* Modal Aportación Rápida en 1 Toque */}
      {contributingGoal && (
        <QuickContributeModal
          isOpen={Boolean(contributingGoal)}
          onClose={() => setContributingGoal(null)}
          goal={contributingGoal}
          currency={currency}
          onAddContribution={async (goalId, amount, notes) => {
            await onAddContribution(goalId, amount, 'manual', notes);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
