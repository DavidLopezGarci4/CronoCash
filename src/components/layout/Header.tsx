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
  Eye,
  EyeOff,
} from 'lucide-react';
import { Settings } from '../../types';
import { NavTab } from './BottomNav';
import { HapticService } from '../../services/hapticService';
import { usePrivacy } from '../../context/PrivacyContext';

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
  const { isPrivate, togglePrivacy, mask } = usePrivacy();
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
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-2.5 xs:px-3 sm:px-4 py-2 sm:py-2.5 transition-colors">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-3">
        {/* Logo & Marca */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0">
          <div className="relative shrink-0">
            <img
              src="/logo.jpg"
              alt="Logo"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-emerald-500/30 shadow-md shadow-emerald-500/10"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#090d16]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none truncate">
              CronoCash
            </h1>
            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[180px]">
                {settings.companyName || settings.userFullName || 'Bóveda'}
              </span>
            </p>
          </div>
        </div>

        {/* Navegación Desktop / Tablet (md:flex) */}
        {currentTab && onTabChange && (
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner" aria-label="Navegación de escritorio">
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
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs scale-102 font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
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
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
          {dailySafeToSpend !== undefined && (
            <div className="hidden sm:flex flex-col items-end px-2.5 py-1 bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
              <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span>Hoy</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {mask(dailySafeToSpend, currency)}
              </span>
            </div>
          )}

          <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Disponible Mes
            </span>
            <div className={`text-xs font-mono font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>
                {balance >= 0 ? '+' : ''}{mask(balance, currency)}
              </span>
            </div>
          </div>

          {/* Botón Modo Privacidad (Ojo) */}
          <button
            onClick={togglePrivacy}
            className={`p-1.5 xs:p-2 min-w-[34px] min-h-[34px] xs:min-w-[38px] xs:min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center rounded-xl transition-all border cursor-pointer shadow-xs active:scale-95 ${
              isPrivate
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/50 shadow-amber-950/20'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700/60'
            }`}
            title={isPrivate ? 'Mostrar importes (Modo Privacidad activo)' : 'Ocultar importes más sensibles (Modo Privacidad)'}
            aria-label={isPrivate ? 'Mostrar importes sensibles' : 'Ocultar importes sensibles'}
          >
            {isPrivate ? (
              <EyeOff className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            )}
          </button>

          {/* Botón Metas de Ahorro */}
          {onOpenGoals && (
            <button
              onClick={() => {
                HapticService.impactLight();
                onOpenGoals();
              }}
              className="p-1.5 xs:p-2 min-w-[34px] min-h-[34px] xs:min-w-[38px] xs:min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-slate-800/80 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-200 transition-all border border-purple-200 dark:border-purple-500/30 cursor-pointer shadow-xs active:scale-95"
              title="Metas de Ahorro & Sinking Funds"
              aria-label="Metas de Ahorro & Sinking Funds"
            >
              <Target className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            </button>
          )}

          {/* Botón Copias de Seguridad */}
          <button
            onClick={() => {
              HapticService.impactLight();
              onOpenBackup();
            }}
            className="p-1.5 xs:p-2 min-w-[34px] min-h-[34px] xs:min-w-[38px] xs:min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-all border border-slate-200 dark:border-emerald-500/30 cursor-pointer shadow-xs active:scale-95"
            title="Copias de Seguridad (Google Drive 2 Ranuras)"
            aria-label="Copias de Seguridad en Google Drive"
          >
            <Cloud className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </button>

          {/* Botón Ajustes */}
          <button
            onClick={() => {
              HapticService.impactLight();
              onOpenSettings();
            }}
            className="p-1.5 xs:p-2 min-w-[34px] min-h-[34px] xs:min-w-[38px] xs:min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700/50 cursor-pointer active:scale-95"
            title="Ajustes y Bóveda"
            aria-label="Ajustes y Bóveda de Configuración"
          >
            <SettingsIcon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </button>

          {/* Botón Candado Bloqueo Manual */}
          <button
            onClick={() => {
              HapticService.impactHeavy();
              onLock();
            }}
            className="p-1.5 xs:p-2 min-w-[34px] min-h-[34px] xs:min-w-[38px] xs:min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-rose-50 dark:bg-emerald-950/40 dark:hover:bg-rose-950/40 border border-emerald-200 hover:border-rose-200 dark:border-emerald-500/30 dark:hover:border-rose-500/40 text-emerald-700 hover:text-rose-700 dark:text-emerald-400 dark:hover:text-rose-400 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Bloquear sesión inmediatamente"
            aria-label="Bloquear sesión inmediatamente"
          >
            <Lock className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
