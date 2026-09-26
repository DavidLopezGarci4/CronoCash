import React from 'react';
import { Lock, Settings as SettingsIcon, TrendingUp, TrendingDown, Cloud, Sparkles } from 'lucide-react';
import { Settings } from '../../types';

interface HeaderProps {
  settings: Settings;
  totalExpensesMonth: number;
  dailySafeToSpend?: number;
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  totalExpensesMonth,
  dailySafeToSpend,
  onLock,
  onOpenSettings,
  onOpenBackup,
}) => {
  const currency = settings.currency || '€';
  const income = settings.monthlyIncome || 0;
  const balance = income - totalExpensesMonth;
  const isPositive = balance >= 0;

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/10"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090d16]" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              CronoCash
            </h1>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{settings.companyName || settings.userFullName || 'Bóveda Financiera'}</span>
            </p>
          </div>
        </div>

        {/* Balance rápido del Mes & Safe-to-Spend */}
        <div className="flex items-center space-x-2">
          {dailySafeToSpend !== undefined && (
            <div className="flex flex-col items-end px-2.5 py-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                <span>Hoy</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {dailySafeToSpend.toFixed(2)} {currency}
              </span>
            </div>
          )}

          <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Disponible Mes
            </span>
            <div className={`text-xs font-mono font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>
                {balance >= 0 ? '+' : ''}{balance.toFixed(2)} {currency}
              </span>
            </div>
          </div>

          {/* Botón Copias de Seguridad */}
          <button
            onClick={onOpenBackup}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/30 cursor-pointer shadow-xs"
            title="Copias de Seguridad (Google Drive 2 Ranuras)"
          >
            <Cloud className="w-4 h-4" />
          </button>

          {/* Botón Ajustes */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer"
            title="Ajustes y Bóveda"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Botón Candado Bloqueo Manual */}
          <button
            onClick={onLock}
            className="p-2 rounded-xl bg-emerald-950/40 hover:bg-rose-950/40 border border-emerald-500/30 hover:border-rose-500/40 text-emerald-400 hover:text-rose-400 transition-all cursor-pointer shadow-xs"
            title="Bloquear sesión inmediatamente"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
