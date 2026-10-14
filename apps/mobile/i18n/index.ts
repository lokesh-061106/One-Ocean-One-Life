import en from './en.json';
import ta from './ta.json';

export type TranslationKey = keyof typeof en;

const translations: Record<string, Record<TranslationKey, string>> = {
  en,
  ta,
};

let currentLanguage = 'en';

export function setLanguage(lang: string) {
  currentLanguage = lang;
}

export function t(key: TranslationKey): string {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

export function getLanguage(): string {
  return currentLanguage;
}
