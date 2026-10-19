import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ThemeToggle: React.FC<{ variant?: 'minimal' | 'expanded' }> = ({ variant = 'minimal' }) => {
  const { theme, mode, setMode, toggleTheme } = useTheme();

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        title={`Current mode: ${mode} (${theme}). Click to switch.`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-300" />
        ) : (
          <Moon className="w-4 h-4 text-slate-800" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-white/10 dark:bg-black/20 rounded-lg border border-white/15">
      <button
        onClick={() => setMode('light')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
          mode === 'light'
            ? 'bg-amber-400 text-slate-950 shadow-sm font-semibold'
            : 'text-white/80 hover:text-white'
        }`}
        title="Light theme"
      >
        <Sun className="w-3.5 h-3.5" />
        <span>Light</span>
      </button>

      <button
        onClick={() => setMode('dark')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
          mode === 'dark'
            ? 'bg-amber-400 text-slate-950 shadow-sm font-semibold'
            : 'text-white/80 hover:text-white'
        }`}
        title="Dark regal theme"
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Dark</span>
      </button>

      <button
        onClick={() => setMode('system')}
        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
          mode === 'system'
            ? 'bg-amber-400 text-slate-950 shadow-sm font-semibold'
            : 'text-white/80 hover:text-white'
        }`}
        title="Sync with device preference"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span>System</span>
      </button>
    </div>
  );
};
