import React from 'react';
import { Lightbulb, Sparkles, TrendingUp, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import { FinancialTip } from '../../types';

interface TipsViewProps {
  tips: FinancialTip[];
}

export const TipsView: React.FC<TipsViewProps> = ({ tips }) => {
  const categoryIcons = {
    ahorro: TrendingUp,
    facturacion: FileCheck,
    presupuesto: Sparkles,
    fiscal: ShieldCheck,
  };

  const impactColors = {
    alto: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    medio: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    bajo: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>Estrategia y Consejos Financieros</span>
        </h2>
        <p className="text-xs text-slate-400">
          Técnicas de optimización de presupuesto, ahorro y fiscalidad
        </p>
      </div>

      <div className="space-y-4">
        {tips.map((tip) => {
          const Icon = categoryIcons[tip.category] || Lightbulb;
          const impactClass = impactColors[tip.impact] || impactColors.medio;

          return (
            <div
              key={tip.id}
              className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {tip.category}
                  </span>
                </div>

                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${impactClass}`}
                >
                  Impacto {tip.impact}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{tip.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1">{tip.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
