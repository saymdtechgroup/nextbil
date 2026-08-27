import React from 'react';
import { Home, PieChart, Users, ArrowDownToLine, User } from 'lucide-react';
import { ActiveScreen } from '../types/crypto';

interface BottomNavBarProps {
  activeScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  idPrefix?: string;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeScreen,
  onSelectScreen,
  idPrefix = 'nav'
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'assets', label: 'Assets', icon: PieChart },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowDownToLine },
    { id: 'mine', label: 'Mine', icon: User },
  ] as const;

  return (
    <div
      id={`${idPrefix}-bar`}
      className="sticky bottom-0 left-0 right-0 z-30 bg-[#0e0720]/95 backdrop-blur-xl border-t border-amber-500/20 px-2 py-2 shadow-2xl flex items-center justify-around"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            id={`${idPrefix}-btn-${item.id}`}
            onClick={() => onSelectScreen(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 relative group ${
              isActive
                ? 'text-amber-300 font-semibold'
                : 'text-purple-300/60 hover:text-purple-200'
            }`}
          >
            {/* Active Top Glowing Indicator */}
            {isActive && (
              <div className="absolute -top-2 w-8 h-[2px] bg-gradient-to-r from-amber-400 via-fuchsia-500 to-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}

            {/* Icon with glowing backdrop when active */}
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-amber-500/20 to-fuchsia-600/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'group-hover:bg-purple-900/30'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
            </div>

            <span className="text-[11px] mt-0.5 tracking-tight font-medium">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
