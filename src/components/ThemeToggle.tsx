import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  variant?: 'button' | 'switch' | 'compact';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDark,
  onToggle,
  variant = 'button',
  className = '',
  showLabel = false,
}) => {
  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabel && (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isDark ? 'Mode Gelap' : 'Mode Terang'}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
            isDark
              ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-inner'
              : 'bg-slate-200 dark:bg-slate-700 shadow-inner'
          }`}
        >
          {/* Track background subtle glowing dots */}
          <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] pointer-events-none opacity-60">
            <Sun className={`w-3 h-3 text-amber-500 transition-opacity duration-300 ${isDark ? 'opacity-30' : 'opacity-100'}`} />
            <Moon className={`w-3 h-3 text-indigo-200 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-30'}`} />
          </div>

          {/* Sliding Thumb with Spring & Cross-fade */}
          <motion.div
            layout
            transition={{
              type: 'spring',
              stiffness: 600,
              damping: 35,
            }}
            className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-colors duration-300 ${
              isDark ? 'ml-auto bg-slate-900 text-amber-400' : 'mr-auto bg-white text-amber-500'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDark ? 'dark-thumb' : 'light-thumb'}
                initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex items-center justify-center"
              >
                {isDark ? (
                  <Moon className="h-3 w-3 text-amber-300 drop-shadow-[0_0_4px_rgba(252,211,77,0.5)]" />
                ) : (
                  <Sun className="h-3 w-3 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </button>
      </div>
    );
  }

  // Button variant (Compact icon button with rotational cross-fade)
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      type="button"
      onClick={onToggle}
      title={isDark ? 'Beralih ke Mode Terang (Light)' : 'Beralih ke Mode Gelap (Dark)'}
      aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      className={`relative p-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors duration-300 cursor-pointer overflow-hidden group ${className}`}
    >
      {/* Subtle background glow effect on hover */}
      <span
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isDark
            ? 'bg-amber-400/5 dark:bg-amber-400/10'
            : 'bg-amber-500/5'
        }`}
      />

      {/* Cross-Fade and Rotate Animation Container */}
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isDark ? 'dark-icon' : 'light-icon'}
            initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
            transition={{
              duration: 0.24,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="flex items-center justify-center"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 group-hover:text-amber-600 transition-colors duration-200" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.button>
  );
};
