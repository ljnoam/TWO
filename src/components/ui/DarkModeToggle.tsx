'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  console.log('theme actuel:', theme)
  const [mounted, setMounted] = useState(false);

  // ✅ évite le mismatch: on attend le mount client
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder neutre = même HTML SSR/CSR → pas de mismatch
    return (
      <button
        className="rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-3 py-2 inline-flex items-center gap-2 shadow opacity-0"
        aria-hidden
        tabIndex={-1}
      >
        <Sun className="h-4 w-4" />
        <span className="text-sm">Thème</span>
      </button>
    );
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && resolvedTheme === 'dark');

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 backdrop-blur px-3 py-2 inline-flex items-center gap-2 shadow"
      aria-label="Basculer le thème"
      title="Basculer le thème"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="text-sm">{isDark ? 'Clair' : 'Sombre'}</span>
    </button>
  );
}
