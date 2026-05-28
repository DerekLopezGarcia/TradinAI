'use client';

import { useState, useEffect, useCallback } from 'react';

type Locale = 'es' | 'en';

const STORAGE_KEY = 'trading-ia-locale';
const DEFAULT_LOCALE: Locale = 'es';

const messagesCache = new Map<Locale, Record<string, string>>();

function loadMessages(locale: Locale): Record<string, string> {
  try {
    return require(`./locales/${locale}.json`);
  } catch {
    return {};
  }
}

function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = values[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'es') return stored;
  return DEFAULT_LOCALE;
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>): string => {
      const messages = loadMessages(locale);
      const template = messages[key];
      if (!template) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`);
        }
        const fallbackMessages = loadMessages('es');
        const fallback = fallbackMessages[key];
        return fallback ? interpolate(fallback, values) : key;
      }
      return interpolate(template, values);
    },
    [locale]
  );

  return { t, locale, setLocale };
}
