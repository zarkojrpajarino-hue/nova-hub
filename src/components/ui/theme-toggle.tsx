/**
 * ThemeToggle — Dark/Light mode switch
 * LanguageToggle — 6-language selector (ES/EN/FR/DE/PT/IT)
 */

import { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { SUPPORTED_LANGUAGES } from '@/i18n';

// ─── Theme Toggle ────────────────────────────────────────

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(!dark)}
      className={className}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

// ─── Language Toggle (dropdown) ──────────────────────────

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentCode = SUPPORTED_LANGUAGES.find(
    (l) => i18n.language?.startsWith(l.code)
  )?.code ?? 'es';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-1.5 text-xs"
      >
        <Globe className="h-3.5 w-3.5" />
        {currentCode.toUpperCase()}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                currentCode === lang.code ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
