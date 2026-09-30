import {
  LayoutDashboard,
  PieChart,
  Repeat,
  Calendar,
  Lightbulb,
} from 'lucide-react';
import { HapticService } from '../../services/hapticService';

export type NavTab = 'dashboard' | 'buckets' | 'recurring' | 'calendar' | 'tips';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buckets', label: 'Bolsas', icon: PieChart },
    { id: 'recurring', label: 'Recurrentes', icon: Repeat },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'tips', label: 'Consejos', icon: Lightbulb },
  ] as const;

  const handleTabClick = (tabId: NavTab) => {
    HapticService.selection();
    onTabChange(tabId);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800/80 px-2 py-1.5 transition-colors md:hidden"
      style={{
        paddingBottom: 'calc(max(0.7cm, env(safe-area-inset-bottom, 0px)) + 0.35rem)',
      }}
      aria-label="Navegación principal inferior"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              aria-label={`Ir a pestaña ${tab.label}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-emerald-500/15 shadow-xs shadow-emerald-500/30' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
