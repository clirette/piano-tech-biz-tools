import { CompanySettings, DEFAULT_COMPANY_SETTINGS, DEFAULT_PAYMENT_SETTINGS } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'piano-estimate:company';

/** Merge stored value with defaults so new fields appear without wiping saved data */
function mergeWithDefaults(stored: CompanySettings): CompanySettings {
  return {
    ...DEFAULT_COMPANY_SETTINGS,
    ...stored,
    payment: { ...DEFAULT_PAYMENT_SETTINGS, ...(stored.payment ?? {}) },
  };
}

export function useCompanySettings() {
  const [raw, setSettings] = useLocalStorage<CompanySettings>(
    STORAGE_KEY,
    DEFAULT_COMPANY_SETTINGS,
  );

  const settings = mergeWithDefaults(raw);

  return { settings, setSettings };
}
