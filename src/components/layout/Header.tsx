import React from 'react';
import {
  Lock,
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  Cloud,
  Sparkles,
  Target,
  LayoutDashboard,
  PieChart,
  Repeat,
  Calendar,
  Lightbulb,
} from 'lucide-react';
import { Settings } from '../../types';
import { NavTab } from './BottomNav';
import { HapticService } from '../../services/hapticService';

interface HeaderProps {
  settings: Settings;
  totalExpensesMonth: number;
  dailySafeToSpend?: number;
  currentTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onLock: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenGoals?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  totalExpensesMonth,
  dailySafeToSpend,
  currentTab,
  onTabChange,
  onLock,
  onOpenSettings,
  onOpenBackup,
  onOpenGoals,
}) => {
  const currency = settings.currency || '€';
  const income = settings.monthlyIncome || 0;
  const balance = income - totalExpensesMonth;
  const isPositive = balance >= 0;

  const desktopTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buckets', label: 'Bolsas', icon: PieChart },
    { id: 'recurring', label: 'Recurrentes', icon: Repeat },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'tips', label: 'Estrategias', icon: Lightbulb },
  ] as const;

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center space-x-3 shrink-0">
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
              <span className="truncate max-w-[120px] sm:max-w-[200px]">
                {settings.companyName || settings.userFullName || 'Bóveda Financiera'}
              </span>
            </p>
          </div>
        </div>

        {/* Navegación Desktop / Tablet (md:flex) */}
        {currentTab && onTabChange && (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner" aria-label="Navegación de escritorio">
            {desktopTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    HapticService.selection();
                    onTabChange(tab.id);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs scale-102'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Balance rápido del Mes & Acciones */}
        <div className="flex items-center space-x-2 shrink-0">
          {dailySafeToSpend !== undefined && (
            <div className="hidden xs:flex flex-col items-end px-2.5 py-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                <span>Hoy</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {dailySafeToSpend.toFixed(2)} {currency}
              </span>
            </div>
          )}

          <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-800">
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

          {/* Botón Metas de Ahorro */}
          {onOpenGoals && (
            <button
              onClick={() => {
                HapticService.impactLight();
                onOpenGoals();
              }}
              className="p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-purple-950/40 text-purple-300 hover:text-purple-200 transition-all border border-purple-500/30 cursor-pointer shadow-xs active:scale-95"
              title="Metas de Ahorro & Sinking Funds"
              aria-label="Metas de Ahorro & Sinking Funds"
            >
              <Target className="w-4 h-4" />
            </button>
          )}

          {/* Botón Copias de Seguridad */}
          <button
            onClick={() => {
              HapticService.impactLight();
              onOpenBackup();
            }}
            className="p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-all border border-emerald-500/30 cursor-pointer shadow-xs active:scale-95"
            title="Copias de Seguridad (Google Drive 2 Ranuras)"
            aria-label="Copias de Seguridad en Google Drive"
          >
            <Cloud className="w-4 h-4" />
          </button>

          {/* Botón Ajustes */}
          <button
            onClick={() => {
              HapticService.impactLight();
              onOpenSettings();
            }}
            className="p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/50 cursor-pointer active:scale-95"
            title="Ajustes y Bóveda"
            aria-label="Ajustes y Bóveda de Configuración"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Botón Candado Bloqueo Manual */}
          <button
            onClick={() => {
              HapticService.impactHeavy();
              onLock();
            }}
            className="p-2 min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-emerald-950/40 hover:bg-rose-950/40 border border-emerald-500/30 hover:border-rose-500/40 text-emerald-400 hover:text-rose-400 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Bloquear sesión inmediatamente"
            aria-label="Bloquear sesión inmediatamente"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
