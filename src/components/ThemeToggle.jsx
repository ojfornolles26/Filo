/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ThemeToggle({ isDark, toggleTheme }) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className="relative p-2 rounded-full border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-transparent cursor-pointer editorial-transition flex items-center justify-center focus:outline-none"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle visual theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? "dark" : "light"}
          initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-stone-900 dark:text-stone-100"
        >
          {isDark ? (
            <Sun className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Moon className="h-4 w-4" strokeWidth={1.5} />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
