import esMessages from './locales/es.json';
import enMessages from './locales/en.json';
import { getStoredLocale } from './useTranslation';
import type { Locale } from './useTranslation';

const allMessages: Record<Locale, Record<string, string>> = {
  es: esMessages as Record<string, string>,
  en: enMessages as Record<string, string>,
};

export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = values[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

export function t(key: string, values?: Record<string, string | number>): string {
  const locale = getStoredLocale();
  const messages = allMessages[locale];
  const template = messages?.[key];
  if (!template) {
    const fallback = allMessages['es']?.[key];
    if (!fallback) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
      return key;
    }
    return interpolate(fallback, values);
  }
  return interpolate(template, values);
}

export function translate(key: string, locale: Locale, values?: Record<string, string | number>): string {
  const messages = allMessages[locale];
  const template = messages?.[key];
  if (!template) {
    const fallback = allMessages['es']?.[key];
    if (!fallback) return key;
    return interpolate(fallback, values);
  }
  return interpolate(template, values);
}
