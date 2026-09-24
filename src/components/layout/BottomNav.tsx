import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Repeat,
  Calendar,
  Lightbulb,
} from 'lucide-react';

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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 transition-all"
      style={{
        paddingBottom: 'calc(max(0.7cm, env(safe-area-inset-bottom, 0px)) + 0.35rem)',
      }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
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
