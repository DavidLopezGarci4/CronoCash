import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Scale,
  CheckCircle2,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Bucket, Expense } from '../../types';
import { DBService } from '../../services/db';

interface CoverOverspendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  buckets: Bucket[];
  expenses: Expense[];
  currency: string;
  onRefresh: () => void;
}

export type RebalanceStrategy = 'buffer' | 'highest_surplus' | 'proportional';

export const CoverOverspendingModal: React.FC<CoverOverspendingModalProps> = ({
  isOpen,
  onClose,
  buckets,
  expenses,
  currency,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const currentMonthExpenses = expenses.filter((e) =>
    (e.date || '').startsWith(currentMonthPrefix)
  );

  // Calcular gasto y balance por bolsa
  const bucketStates = buckets.map((b) => {
    const spent = currentMonthExpenses
      .filter((e) => e.bucketId === b.id)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const limit = b.budgetLimit || 0;
    const diff = limit - spent;
    return {
      bucket: b,
      spent,
      limit,
      deficit: diff < 0 ? Math.abs(diff) : 0,
      surplus: diff > 0 ? diff : 0,
    };
  });

  const overspentItems = bucketStates.filter((s) => s.deficit > 0);
  const surplusItems = bucketStates.filter((s) => s.surplus > 0);
  const totalDeficit = overspentItems.reduce((acc, curr) => acc + curr.deficit, 0);
  const totalSurplus = surplusItems.reduce((acc, curr) => acc + curr.surplus, 0);

  const bufferItem = bucketStates.find((s) => s.bucket.isBuffer);
  const highestSurplusItem = [...surplusItems].sort((a, b) => b.surplus - a.surplus)[0];

  const [selectedStrategy, setSelectedStrategy] = useState<RebalanceStrategy>(() => {
    if (bufferItem && bufferItem.surplus >= totalDeficit) return 'buffer';
    if (highestSurplusItem && highestSurplusItem.surplus >= totalDeficit) return 'highest_surplus';
    return 'proportional';
  });

  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ejecutar el reequilibrio inteligente de vasos comunicantes
  const handleApplyRebalance = async () => {
    setIsApplying(true);
    try {
      const updatedBucketsMap = new Map<string, Bucket>();
      buckets.forEach((b) => updatedBucketsMap.set(b.id, { ...b }));

      // 1. Ampliar límite de las bolsas en déficit para dejarlas en saldo neutro exacto
      overspentItems.forEach((item) => {
        const target = updatedBucketsMap.get(item.bucket.id)!;
        target.budgetLimit = Math.round((target.budgetLimit + item.deficit) * 100) / 100;
      });

      // 2. Deducir el déficit total según la estrategia elegida
      if (selectedStrategy === 'buffer' && bufferItem) {
        // Opción A: Deducir del colchón
        const buf = updatedBucketsMap.get(bufferItem.bucket.id)!;
        buf.budgetLimit = Math.max(0, Math.round((buf.budgetLimit - totalDeficit) * 100) / 100);
      } else if (selectedStrategy === 'highest_surplus' && highestSurplusItem) {
        // Opción B: Deducir de la bolsa con mayor superávit
        const best = updatedBucketsMap.get(highestSurplusItem.bucket.id)!;
        best.budgetLimit = Math.max(0, Math.round((best.budgetLimit - totalDeficit) * 100) / 100);
      } else {
        // Opción C: Prorratear entre todas las bolsas con margen positivo
        if (totalSurplus > 0) {
          surplusItems.forEach((item) => {
            const portion = (item.surplus / totalSurplus) * totalDeficit;
            const b = updatedBucketsMap.get(item.bucket.id)!;
            b.budgetLimit = Math.max(0, Math.round((b.budgetLimit - portion) * 100) / 100);
          });
        }
      }

      // Guardar de forma atómica todas las bolsas actualizadas
      for (const updated of updatedBucketsMap.values()) {
        await DBService.saveBucket(updated);
      }

      setSuccessMessage('¡Presupuesto reequilibrado con éxito! Vasos comunicantes actualizados.');
      onRefresh();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error al reequilibrar sobregiro:', err);
      alert('Ocurrió un error al aplicar el reequilibrio.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Luz ambiental de fondo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Asistente de Sobregiro</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Cover Overspending
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Reequilibra tus bolsas con un solo toque sin descuadrar el mes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {successMessage ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
              <div className="text-sm font-bold text-white">{successMessage}</div>
            </div>
          ) : (
            <>
              {/* Resumen del Déficit Detectado */}
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Déficit detectado en {overspentItems.length} {overspentItems.length === 1 ? 'bolsa' : 'bolsas'}:</span>
                  </span>
                  <span className="font-mono text-sm text-rose-400">
                    +{totalDeficit.toFixed(2)} {currency}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {overspentItems.map((item) => (
                    <div
                      key={item.bucket.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.bucket.color }}
                        />
                        <span className="font-medium text-slate-200">{item.bucket.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-slate-400 text-[11px] mr-2">
                          Gastado: {item.spent.toFixed(2)} / {item.limit.toFixed(2)}
                        </span>
                        <span className="text-rose-400 font-bold">
                          +{item.deficit.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selector de Estrategia de Compensación */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Selecciona cómo deseas compensar este exceso:</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Margen disponible en otras bolsas: {totalSurplus.toFixed(2)} {currency}
                  </span>
                </label>

                {/* Estrategia 1: Desde Colchón */}
                {bufferItem && (
                  <button
                    type="button"
                    onClick={() => setSelectedStrategy('buffer')}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      selectedStrategy === 'buffer'
                        ? 'bg-blue-500/15 border-blue-500/50 shadow-md shadow-blue-900/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Compensar desde {bufferItem.bucket.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-400">
                          Margen: {bufferItem.surplus.toFixed(2)} {currency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Utiliza el fondo de emergencia para absorber el déficit sin alterar tus límites de ocio o compras.
                      </p>
                    </div>
                  </button>
                )}

                {/* Estrategia 2: Desde Mayor Superávit */}
                {highestSurplusItem && highestSurplusItem.bucket.id !== bufferItem?.bucket.id && (
                  <button
                    type="button"
                    onClick={() => setSelectedStrategy('highest_surplus')}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      selectedStrategy === 'highest_surplus'
                        ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md shadow-emerald-900/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Compensar desde {highestSurplusItem.bucket.name}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Sobra: {highestSurplusItem.surplus.toFixed(2)} {currency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        La bolsa con más dinero disponible sin consumir asume el importe excedido de forma natural.
                      </p>
                    </div>
                  </button>
                )}

                {/* Estrategia 3: Prorrateo Equitativo */}
                <button
                  type="button"
                  onClick={() => setSelectedStrategy('proportional')}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    selectedStrategy === 'proportional'
                      ? 'bg-purple-500/15 border-purple-500/50 shadow-md shadow-purple-900/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Prorratear entre todas las bolsas con margen
                      </span>
                      <span className="text-xs font-mono font-bold text-purple-400">
                        {surplusItems.length} bolsas donantes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Reparte el impacto proporcionalmente para que ninguna bolsa individual sufra un recorte brusco.
                    </p>
                  </div>
                </button>
              </div>

              {/* Nota Informativa */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  El reequilibrio ajusta los techos de gasto de las bolsas involucradas mediante vasos comunicantes. El total de presupuesto mensual permanece invariable.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Pie con Botones */}
        {!successMessage && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isApplying || totalDeficit <= 0}
              onClick={handleApplyRebalance}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-xs font-bold text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isApplying ? 'Reequilibrando...' : 'Aplicar Reequilibrio'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
