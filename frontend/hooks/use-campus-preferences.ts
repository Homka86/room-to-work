'use client';

import { useState, useEffect } from 'react';
import { TRANSLATIONS, type Language } from '@/lib/translations';

export function useCampusPreferences() {
  const [lang, setLang] = useState<Language>('ru');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedLang = localStorage.getItem('campus_lang') as Language | null;
        if (savedLang === 'ru' || savedLang === 'en') {
          setLang(savedLang);
        }
        const savedTheme = localStorage.getItem('campus_theme') as 'light' | 'dark' | null;
        if (savedTheme) {
          setTheme(savedTheme);
          if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
          document.documentElement.classList.add('dark');
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function toggleLanguage() {
    const nextLang: Language = lang === 'ru' ? 'en' : 'ru';
    setLang(nextLang);
    try {
      localStorage.setItem('campus_lang', nextLang);
    } catch {}
  }

  function toggleTheme() {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('campus_theme', nextTheme);
    } catch {}
  }

  const t = TRANSLATIONS[lang];

  return {
    lang,
    theme,
    t,
    toggleLanguage,
    toggleTheme,
  };
}
