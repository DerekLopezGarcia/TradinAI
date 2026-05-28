'use client';

import { useState, useEffect, useCallback } from 'react';
import esMessages from './locales/es.json';
import enMessages from './locales/en.json';

export type Locale = 'es' | 'en';

const STORAGE_KEY = 'trading-ia-locale';
const DEFAULT_LOCALE: Locale = 'es';

const allMessages: Record<Locale, Record<string, string>> = {
  es: esMessages,
  en: enMessages,
};

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = values[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch { /* localStorage not available */ }
  return DEFAULT_LOCALE;
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch { /* localStorage not available */ }
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const messages = allMessages[locale];
      const template = messages?.[key];
      if (!template) {
        const fallback = allMessages['es']?.[key];
        if (!fallback && process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation key: "${key}"`);
        }
        return fallback ? interpolate(fallback, values) : key;
      }
      return interpolate(template, values);
    },
    [locale]
  );

  return { t, locale, setLocale, isEnglish: locale === 'en' };
}
