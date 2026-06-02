import { en } from './messages/en'
import { hi } from './messages/hi'

export const SUPPORTED_LOCALES = ['en', 'hi'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

type Params = Record<string, unknown>
const catalogs: Record<Locale, Record<string, string>> = { en, hi }

function interpolate(tpl: string, params?: Params): string {
  if (!params) return tpl
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] != null ? String(params[k]) : `{${k}}`))
}

export function isSupportedLocale(x: string): x is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(x)
}

// Map a single language tag ('hi', 'hi-IN', 'en-US') to a supported locale, else default.
export function resolveLocale(lang?: string | null): Locale {
  if (!lang) return DEFAULT_LOCALE
  const base = lang.split('-')[0].toLowerCase()
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE
}

// Parse an Accept-Language header; return the first supported locale.
export function parseAcceptLanguage(header?: string | null): Locale {
  if (!header) return DEFAULT_LOCALE
  for (const part of header.split(',')) {
    const base = part.split(';')[0].trim().split('-')[0].toLowerCase()
    if (isSupportedLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

// Resolve a localized message for an error code. Fallback: locale → en → the code.
export function translate(locale: Locale, code: string, params?: Params): string {
  const tpl = catalogs[locale]?.[code] ?? catalogs.en[code] ?? code
  return interpolate(tpl, params)
}
