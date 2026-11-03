import React from 'react';
import { NavLink } from 'react-router-dom';
import { Radio, Heart, Settings } from 'lucide-react';

export const MobileNav: React.FC<{ playerActive?: boolean }> = ({ playerActive = false }) => {
  return (
    <nav className={`md:hidden fixed ${playerActive ? 'mobile-nav-with-player' : 'bottom-0'} left-0 right-0 z-30 bg-white/90 backdrop-blur-2xl border-t border-slate-200/80 dark:bg-[#171719]/92 dark:border-white/[.08] px-2 py-1 flex items-center justify-around text-[10px]`}>
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Radio className="w-4 h-4 mb-0.5" />
        <span>Próximas</span>
      </NavLink>
      <NavLink
        to="/favorites"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Heart className="w-4 h-4 mb-0.5" />
        <span>Favoritas</span>
      </NavLink>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-2 rounded-lg transition-colors ${
            isActive ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Settings className="w-4 h-4 mb-0.5" />
        <span>Ajustes</span>
      </NavLink>
    </nav>
  );
};
