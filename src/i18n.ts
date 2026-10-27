import pt from './locales/pt.ts';
import en from './locales/en.ts';
import es from './locales/es.ts';
import fr from './locales/fr.ts';

export const LOCALES = ['pt', 'en', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export type MessageKey = keyof typeof pt;
export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  pt,
  en,
  es,
  fr,
};
export const LANGUAGE_KEY = 'astronymic.language';
export const DOCUMENT_LANG: Record<Locale, string> = {
  pt: 'pt-BR',
  en: 'en',
  es: 'es',
  fr: 'fr',
};
type Values = Record<string, string | number>;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
  );
}
/** An explicit saved choice wins; otherwise use the first supported browser language. */
export function resolveLocale(
  languages: readonly string[],
  saved: unknown = null,
): Locale {
  if (isLocale(saved)) return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (isLocale(base)) return base;
  }
  return 'pt';
}
export function loadLocale(): Locale {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LANGUAGE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
  return resolveLocale(
    navigator.languages?.length ? navigator.languages : [navigator.language],
    saved,
  );
}
export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, locale);
  } catch {
    /* Changing language still works without persistence. */
  }
}
export function createTranslator(locale: Locale) {
  const lang = DOCUMENT_LANG[locale];
  const numbers = new Intl.NumberFormat(lang, { maximumFractionDigits: 2 });
  const decimals = new Intl.NumberFormat(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const percentages = new Intl.NumberFormat(lang, {
    style: 'percent',
    maximumFractionDigits: 2,
  });
  const rules = new Intl.PluralRules(lang);
  function text(key: MessageKey, values: Values = {}): string {
    return MESSAGES[locale][key].replace(/\{(\w+)\}/g, (_, name: string) => {
      if (!Object.hasOwn(values, name))
        throw new Error(`Missing translation value ${name} for ${key}`);
      return String(values[name]);
    });
  }
  return {
    locale,
    text,
    number: (value: number) => numbers.format(value),
    decimal: (value: number) => decimals.format(value),
    percent: (value: number) => percentages.format(value),
    plural: (
      one: MessageKey,
      many: MessageKey,
      count: number,
      values: Values = {},
    ) =>
      text(rules.select(count) === 'one' ? one : many, {
        count: numbers.format(count),
        ...values,
      }),
  };
}
export type Translator = ReturnType<typeof createTranslator>;

export const DEFAULT_TRANSLATOR = createTranslator('pt');
